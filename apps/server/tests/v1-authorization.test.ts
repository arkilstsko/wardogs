import { describe, expect, it } from "vitest";
import {
  applyV1RoomCommand,
  joinV1Room,
  newV1Room,
  v1RoomView,
} from "../src/v1-rooms";
const options = {
  count: 2,
  scenario: "standard" as const,
  firms: [0, 1],
  timerMinutes: 3,
};
describe("authoritative v1 rooms", () => {
  it.each([2, 3, 4, 5])(
    "creates exactly %i human seats with a private 256-bit random seed",
    (count) => {
      const r = newV1Room("test", {
        ...options,
        count,
        firms: [0, 1, 2, 3, 4].slice(0, count),
      });
      expect(r.state.config.seed).toMatch(/^[a-f0-9]{64}$/);
      for (let i = 0; i < count; i++)
        expect(joinV1Room(r).player).toBe("p" + i);
      expect(() => joinV1Room(r)).toThrow("fuldt");
    },
  );
  it("does not store plaintext credentials and reconnects the same seat", () => {
    const r = newV1Room("test", options),
      a = joinV1Room(r);
    expect(r.seats.p0).not.toBe(a.token);
    expect(joinV1Room(r, a.token).player).toBe("p0");
    expect(() => joinV1Room(r, "other")).toThrow("ugyldig");
  });
  it("rejects forged actors and stale revisions", () => {
    const r = newV1Room("test", options);
    expect(() =>
      applyV1RoomCommand(r, "p0", 0, {
        id: "x",
        player: "p1",
        type: "draft-good",
        good: "medical",
      }),
    ).toThrow("eget");
    expect(() =>
      applyV1RoomCommand(r, "p0", 99, {
        id: "x",
        player: "p0",
        type: "choose-objective",
        card: r.state.players[0].objectiveChoices[0],
      }),
    ).toThrow("ændret");
  });
  it("keeps retries idempotent but rejects a reused ID with another choice", () => {
    const r = newV1Room("test", options),
      cmd = {
        id: "x",
        player: "p0",
        type: "choose-objective",
        card: r.state.players[0].objectiveChoices[0],
      };
    expect(applyV1RoomCommand(r, "p0", 0, cmd)).toBe(true);
    expect(applyV1RoomCommand(r, "p0", 0, cmd)).toBe(false);
    expect(r.revision).toBe(1);
    expect(() =>
      applyV1RoomCommand(r, "p0", 1, { ...cmd, type: "advance" }),
    ).toThrow();
  });
  it("does not allow a non-host to advance, and does not start before everyone has joined", () => {
    const r = newV1Room("test", options);
    expect(() =>
      applyV1RoomCommand(r, "p1", 0, {
        id: "x",
        player: "p1",
        type: "advance",
      }),
    ).toThrow("værten");
    expect(() =>
      applyV1RoomCommand(r, "p0", 0, {
        id: "x",
        player: "p0",
        type: "advance",
      }),
    ).toThrow("taget plads");
  });
  it("never projects future randomness, another hand or reconnect hashes", () => {
    const r = newV1Room("test", options),
      a = joinV1Room(r),
      v = v1RoomView(r, "p0", "memory");
    const json = JSON.stringify(v);
    expect(json).not.toContain(String(r.state.config.seed));
    expect(json).not.toContain(a.token);
    expect(json).not.toContain(r.seats.p0);
    expect(v.view.players[1].objectiveChoices).toBeUndefined();
    expect(v.view.players[0].objectiveChoices).toHaveLength(2);
    expect(Object.keys(v.view)).not.toContain("decks");
  });
});
