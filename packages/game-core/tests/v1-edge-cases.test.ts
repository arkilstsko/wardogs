import { describe, expect, it } from "vitest";
import {
  assertInvariants,
  canonical,
  objectiveBonus,
  inventory,
  type DeliveryRecord,
  type Game,
} from "../src/v1";
import { settle } from "../src/v1/trading";
import {
  move,
  prepared,
  negotiation,
  fixtureTender,
  signFive,
  fiveParty,
  actions,
  nextIncident,
  endDelivery,
  noReaction,
} from "./v1-fixtures";

function org(s: Game, id: string, who: number) {
  for (const pile of [s.decks.organizations, s.organizationRow]) {
    const i = pile.indexOf(id);
    if (i >= 0) pile.splice(i, 1);
  }
  s.players[who].organizations.push(id);
}
function awarded() {
  let s = negotiation(prepared());
  const t = fixtureTender(s, "contract-11");
  s = signFive(s, t.id);
  for (const p of s.players) s = move(s, "ready", p.id);
  s = noReaction(move(s, "advance"));
  return { s, id: t.id };
}
function sanctioned() {
  const { id, s: initial } = awarded();
  let s = initial;
  while (s.players[s.active].id !== "p3")
    s = move(s, "pass", s.players[s.active].id);
  s = move(s, "transport", "p3", { tender: id });
  s.round = 2;
  s.phase = "delivery";
  s.countries.find(
    (c) => c.id === s.tenders.find((t) => t.id === id)!.country,
  )!.sanctions = true;
  s.resolution = { steps: [], next: "scoring" };
  s.pending = { kind: "sanction", player: "p3", tender: id };
  return { s, id };
}
describe("v1 unanimous amendments and sanctioned arrivals", () => {
  it("moves reservations only after all old and new parties consent; preserves the original depositor", () => {
    const { id, s: initial } = awarded();
    let s = initial;
    const terms = fiveParty();
    terms.mode = "express";
    terms.pledges[2].logistics = 2;
    terms.pledges[3].freight = 3;
    s = move(s, "amend", "p3", { tender: id, proposer: "p4", ...terms });
    const a = s.agreements.at(-1)!.id;
    expect(s.bids[0].mode).toBe("standard");
    for (const pid of ["p1", "p0", "p4"])
      s = move(s, "accept", pid, { agreement: a });
    expect(s.bids[0].proposer).toBe("p3");
    s = move(s, "accept", "p2", { agreement: a });
    expect(s.bids[0].proposer).toBe("p4");
    expect(s.bids[0].escrowOwner).toBe("p3");
    expect(s.bids[0].mode).toBe("express");
    expect(s.players[3].actions).toBe(2);
    assertInvariants(s);
  });
  it("a party may veto the draft without destroying an awarded contract", () => {
    const { id, s: initial } = awarded();
    let s = initial;
    s = move(s, "amend", "p3", { tender: id, proposer: "p3", ...fiveParty() });
    s = move(s, "withdraw", "p1", { agreement: s.agreements.at(-1)!.id });
    expect(s.bids[0].status).toBe("awarded");
    expect(s.agreements.at(-1)!.status).toBe("withdrawn");
  });
  it("waits without extending the deadline or refunding insurance", () => {
    const { id, s: initial } = sanctioned();
    let s = initial;
    const deadline = s.tenders.find((t) => t.id === id)!.deadline,
      cash = s.players.map((p) => p.cash);
    s = move(s, "reroute", "p3", { choice: "wait" });
    expect(s.bids[0].arrival).toBe(3);
    expect(s.tenders.find((t) => t.id === id)!.deadline).toBe(deadline);
    expect(s.players.map((p) => p.cash)).toEqual(cash);
    expect(s.bids[0].insured).toBe(true);
  });
  it("requires all five signatures before charging the shared reroute and rolling once", () => {
    let { s } = sanctioned();
    const initial = s.players[4].cash;
    s = move(s, "reroute", "p3", {
      choice: "propose",
      payments: [{ player: "p4", amount: 2 }],
    });
    for (const pid of ["p1", "p0", "p4"])
      s = move(s, "reroute", pid, { choice: "accept" });
    expect(s.players[4].cash).toBe(initial);
    expect(s.bids[0].insured).toBe(true);
    s = move(s, "reroute", "p2", { choice: "accept" });
    s = noReaction(s);
    expect(s.players.every((p) => p.investigation === 2)).toBe(true);
    expect(s.bids[0].insured).toBe(false);
    expect(s.bids[0].mode).toBe("gray");
    expect(s.log.filter((l) => l.kind === "gray-roll")).toHaveLength(1);
    expect(s.bids[0].pledges.find((p) => p.player === "p4")!.reroutePaid).toBe(
      2,
    );
    assertInvariants(s);
  });
  it("rejects a reroute that cannot be paid without consuming reserved money", () => {
    const { s } = sanctioned();
    s.players[4].cash = 1;
    const before = canonical(s);
    expect(() =>
      move(s, "reroute", "p3", {
        choice: "propose",
        payments: [{ player: "p4", amount: 2 }],
      }),
    ).toThrow("betaling");
    expect(canonical(s)).toBe(before);
  });
  it("last-round external delay costs one money instead of creating an extra round", () => {
    const { id, s: initial } = awarded();
    let s = initial;
    s.round = s.maxRounds;
    s.phase = "delivery";
    s.bids[0].status = "transit";
    s.bids[0].arrival = s.maxRounds;
    s.tenders.find((t) => t.id === id)!.status = "transit";
    s.tenders.find((t) => t.id === id)!.deadline = s.maxRounds;
    s.players[3].contactsHand.forEach((card) => s.discards.contacts.push(card));
    s.players[3].contactsHand = [];
    const cash = s.players[3].cash;
    s.pending = { kind: "delay", player: "p3", tender: id, remaining: [] };
    s.resolution = { steps: [], next: "scoring" };
    s = move(s, "reaction", "p3", { use: false });
    expect(s.players[3].cash).toBe(cash - 1);
    expect(s.bids[0].arrival).toBe(s.maxRounds);
    expect(s.bids[0].graceUsed).toBe(false);
  });
});
describe("v1 actual contribution and remaining organizations", () => {
  it("a waived insurance-only contribution stays bound but gives no personal goal progress", () => {
    let s = negotiation(prepared());
    org(s, "org-insurance", 2);
    const t = fixtureTender(s, "contract-11");
    s = signFive(s, t.id);
    s = actions(s, t.id);
    nextIncident(s, "incident-inspection");
    s = endDelivery(s);
    s = negotiation(move(s, "advance"));
    s = actions(s);
    nextIncident(s, "incident-clear");
    s = endDelivery(s);
    expect(s.bids[0].status).toBe("delivered");
    expect(s.players[2].deliveries).toHaveLength(0);
    expect(s.players[2].reputation).toBe(1);
    expect(
      s.bids[0].pledges.find((p) => p.player === "p2")!.insurancePaid,
    ).toBe(0);
    assertInvariants(s);
  });
  it("prestige is a once-per-game legal delivery bonus, and duplicate settlement is harmless", () => {
    const { s, id } = awarded();
    org(s, "org-prestige", 0);
    s.resolution = { steps: [], next: "scoring" };
    settle(s, id, true);
    const after = s.players[0].prestige;
    expect(s.players[0].used["org-prestige-ever"]).toBe(1);
    expect(after).toBe(2);
    settle(s, id, true);
    expect(s.players[0].prestige).toBe(after);
    assertInvariants(s);
  });
  it("mediation prevents the first failure reputation loss and keeps the shared penalty", () => {
    const { s, id } = awarded();
    org(s, "org-mediation", 0);
    s.resolution = { steps: [], next: "scoring" };
    settle(s, id, false);
    expect(s.players[0].reputation).toBe(1);
    expect(s.players[0].used["org-mediation"]).toBe(1);
    expect(s.resolution.steps.some((x) => x.kind === "loss")).toBe(true);
  });
});
describe("v1 all twelve personal goals", () => {
  const delivery = (fields: Partial<DeliveryRecord> = {}): DeliveryRecord => ({
    tender: "goal-fixture",
    country: "DK",
    region: "Europe",
    good: "medical",
    quantity: 1,
    ownCargo: 1,
    logistics: 0,
    cashPaid: 0,
    legal: true,
    consortium: true,
    partners: ["p1"],
    ...fields,
  });
  it.each([
    "legitimate",
    "diplomat",
    "consortium",
    "exporter",
    "tonnage",
    "regions",
    "ledger",
    "repay",
    "broker",
    "home",
    "gray",
    "mixed",
  ])(
    "%s has a positive requirement and no automatic starting bonus",
    (goal) => {
      const p = prepared(2).players[0];
      p.objective = "objective-" + goal;
      p.inventory = inventory();
      expect(objectiveBonus(p)).toBe(0);
      p.cash = 20;
      p.debt = 0;
      p.repaid = 6;
      p.relationships = { DK: 3, DE: 2, BR: 2 };
      p.deliveries = [
        delivery(),
        delivery({ country: "BR", region: "Americas", good: "communications" }),
        delivery({ country: "IN", region: "Asia", good: "vehicles" }),
        delivery({ good: "arms" }),
        delivery({ ownCargo: 0, logistics: 1 }),
        delivery({ ownCargo: 0, cashPaid: 1 }),
        delivery({ legal: false }),
      ];
      expect(objectiveBonus(p)).toBeGreaterThan(0);
    },
  );
});
