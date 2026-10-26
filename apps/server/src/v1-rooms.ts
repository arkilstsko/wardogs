import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  CommandSchema,
  createGame,
  execute,
  viewFor,
  type Configuration,
  type Game,
} from "../../../packages/game-core/src/v1";
import { tokenHash } from "./rooms";

export interface NegotiationClock {
  round: number;
  remainingMs: number;
  runningSince: number | null;
}
export interface V1Room {
  version: 2;
  id: string;
  state: Game;
  revision: number;
  seats: Record<string, string>;
  createdAt: number;
  updatedAt: number;
  clock?: NegotiationClock;
}
export type RoomOptions = Omit<Configuration, "seed">;
export function newV1Room(id: string, options: RoomOptions): V1Room {
  const now = Date.now();
  return {
    version: 2,
    id,
    state: createGame({ ...options, seed: randomBytes(32).toString("hex") }),
    revision: 0,
    seats: {},
    createdAt: now,
    updatedAt: now,
  };
}
export function joinV1Room(room: V1Room, token?: string, claimToken?: string) {
  if (token) {
    const hash = tokenHash(token),
      seat = Object.entries(room.seats).find(
        ([, h]) =>
          h.length === 64 &&
          timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(hash, "hex")),
      )?.[0];
    if (!seat)
      throw new Error(
        "Genforbindelsesnøglen er ugyldig. Din gamle plads er ikke blevet overtaget.",
      );
    return { player: seat, token };
  }
  if (claimToken) {
    const hash = tokenHash(claimToken),
      existing = Object.entries(room.seats).find(
        ([, h]) =>
          h.length === 64 &&
          timingSafeEqual(Buffer.from(h, "hex"), Buffer.from(hash, "hex")),
      )?.[0];
    if (existing) return { player: existing, token: claimToken };
  }
  const seat = room.state.players.find((p) => !room.seats[p.id]);
  if (!seat)
    throw new Error("Bordet er fuldt. Brug nøglen til din eksisterende plads.");
  const nextToken = claimToken ?? randomBytes(32).toString("base64url");
  room.seats[seat.id] = tokenHash(nextToken);
  room.updatedAt = Date.now();
  return { player: seat.id, token: nextToken };
}
export function applyV1RoomCommand(
  room: V1Room,
  actor: string,
  revision: number,
  raw: unknown,
) {
  const parsed = CommandSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Handlingen har ugyldige felter.");
  const cmd = parsed.data;
  if (cmd.player !== actor)
    throw new Error("Du kan kun styre dit eget handelshus.");
  if (cmd.type === "advance" && actor !== "p0")
    throw new Error("Kun værten fører bordet til næste fælles fase.");
  if (
    cmd.type === "advance" &&
    room.state.phase === "setup" &&
    Object.keys(room.seats).length !== room.state.players.length
  )
    throw new Error("Alle valgte spillere skal have taget plads først.");
  // Core retry validation also rejects an ID reused with a different payload.
  if (room.state.commands.some((c) => c.id === cmd.id)) {
    execute(room.state, cmd);
    return false;
  }
  if (revision !== room.revision)
    throw new Error(
      "Bordet er ændret. Den nyeste visning er hentet; kontrollér dit valg igen.",
    );
  const result = execute(room.state, cmd);
  room.state = result;
  room.revision++;
  room.updatedAt = Date.now();
  syncClock(room, room.updatedAt);
  return true;
}
export function syncClock(room: V1Room, now: number) {
  const s = room.state;
  if (s.config.timerMinutes === null) return;
  if (s.phase === "negotiation" && room.clock?.round !== s.round)
    room.clock = {
      round: s.round,
      remainingMs: s.config.timerMinutes * 60000,
      runningSince: now,
    };
  const c = room.clock;
  if (
    c &&
    c.runningSince !== null &&
    (s.phase !== "negotiation" || s.ready.length === s.players.length)
  ) {
    c.remainingMs = Math.max(0, c.remainingMs - (now - c.runningSince));
    c.runningSince = null;
  }
}
export function controlClock(
  room: V1Room,
  actor: string,
  revision: number,
  action: "pause" | "resume" | "reset",
  now = Date.now(),
) {
  if (actor !== "p0")
    throw new Error("Kun værten styrer det fælles forhandlingsur.");
  if (revision !== room.revision)
    throw new Error("Bordet er ændret. Kontrollér uret igen.");
  if (
    room.state.phase !== "negotiation" ||
    room.state.config.timerMinutes === null ||
    room.state.ready.length === room.state.players.length
  )
    throw new Error("Forhandlingsuret er ikke åbent nu.");
  syncClock(room, now);
  const c = room.clock!;
  if (action === "pause" && c.runningSince !== null) {
    c.remainingMs = Math.max(0, c.remainingMs - (now - c.runningSince));
    c.runningSince = null;
  }
  if (action === "resume" && c.runningSince === null) c.runningSince = now;
  if (action === "reset") {
    c.remainingMs = room.state.config.timerMinutes * 60000;
    c.runningSince = null;
  }
  room.revision++;
  room.updatedAt = now;
}
export function v1RoomView(
  room: V1Room,
  actor: string,
  persistence: "memory" | "postgres",
  connected: string[] = [],
) {
  return {
    type: "state" as const,
    edition: "wardogs-1.0" as const,
    view: viewFor(room.state, actor),
    player: actor,
    revision: room.revision,
    persistence,
    occupied: Object.keys(room.seats),
    connected: [...new Set(connected)],
    clock: room.clock ?? null,
    serverNow: Date.now(),
  };
}
