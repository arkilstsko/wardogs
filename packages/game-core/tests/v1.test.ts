import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  CARD,
  GOODS,
  allocate,
  assertInvariants,
  canonical,
  createGame,
  execute,
  exportGame,
  importGame,
  inventory,
  scoreBreakdown,
  standings,
  viewFor,
  type Game,
  type Scenario,
  type Terms,
} from "../src/v1";

function move(
  s: Game,
  type: string,
  pid = "p0",
  fields: Record<string, unknown> = {},
) {
  return execute(s, {
    id: "test-" + s.commands.length,
    player: pid,
    type,
    ...fields,
  });
}
function prepared(count = 5, scenario: Scenario = "standard") {
  let s = createGame({ seed: 812, count, scenario });
  for (const p of s.players) {
    if (p.objectiveChoices.length)
      s = move(s, "choose-objective", p.id, { card: p.objectiveChoices[0] });
    if (!p.initialRelationChosen)
      s = move(s, "choose-relation", p.id, { country: s.countries[0].id });
  }
  const choices = [
    ["medical", "vehicles"],
    ["communications", "communications"],
    ["medical", "arms"],
    ["communications", "medical"],
    ["vehicles", "vehicles"],
  ];
  while (s.setup.cursor < s.setup.order.length) {
    const pid = s.setup.order[s.setup.cursor],
      p = s.players.find((p) => p.id === pid)!;
    s = move(s, "draft-good", pid, {
      good: choices[Number(pid.slice(1))][
        GOODS.reduce((n, g) => n + p.inventory[g], 0)
      ],
    });
  }
  return move(s, "advance");
}
function negotiation(s: Game) {
  s = noReaction(move(s, "advance"));
  return noReaction(move(s, "advance"));
}
function fixtureTender(s: Game, id: string, keep: string[] = []) {
  const existing = s.tenders.find((t) => !t.archived && t.card === id);
  if (existing) return existing;
  const position = s.decks.contracts.indexOf(id);
  expect(position).toBeGreaterThanOrEqual(0);
  s.decks.contracts.splice(position, 1);
  const old = s.tenders.find(
    (t) => t.status === "open" && !keep.includes(t.card),
  )!;
  s.decks.contracts.push(old.card);
  const card = CARD[id],
    c = s.countries.find((c) => c.id === card.iso)!;
  Object.assign(old, {
    id: "fixture-" + id,
    card: id,
    country: c.id,
    good: card.good,
    quantity: card.quantity,
    payout:
      card.quantity! * s.prices[card.good!] +
      4 +
      Math.floor(c.demand / 2) +
      (c.stance === "open" ? 1 : 0),
    relationship: c.stance === "guarded" ? 1 : 0,
  });
  assertInvariants(s);
  return old;
}
function nextIncident(s: Game, id: string) {
  const index = s.decks.incident.indexOf(id);
  expect(index).toBeGreaterThanOrEqual(0);
  s.decks.incident.splice(index, 1);
  s.decks.incident.unshift(id);
}
function noReaction(s: Game) {
  let n = 0;
  while (s.pending) {
    if (++n > 50) throw Error("Reaction loop");
    const p = s.pending;
    if (p.kind === "sanction")
      s = move(s, "reroute", p.player, { choice: "wait" });
    else if (p.kind === "chain")
      s = move(s, "choose-chain", p.player, { card: null });
    else s = move(s, "reaction", p.player, { use: false });
  }
  return s;
}
function actions(s: Game, target?: string) {
  for (const p of s.players) s = move(s, "ready", p.id);
  s = noReaction(move(s, "advance"));
  while (s.players.some((p) => p.actions > 0)) {
    const p = s.players[s.active],
      t = s.tenders.find((t) => t.id === target);
    s = move(
      s,
      t?.status === "awarded" &&
        s.bids.find((b) => b.id === t.winner)?.proposer === p.id
        ? "transport"
        : "pass",
      p.id,
      t?.status === "awarded"
        ? {
            ...(s.bids.find((b) => b.id === t.winner)?.proposer === p.id
              ? { tender: t.id }
              : {}),
          }
        : {},
    );
  }
  return move(s, "advance");
}
function endDelivery(s: Game) {
  return noReaction(move(s, "advance"));
}
function fiveParty(): Omit<Terms, "proposer"> {
  return {
    offer: 11,
    mode: "standard",
    insured: true,
    priority: false,
    pledges: [
      {
        player: "p3",
        quantity: 1,
        logistics: 0,
        freight: 0,
        insurance: 0,
        revenue: 35,
        liability: 25,
      },
      {
        player: "p1",
        quantity: 1,
        logistics: 0,
        freight: 0,
        insurance: 0,
        revenue: 25,
        liability: 25,
      },
      {
        player: "p0",
        quantity: 0,
        logistics: 1,
        freight: 0,
        insurance: 0,
        revenue: 20,
        liability: 20,
      },
      {
        player: "p4",
        quantity: 0,
        logistics: 0,
        freight: 1,
        insurance: 0,
        revenue: 10,
        liability: 15,
      },
      {
        player: "p2",
        quantity: 0,
        logistics: 0,
        freight: 0,
        insurance: 1,
        revenue: 10,
        liability: 15,
      },
    ],
  };
}
function signFive(s: Game, tenderId: string) {
  const terms = fiveParty();
  s = move(s, "propose", "p3", {
    tender: tenderId,
    offer: terms.offer,
    mode: terms.mode,
    insured: terms.insured,
    priority: terms.priority,
    pledges: terms.pledges,
  });
  const id = s.agreements.at(-1)!.id;
  for (const p of ["p1", "p0", "p4", "p2"])
    s = move(s, "accept", p, { agreement: id });
  return s;
}

