import { WebSocket, WebSocketServer } from "ws";
import type { Pool } from "pg";
import { z } from "zod";
import { importGame, SCENARIOS } from "../../../packages/game-core/src/v1";
import {
  applyV1RoomCommand,
  controlClock,
  joinV1Room,
  newV1Room,
  v1RoomView,
  type V1Room,
} from "./v1-rooms";

const code = z.string().regex(/^[a-zA-Z0-9-]{3,32}$/);
const options = z
  .object({
    count: z.number().int().min(2).max(5),
    scenario: z.enum(SCENARIOS),
    firms: z.array(z.number().int().min(0).max(4)).min(2).max(5),
    timerMinutes: z.number().int().min(1).max(60).nullable(),
  })
  .strict();
const MessageSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("create"),
      room: code,
      options,
      token: z.string().regex(/^[a-zA-Z0-9_-]{43}$/),
    })
    .strict(),
  z
    .object({
      type: z.literal("join"),
      room: code,
      token: z.string().min(1).max(100).optional(),
      claimToken: z
        .string()
        .regex(/^[a-zA-Z0-9_-]{43}$/)
        .optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("command"),
      revision: z.number().int().min(0),
      command: z.unknown(),
    })
    .strict(),
  z.object({ type: z.literal("refresh") }).strict(),
  z
    .object({
      type: z.literal("timer"),
      revision: z.number().int().min(0),
      action: z.enum(["pause", "resume", "reset"]),
    })
    .strict(),
]);
export async function createV1SocketServer(
  pool: Pool | null,
  origins: string[],
) {
  if (pool)
    await pool.query(
      "CREATE TABLE IF NOT EXISTS game_rooms_v1 (id TEXT PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())",
    );
  const rooms = new Map<string, V1Room>(),
    sockets = new Map<WebSocket, { room: string; player: string }>(),
    queues = new Map<string, Promise<void>>();
  const server = new WebSocketServer({
    noServer: true,
    maxPayload: 32768,
    verifyClient: (info: { origin: string }) => origins.includes(info.origin),
  });
  async function persist(room: V1Room) {
    if (pool)
      try {
        await pool.query(
          "INSERT INTO game_rooms_v1(id,payload) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET payload=$2,updated_at=NOW()",
          [room.id, JSON.stringify(room)],
        );
      } catch {
        console.error(
          JSON.stringify({
            level: "error",
            event: "v1-persistence-failed",
            room: room.id,
          }),
        );
        throw new Error(
          "Bordets gemning fejlede. Valget er ikke gennemført; prøv igen, når forbindelsen er klar.",
        );
      }
  }
  async function lookup(id: string) {
    let room = rooms.get(id);
    if (!room && pool) {
      const r = await pool.query(
        "SELECT payload FROM game_rooms_v1 WHERE id=$1",
        [id],
      );
      if (r.rows.length) {
        room = r.rows[0].payload as V1Room;
        room.state = importGame(JSON.stringify(room.state));
        if (rooms.size >= 100)
          throw new Error("Serveren har ikke plads til flere aktive borde.");
        rooms.set(id, room);
      }
    }
    return room;
  }
  const connected = (id: string) =>
    [...sockets.values()].filter((x) => x.room === id).map((x) => x.player);
  function broadcast(room: V1Room) {
    for (const [socket, identity] of sockets)
      if (identity.room === room.id && socket.readyState === WebSocket.OPEN)
        socket.send(
          JSON.stringify(
            v1RoomView(
              room,
              identity.player,
              pool ? "postgres" : "memory",
              connected(room.id),
            ),
          ),
        );
  }
  server.on("connection", (socket) => {
    let allowance = 30,
      last = Date.now(),
      alive = true;
    socket.on("pong", () => {
      alive = true;
    });
    socket.on("message", (data) => {
      const now = Date.now();
      allowance = Math.min(30, allowance + ((now - last) / 1000) * 5);
      last = now;
      if (allowance < 1) {
        socket.close(1008, "For mange forespørgsler");
        return;
      }
      allowance--;
      let msg: z.infer<typeof MessageSchema>;
      try {
        msg = MessageSchema.parse(JSON.parse(data.toString()));
      } catch {
        socket.send(
          JSON.stringify({
            type: "error",
            error: "Forespørgslen blev afvist.",
          }),
        );
        return;
      }
      const identity = sockets.get(socket),
        id =
          msg.type === "create" || msg.type === "join"
            ? msg.room
            : identity?.room;
      if (!id) {
        socket.send(
          JSON.stringify({
            type: "error",
            error: "Tag plads ved et bord først.",
          }),
        );
        return;
      }
      const task = (queues.get(id) ?? Promise.resolve())
        .then(async () => {
          try {
            if (msg.type === "create" || msg.type === "join") {
              if (sockets.has(socket))
                throw new Error(
                  "Du har allerede en plads i denne forbindelse.",
                );
              let room = await lookup(id);
              let created = false;
              if (msg.type === "create" && !room) {
                if (rooms.size >= 100)
                  throw new Error(
                    "Serveren har ikke plads til flere aktive borde.",
                  );
                room = newV1Room(id, msg.options);
                created = true;
              }
              if (!room)
                throw new Error(
                  "Bordet findes ikke. Værten skal oprette det først.",
                );
              const previous = structuredClone(room);
              try {
                const seat =
                  msg.type === "create"
                    ? joinV1Room(
                        room,
                        created ? undefined : msg.token,
                        created ? msg.token : undefined,
                      )
                    : joinV1Room(room, msg.token, msg.claimToken);
                await persist(room);
                rooms.set(id, room);
                sockets.set(socket, { room: id, player: seat.player });
                socket.send(
                  JSON.stringify({
                    ...v1RoomView(
                      room,
                      seat.player,
                      pool ? "postgres" : "memory",
                      connected(id),
                    ),
                    token: seat.token,
                  }),
                );
                broadcast(room);
              } catch (e) {
                if (!created) rooms.set(id, previous);
                throw e;
              }
            } else {
              const identity = sockets.get(socket);
              if (!identity) throw new Error("Forbindelsen har ingen plads.");
              const room = await lookup(id);
              if (!room) throw new Error("Bordet findes ikke længere.");
              if (msg.type === "command") {
                const previous = structuredClone(room);
                try {
                  const changed = applyV1RoomCommand(
                    room,
                    identity.player,
                    msg.revision,
                    msg.command,
                  );
                  if (changed) await persist(room);
                } catch (e) {
                  rooms.set(id, previous);
                  throw e;
                }
                broadcast(room);
                const command = msg.command as { id: string };
                socket.send(
                  JSON.stringify({
                    type: "ack",
                    id: command.id,
                    revision: room.revision,
                  }),
                );
              } else if (msg.type === "timer") {
                const previous = structuredClone(room);
                try {
                  controlClock(room, identity.player, msg.revision, msg.action);
                  await persist(room);
                } catch (e) {
                  rooms.set(id, previous);
                  throw e;
                }
                broadcast(room);
              } else
                socket.send(
                  JSON.stringify(
                    v1RoomView(
                      room,
                      identity.player,
                      pool ? "postgres" : "memory",
                      connected(id),
                    ),
                  ),
                );
            }
          } catch (e) {
            if (socket.readyState === WebSocket.OPEN) {
              const command =
                msg.type === "command" &&
                msg.command &&
                typeof msg.command === "object"
                  ? (msg.command as { id?: unknown })
                  : null;
              socket.send(
                JSON.stringify({
                  type: "error",
                  fatal: msg.type === "create" || msg.type === "join",
                  ...(typeof command?.id === "string"
                    ? { id: command.id }
                    : {}),
                  error: e instanceof Error ? e.message : "Valget blev afvist.",
                }),
              );
              const identity = sockets.get(socket),
                room = identity ? rooms.get(identity.room) : null;
              if (identity && room)
                socket.send(
                  JSON.stringify(
                    v1RoomView(
                      room,
                      identity.player,
                      pool ? "postgres" : "memory",
                      connected(room.id),
                    ),
                  ),
                );
            }
          }
        })
        .catch(() => {
          if (socket.readyState === WebSocket.OPEN)
            socket.close(1011, "Bordets forbindelse fejlede");
        });
      queues.set(id, task);
      void task.finally(() => {
        if (queues.get(id) === task) queues.delete(id);
      });
    });
    const heartbeat = setInterval(() => {
      if (!alive) {
        socket.terminate();
        return;
      }
      alive = false;
      socket.ping();
    }, 30000);
    socket.on("close", () => {
      clearInterval(heartbeat);
      const identity = sockets.get(socket);
      sockets.delete(socket);
      const room = identity ? rooms.get(identity.room) : null;
      if (room) broadcast(room);
    });
  });
  return server;
}
