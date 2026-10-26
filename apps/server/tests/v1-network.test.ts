import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { WebSocket, type WebSocketServer } from "ws";
import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { createV1SocketServer } from "../src/v1-sockets";
import { controlClock, newV1Room, syncClock } from "../src/v1-rooms";

const clients: WebSocket[] = [],
  servers: Array<{ http: Server; ws: WebSocketServer }> = [];
afterEach(async () => {
  clients.forEach((c) => c.terminate());
  clients.length = 0;
  for (const s of servers) {
    for (const c of s.ws.clients) c.terminate();
    await new Promise<void>((resolve) => s.ws.close(() => resolve()));
    await new Promise<void>((resolve) => s.http.close(() => resolve()));
  }
  servers.length = 0;
});
async function start(pool: Pool | null = null) {
  const ws = await createV1SocketServer(pool, ["http://wardogs.test"]);
  const http = createServer();
  http.on("upgrade", (r, s, h) =>
    ws.handleUpgrade(r, s, h, (c) => ws.emit("connection", c, r)),
  );
  await new Promise<void>((resolve) => http.listen(0, "127.0.0.1", resolve));
  servers.push({ http, ws });
  return `ws://127.0.0.1:${(http.address() as { port: number }).port}/v1`;
}
function client(url: string, origin = "http://wardogs.test") {
  return new Promise<{
    socket: WebSocket;
    messages: any[];
    wait: (match: (m: any) => boolean) => Promise<any>;
    send: (m: unknown) => void;
  }>((resolve, reject) => {
    const socket = new WebSocket(url, { origin }),
      messages: any[] = [],
      waiters: Array<{
        match: (m: any) => boolean;
        resolve: (m: any) => void;
        timer: ReturnType<typeof setTimeout>;
      }> = [];
    clients.push(socket);
    socket.on("message", (data) => {
      const m = JSON.parse(data.toString());
      messages.push(m);
      for (const w of waiters.slice())
        if (w.match(m)) {
          clearTimeout(w.timer);
          waiters.splice(waiters.indexOf(w), 1);
          w.resolve(m);
        }
    });
    socket.once("error", reject);
    socket.once("open", () =>
      resolve({
        socket,
        messages,
        send: (m) => socket.send(JSON.stringify(m)),
        wait: (match) =>
          new Promise((resolve, reject) => {
            const old = messages.find(match);
            if (old) {
              resolve(old);
              return;
            }
            const w = {
              match,
              resolve,
              timer: setTimeout(
                () => reject(Error("WebSocket response timed out")),
                5000,
              ),
            };
            waiters.push(w);
          }),
      }),
    );
  });
}
const options = (count: number) => ({
  count,
  scenario: "standard",
  firms: [0, 1, 2, 3, 4].slice(0, count),
  timerMinutes: 5,
});
describe("v1 real WebSocket boundaries", () => {
  it.each([2, 3, 4, 5])(
    "serves %i distinct private seats and recovers the same claim after a lost initial response",
    async (count) => {
      const url = await start(),
        room = "network-" + count,
        token = randomBytes(32).toString("base64url"),
        host = await client(url);
      host.send({ type: "create", room, options: options(count), token });
      const first = await host.wait((m) => m.type === "state" && m.token);
      expect(first.player).toBe("p0");
      for (let i = 1; i < count; i++) {
        const c = await client(url);
        c.send({
          type: "join",
          room,
          claimToken: randomBytes(32).toString("base64url"),
        });
        const v = await c.wait((m) => m.type === "state" && m.token);
        expect(v.player).toBe("p" + i);
        expect(v.view.players[i].objectiveChoices).toHaveLength(2);
        expect(v.view.players[0].objectiveChoices).toBeUndefined();
        expect(v.view.config).toBeUndefined();
      }
      const retry = await client(url);
      retry.send({ type: "create", room, options: options(count), token });
      expect(
        (await retry.wait((m) => m.type === "state" && m.token)).player,
      ).toBe("p0");
    },
  );
  it("ACKs once, rejects forged actors and stale commands, and retains the authoritative revision", async () => {
    const url = await start(),
      c = await client(url);
    c.send({
      type: "create",
      room: "commands",
      options: options(2),
      token: randomBytes(32).toString("base64url"),
    });
    const initial = await c.wait((m) => m.token),
      command = {
        id: "once",
        player: "p0",
        type: "choose-objective",
        card: initial.view.players[0].objectiveChoices[0],
      };
    c.send({ type: "command", revision: 0, command });
    expect((await c.wait((m) => m.type === "ack")).revision).toBe(1);
    c.send({ type: "command", revision: 0, command });
    await c.wait((m) => m.type === "state" && m.revision === 1);
    c.send({
      type: "command",
      revision: 1,
      command: {
        id: "forged",
        player: "p1",
        type: "choose-objective",
        card: "objective-gray",
      },
    });
    expect(
      (await c.wait((m) => m.type === "error" && m.id === "forged")).error,
    ).toContain("eget");
    c.send({
      type: "command",
      revision: 0,
      command: {
        id: "stale",
        player: "p0",
        type: "choose-objective",
        card: command.card,
      },
    });
    expect(
      (await c.wait((m) => m.type === "error" && m.id === "stale")).error,
    ).toContain("ændret");
  });
  it("rolls back a command if durable storage fails before acknowledging it", async () => {
    let fail = false;
    const pool = {
      query: async (sql: string) => {
        if (fail && sql.startsWith("INSERT"))
          throw Error("simulated durable-store outage");
        return { rows: [] };
      },
    } as unknown as Pool;
    const url = await start(pool),
      c = await client(url);
    c.send({
      type: "create",
      room: "durable",
      options: options(2),
      token: randomBytes(32).toString("base64url"),
    });
    const initial = await c.wait((m) => m.token);
    fail = true;
    c.send({
      type: "command",
      revision: 0,
      command: {
        id: "not-saved",
        type: "choose-objective",
        player: "p0",
        card: initial.view.players[0].objectiveChoices[0],
      },
    });
    await c.wait((m) => m.type === "error" && m.id === "not-saved");
    c.send({ type: "refresh" });
    const v = await c.wait(
      (m) => m.type === "state" && m.revision === 0 && !m.token,
    );
    expect(v.view.players[0].objectiveChosen).toBe(false);
    expect(
      c.messages.some((m) => m.type === "ack" && m.id === "not-saved"),
    ).toBe(false);
  });
  it("rejects a foreign Origin before a seat can be claimed", async () => {
    const url = await start();
    await expect(client(url, "https://foreign.test")).rejects.toThrow("401");
  });
});
describe("shared advisory negotiation clock", () => {
  it("uses server time, pauses and resumes without altering the game journal, and never seals at zero", () => {
    const r = newV1Room("clock", options(2) as Parameters<typeof newV1Room>[1]);
    r.state.phase = "negotiation";
    syncClock(r, 1000);
    controlClock(r, "p0", 0, "pause", 61000);
    expect(r.clock?.remainingMs).toBe(240000);
    controlClock(r, "p0", 1, "resume", 100000);
    controlClock(r, "p0", 2, "pause", 900000);
    expect(r.clock?.remainingMs).toBe(0);
    expect(r.state.ready).toEqual([]);
    expect(r.state.commands).toEqual([]);
    expect(() => controlClock(r, "p1", 3, "reset", 900000)).toThrow("værten");
  });
});