describe("Wardogs v1: physical pools, setup and replay", () => {
  it.each([2, 3, 4, 5])(
    "sets up %i people with exactly two goods and twelve units per type",
    (count) => {
      const s = prepared(count);
      expect(
        s.players.every(
          (p) => GOODS.reduce((n, g) => n + p.inventory[g], 0) === 2,
        ),
      ).toBe(true);
      expect(s.phase).toBe("world");
      assertInvariants(s);
      expect(importGame(exportGame(s))).toEqual(s);
    },
  );
  it("uses equal firm starts and excludes all advanced systems in the introductory scenario", () => {
    const s = prepared(5, "intro");
    expect(s.maxRounds).toBe(6);
    expect(s.countries.map((c) => c.id)).toEqual([
      "DK",
      "DE",
      "IT",
      "NG",
      "IN",
      "BR",
    ]);
    for (const p of s.players)
      expect([
        p.cash,
        p.logistics,
        p.contacts,
        p.storage,
        p.reputation,
        p.objective,
        p.contactsHand.length,
      ]).toEqual([10, 1, 1, 6, 1, null, 0]);
    expect(s.blackMarket).toBeNull();
    expect(s.organizationRow).toEqual([]);
  });
  it("guarantees all four goods in the first two-person tender row", () => {
    const s = negotiation(prepared(2));
    expect(new Set(s.tenders.map((t) => t.good)).size).toBe(4);
    expect(s.tenders).toHaveLength(4);
  });
  it("rejects a mismatched rule edition and rejects tampered saves", () => {
    const s = prepared(2);
    expect(() => importGame(JSON.stringify({ version: 1 }))).toThrow("v0.1");
    s.players[0].cash++;
    expect(() => importGame(exportGame(s))).toThrow("journal");
  });
  it("has idempotent retries, rejects colliding IDs and leaves failed actions unchanged", () => {
    let s = prepared(2);
    const cmd = { id: "same", player: "p0", type: "advance" };
    s = execute(s, cmd);
    expect(execute(s, cmd)).toBe(s);
    expect(() => execute(s, { ...cmd, type: "ready" })).toThrow("andet valg");
    const before = canonical(s);
    expect(() => move(s, "acquire", "p0", { good: "arms" })).toThrow(
      /Vent|Afslut/,
    );
    expect(canonical(s)).toBe(before);
  });
  it.each(["intro", "standard", "freight", "election"] as Scenario[])(
    "terminates the complete %s scenario and replays every command",
    (scenario) => {
      let s = prepared(3, scenario);
      let guard = 0;
      while (!s.finished) {
        if (++guard > 600) throw Error("Termination failed");
        if (s.pending) {
          s = noReaction(s);
          continue;
        }
        if (s.phase === "negotiation") {
          const p = s.players.find((p) => !s.ready.includes(p.id));
          s = move(s, p ? "ready" : "advance", p?.id ?? "p0");
        } else if (
          s.phase === "actions" &&
          s.players.some((p) => p.actions > 0)
        ) {
          const p = s.players[s.active];
          s = move(s, p.used.office === s.round ? "pass" : "office", p.id);
        } else s = move(s, "advance");
      }
      expect(s.round).toBe(
        scenario === "intro" || scenario === "freight" ? 6 : 8,
      );
      assertInvariants(s);
      expect(importGame(exportGame(s))).toEqual(s);
    },
  );
  it("conserves largest-remainder pools for arbitrary partitions", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 100 }), {
          minLength: 1,
          maxLength: 4,
        }),
        fc.integer({ min: 0, max: 200 }),
        (cuts, total) => {
          const points = [0, ...cuts.sort((a, b) => a - b), 100];
          const shares = points.slice(1).map((n, i) => n - points[i]);
          const result = allocate(total, shares);
          expect(result.reduce((n, x) => n + x, 0)).toBe(total);
          for (let i = 0; i < result.length; i++)
            expect(
              Math.abs(result[i] - (total * shares[i]) / 100),
            ).toBeLessThan(1);
        },
      ),
      { numRuns: 1000 },
    );
  });
});

describe("Wardogs v1: binding five-party contracts", () => {
  it("splits eleven money and three prestige once, with genuine contributions from all five", () => {
    let s = negotiation(prepared());
    const t = fixtureTender(s, "contract-11");
    s = signFive(s, t.id);
    expect(s.players[3].actions).toBe(2);
    expect(s.players[3].cash).toBe(11);
    s = actions(s, t.id);
    nextIncident(s, "incident-inspection");
    s = endDelivery(s);
    expect(s.tenders.find((x) => x.id === t.id)!.status).toBe("transit");
    s = negotiation(move(s, "advance"));
    s = actions(s);
    nextIncident(s, "incident-clear");
    s = endDelivery(s);
    expect(s.tenders.find((x) => x.id === t.id)!.status).toBe("delivered");
    expect(s.players.map((p) => p.prestige)).toEqual([1, 1, 0, 1, 0]);
    expect(s.players.map((p) => p.cash)).toEqual([16, 17, 16, 18, 14]);
    expect(s.players.map((p) => p.deliveries.length)).toEqual([1, 1, 1, 1, 1]);
    assertInvariants(s);
  });
  it("pays insurance to the two cargo owners before sharing a three-money failure", () => {
    let s = negotiation(prepared());
    const t = fixtureTender(s, "contract-11");
    s = signFive(s, t.id);
    s = actions(s, t.id);
    nextIncident(s, "incident-inspection");
    s = endDelivery(s);
    s = negotiation(move(s, "advance"));
    s = actions(s);
    nextIncident(s, "incident-seal");
    s = endDelivery(s);
    expect(s.tenders.find((x) => x.id === t.id)!.status).toBe("failed");
    expect(s.players.map((p) => p.cash)).toEqual([13, 15, 15, 14, 13]);
    expect(
      s.players.every((p) => p.deliveries.length === 0 && p.prestige === 0),
    ).toBe(true);
    assertInvariants(s);
  });
  it("last signature is atomic when a partner has committed its cargo elsewhere", () => {
    let s = negotiation(prepared());
    const t = fixtureTender(s, "contract-11");
    const other = fixtureTender(s, "contract-05", ["contract-11"]);
    const terms = fiveParty();
    s = move(s, "propose", "p3", { tender: t.id, ...terms });
    const a = s.agreements.at(-1)!.id;
    for (const p of ["p0", "p4", "p2"])
      s = move(s, "accept", p, { agreement: a });
    s = move(s, "bid", "p1", {
      tender: other.id,
      offer: other.payout,
      mode: "standard",
      insured: false,
      priority: false,
    });
    const before = canonical(s);
    expect(() => move(s, "accept", "p1", { agreement: a })).toThrow("vare");
    expect(canonical(s)).toBe(before);
    expect(s.agreements.at(-1)!.accepted).not.toContain("p1");
  });
  it("cannot invent meaningful participants by promising unused extra logistics", () => {
    let s = negotiation(prepared());
    const t = fixtureTender(s, "contract-11");
    const terms = fiveParty();
    terms.pledges[0].logistics = 1;
    s = move(s, "propose", "p3", { tender: t.id, ...terms });
    const a = s.agreements.at(-1)!.id;
    for (const p of ["p1", "p0", "p4"])
      s = move(s, "accept", p, { agreement: a });
    expect(() => move(s, "accept", "p2", { agreement: a })).toThrow(
      "Logistikken",
    );
  });
  it("a second external delay moves arrival but does not grant another deadline extension", () => {
    let s = negotiation(prepared());
    const t = fixtureTender(s, "contract-11");
    s = signFive(s, t.id);
    s = actions(s, t.id);
    nextIncident(s, "incident-inspection");
    s = endDelivery(s);
    for (const [r, event] of [
      [2, "incident-form"],
      [3, "incident-holiday"],
      [4, "incident-clear"],
    ] as const) {
      s = negotiation(move(s, "advance"));
      expect(s.round).toBe(r);
      s = actions(s);
      nextIncident(s, event);
      s = endDelivery(s);
      const current = s.tenders.find((x) => x.id === t.id)!;
      if (r < 4) {
        expect(current.deadline).toBe(4);
        expect(s.bids.find((b) => b.id === current.winner)!.arrival).toBe(
          r + 1,
        );
      } else expect(current.status).toBe("delivered");
    }
    assertInvariants(s);
  });
});

describe("Wardogs v1: privacy and end conditions", () => {
  it("uses explicit public projections and keeps other hands, objectives and future decks out", () => {
    const s = prepared();
    const v = viewFor(s, "p0");
    const json = JSON.stringify(v);
    for (const key of ["rng", "commands", "config", "objectiveChoices"]) {
      if (key === "objectiveChoices") continue;
      expect(Object.prototype.hasOwnProperty.call(v, key)).toBe(false);
    }
    expect(v.players[0].inventory).toBeDefined();
    for (const p of v.players.slice(1)) {
      expect(p.inventory).toBeUndefined();
      expect(p.objective).toBeUndefined();
      expect(p.contactsHand).toBeUndefined();
      expect(p.objectiveChoices).toBeUndefined();
    }
    expect(json).not.toContain('"decks"');
    expect(json).not.toContain(String(s.config.seed));
  });
  it("scores negative wealth with mathematical floor and shares a fully tied victory", () => {
    const s = prepared(2);
    for (const p of s.players) {
      p.cash = 0;
      p.debt = 3;
      p.inventory = inventory();
      p.prestige = 0;
      p.objective = null;
      p.relationships = {};
      p.investigation = 0;
    }
    expect(scoreBreakdown(s, s.players[0]).wealth).toBe(-1);
    expect(standings(s).map((p) => p.rank)).toEqual([1, 1]);
  });
  it("black-market buying transfers a single existing unit without moving the price", () => {
    let s = negotiation(prepared(2));
    s = actions(s); // no actions remain: use a new clean action position instead
    s = negotiation(move(endDelivery(s), "advance"));
    for (const p of s.players) s = move(s, "ready", p.id);
    s = move(s, "advance");
    const p = s.players[s.active],
      offer = s.blackMarket!,
      before = s.prices[offer.good],
      units = p.inventory[offer.good];
    s = move(s, "black-buy", p.id);
    expect(s.blackMarket).toBeNull();
    expect(s.prices[offer.good]).toBe(before);
    expect(s.players.find((x) => x.id === p.id)!.inventory[offer.good]).toBe(
      units + 1,
    );
    assertInvariants(s);
  });
});
