import { forcedLoss } from "../src/v1/state";
import { describe, expect, it } from "vitest";
import {
  assertInvariants,
  canonical,
  contactLimit,
  freeCash,
  inventory,
  viewFor,
  type Game,
} from "../src/v1";
import {
  move,
  prepared,
  negotiation,
  noReaction,
  fixtureTender,
  actions,
  nextIncident,
  endDelivery,
  signFive,
} from "./v1-fixtures";

function contact(s: Game, id: string, p = s.players[0]) {
  for (const a of s.players) {
    const i = a.contactsHand.indexOf(id);
    if (i >= 0) a.contactsHand.splice(i, 1);
  }
  for (const pile of [s.decks.contacts, s.discards.contacts]) {
    const i = pile.indexOf(id);
    if (i >= 0) pile.splice(i, 1);
  }
  p.contactsHand.push(id);
  p.contacts = 3;
}
function organization(s: Game, id: string, p = s.players[0]) {
  for (const pile of [s.decks.organizations, s.organizationRow]) {
    const i = pile.indexOf(id);
    if (i >= 0) pile.splice(i, 1);
  }
  p.organizations.push(id);
}
function actionState() {
  const s = negotiation(prepared(2));
  s.phase = "actions";
  s.active = 0;
  return s;
}
function pending(s: Game, kind: NonNullable<Game["pending"]>) {
  s.phase =
    kind.kind === "world"
      ? "world"
      : kind.kind === "loss" && kind.category === "maintenance"
        ? "income"
        : "delivery";
  s.pending = kind;
  s.resolution = { steps: [], next: s.phase };
}

describe("v1 contact cards: every timing and effect", () => {
  it("stamp reduces only the sender’s actual freight and is consumed once", () => {
    let s = negotiation(prepared(2));
    contact(s, "contact-stamp");
    const t = fixtureTender(s, "contract-01");
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "standard",
      insured: false,
      priority: false,
    });
    s = actionsWithDispatch(s, t.id, true);
    expect(s.bids[0].pledges[0].freightPaid).toBe(0);
    expect(s.discards.contacts).toContain("contact-stamp");
    assertInvariants(s);
  });
  it("a bid call supplies guarded access without changing the persistent relationship", () => {
    let s = negotiation(prepared(2));
    contact(s, "contact-call");
    const t = fixtureTender(s, "contract-01");
    t.relationship = 1;
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "standard",
      insured: false,
      priority: false,
      contact: "contact-call",
    });
    expect(s.bids[0].relation).toBe(1);
    expect(s.players[0].relationships[t.country] ?? 0).toBe(0);
  });
  it("capacity is tied to that bid and stays below the total cap of three", () => {
    let s = negotiation(prepared(2));
    s.players[0].logistics = 1;
    contact(s, "contact-capacity");
    const t = fixtureTender(s, "contract-01");
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "express",
      insured: false,
      priority: false,
      contact: "contact-capacity",
    });
    expect(viewFor(s, "p0").players[0].reservedLogistics).toBe(2);
    assertInvariants(s);
  });
  it("a mandatory new enforcement die replaces the old die", () => {
    let s = prepared(2);
    contact(s, "contact-reroll");
    s.players[0].investigation = 3;
    pending(s, { kind: "enforcement", player: "p0", roll: 1 });
    s = move(s, "reaction", "p0", { use: true });
    const roll = s.log.find((l) => l.kind === "enforcement-roll")!.roll!;
    expect(roll).toBeGreaterThanOrEqual(1);
    expect(roll).toBeLessThanOrEqual(6);
    expect(s.players[0].contactUsed).toBe("1:delivery");
  });
  it("records reduce investigation before the die; zero skips the die altogether", () => {
    let s = prepared(2);
    contact(s, "contact-record");
    s.players[0].investigation = 1;
    pending(s, { kind: "before-enforcement", player: "p0" });
    s = move(s, "reaction", "p0", { use: true });
    expect(s.players[0].investigation).toBe(0);
    expect(s.log.some((l) => l.kind === "enforcement-roll")).toBe(false);
  });
  it.each(["contact-paid", "contact-lunch"] as const)(
    "%s reduces one actual maintenance payment",
    (card) => {
      let s = prepared(2);
      contact(s, card);
      const before = s.players[0].cash;
      pending(s, {
        kind: "loss",
        category: "maintenance",
        player: "p0",
        amount: 2,
        reason: "Vedligeholdelse",
      });
      s = move(s, "reaction", "p0", { use: true, card });
      expect(s.players[0].cash).toBe(before - 1);
      assertInvariants(s);
    },
  );
  it("lunch cannot reduce a penalty", () => {
    const s = prepared(2);
    contact(s, "contact-lunch");
    pending(s, {
      kind: "loss",
      category: "penalty",
      player: "p0",
      amount: 2,
      reason: "Bod",
    });
    expect(() =>
      move(s, "reaction", "p0", { use: true, card: "contact-lunch" }),
    ).toThrow("gældsvedligeholdelse");
  });
  it("the paragraph cancels a delay without granting grace or moving arrival", () => {
    let s = negotiation(prepared());
    const t = fixtureTender(s, "contract-11");
    s = signFive(s, t.id);
    s = actions(s, t.id);
    contact(s, "contact-paragraph", s.players[3]);
    nextIncident(s, "incident-clear");
    s = endDelivery(s);
    const b = s.bids[0],
      arrival = b.arrival;
    pending(s, { kind: "delay", player: "p3", tender: t.id, remaining: [] });
    s = move(s, "reaction", "p3", { use: true });
    expect(s.bids[0].arrival).toBe(arrival);
    expect(s.bids[0].graceUsed).toBe(false);
  });
  it("coffee pays exactly one money after a genuine consortium success", () => {
    let s = prepared(2);
    contact(s, "contact-coffee");
    const before = s.players[0].cash;
    pending(s, { kind: "coffee", player: "p0", tender: "unit-window" });
    s = move(s, "reaction", "p0", { use: true });
    expect(s.players[0].cash).toBe(before + 1);
  });
  it("telephone keeps at most one drawn identity and hides both from the other seat", () => {
    let s = prepared(2);
    contact(s, "contact-chain");
    pending(s, { kind: "world", player: "p0" });
    s = move(s, "reaction", "p0", { use: true });
    expect(s.pending?.kind).toBe("chain");
    if (s.pending?.kind !== "chain") throw Error("chain missing");
    expect(viewFor(s, "p1").pending).toEqual({
      kind: "chain",
      player: "p0",
      cards: [],
    });
    const keep = s.pending.cards[0];
    s = move(s, "choose-chain", "p0", { card: keep });
    expect(s.players[0].contactsHand).toContain(keep);
    assertInvariants(s);
  });
  it("the tie addendum changes only the current bid’s effective reputation", () => {
    let s = negotiation(prepared(2));
    contact(s, "contact-tie");
    const t = fixtureTender(s, "contract-01");
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "standard",
      insured: false,
      priority: false,
    });
    s.phase = "negotiation";
    s.pending = { kind: "tie", player: "p0", tender: t.id };
    s.resolution = { steps: [], next: "actions" };
    const rep = s.players[0].reputation;
    s = move(s, "reaction", "p0", { use: true });
    expect(s.bids[0].tieBonus).toBe(1);
    expect(s.players[0].reputation).toBe(rep);
  });
  it("a key discounts a real logistics upgrade and prevents a second card in the phase", () => {
    let s = actionState();
    contact(s, "contact-key");
    const before = s.players[0].cash;
    s = move(s, "network", "p0", {
      upgrade: "logistics",
      contact: "contact-key",
    });
    expect(s.players[0].cash).toBe(before - 1);
    expect(s.players[0].logistics).toBe(3);
    expect(() => move(s, "contact", "p0", { card: "contact-chain" })).toThrow();
  });
  it("reaction-window eligibility is identical for different private card identities", () => {
    let a = prepared(2),
      b = prepared(2);
    contact(a, "contact-chain");
    contact(b, "contact-key");
    a = move(a, "advance");
    b = move(b, "advance");
    expect(a.pending?.kind).toBe(b.pending?.kind);
    expect(a.pending?.player).toBe(b.pending?.player);
  });
});
function actionsWithDispatch(s: Game, id: string, stamp = false) {
  for (const p of s.players) s = move(s, "ready", p.id);
  s = noReaction(move(s, "advance"));
  while (s.players[s.active].id !== "p0")
    s = move(s, "pass", s.players[s.active].id);
  return move(s, "transport", "p0", {
    tender: id,
    ...(stamp ? { contact: "contact-stamp" } : {}),
  });
}

describe("v1 organizations, trades and forced costs", () => {
  it.each([
    ["org-audit", "audit"],
    ["org-diplomacy", "influence"],
  ] as const)(
    "%s discounts its first matching action in a round",
    (id, action) => {
      let s = actionState();
      organization(s, id);
      s.players[0].investigation = 4;
      const before = s.players[0].cash;
      s = move(
        s,
        action,
        "p0",
        action === "influence" ? { country: "DK" } : {},
      );
      expect(s.players[0].cash).toBe(before - (action === "audit" ? 0 : 1));
      expect(s.players[0].used[id]).toBe(1);
    },
  );
  it.each([
    ["org-booking", 0, 1],
    ["org-insurance", 1, 0],
  ] as const)(
    "%s releases only its owner’s dispatch budget",
    (id, freight, insurance) => {
      let s = negotiation(prepared(2));
      organization(s, id);
      const t = fixtureTender(s, "contract-01");
      s = move(s, "bid", "p0", {
        tender: t.id,
        offer: t.payout,
        mode: "standard",
        insured: true,
        priority: false,
      });
      s = actionsWithDispatch(s, t.id);
      expect(s.bids[0].pledges[0].freightPaid).toBe(freight);
      expect(s.bids[0].pledges[0].insurancePaid).toBe(insurance);
      assertInvariants(s);
    },
  );
  it("priority reserves one express logistics and charges the full three money", () => {
    let s = negotiation(prepared(2));
    organization(s, "org-priority");
    const t = fixtureTender(s, "contract-01");
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "express",
      insured: false,
      priority: true,
    });
    expect(s.bids[0].pledges[0].logistics).toBe(1);
    s = actionsWithDispatch(s, t.id);
    expect(s.bids[0].pledges[0].freightPaid).toBe(3);
    expect(s.players[0].used["org-priority"]).toBe(1);
  });
  it("escrow waives the first deposit but still consumes a shared action", () => {
    let s = negotiation(prepared(2));
    organization(s, "org-escrow");
    const t = fixtureTender(s, "contract-01"),
      cash = s.players[0].cash;
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "standard",
      insured: false,
      priority: false,
    });
    expect(s.bids[0].escrow).toBe(0);
    expect(s.players[0].cash).toBe(cash);
    expect(s.players[0].actions).toBe(2);
  });
  it("resale adds one money once to the current selling price", () => {
    let s = actionState();
    organization(s, "org-resale");
    const cash = s.players[0].cash,
      price = s.prices.medical;
    s = move(s, "sell", "p0", { good: "medical" });
    expect(s.players[0].cash).toBe(cash + price);
    expect(s.players[0].used["org-resale"]).toBe(1);
  });
  it("credit discounts debt maintenance and never idle logistics", () => {
    let s = prepared(2);
    organization(s, "org-credit");
    s.players[0].debt = 6;
    s = move(s, "advance");
    s = noReaction(s);
    const cash = s.players[0].cash;
    s = noReaction(move(s, "advance"));
    expect(s.players[0].cash).toBe(cash + 1);
  });
  it("contacts expands the hand limit by one; storage is applied when bought", () => {
    let s = actionState();
    organization(s, "org-contacts");
    expect(contactLimit(s.players[0])).toBe(s.players[0].contacts + 1);
    const id = "org-storage",
      i = s.decks.organizations.indexOf(id);
    if (i >= 0) {
      s.decks.organizations.splice(i, 1);
      s.decks.organizations.push(s.organizationRow.pop()!);
      s.organizationRow.push(id);
    } else if (!s.organizationRow.includes(id)) throw Error("storage location");
    const before = s.players[0].storage;
    s = move(s, "organization", "p0", { card: id });
    expect(s.players[0].storage).toBe(before + 1);
  });
  it("forced loss protects bound budgets and spills into debt, then prestige", () => {
    let s = negotiation(prepared(2));
    const t = fixtureTender(s, "contract-01");
    s = move(s, "bid", "p0", {
      tender: t.id,
      offer: t.payout,
      mode: "standard",
      insured: true,
      priority: false,
    });
    const p = s.players[0];
    p.debt = 9;
    p.prestige = 4;
    const available = freeCash(s, p);
    forcedLoss(s, p, available + 2);
    expect(p.cash).toBe(2);
    expect(p.prestige).toBe(2);
    expect(p.debt).toBe(9);
    assertInvariants(s);
  });
  it("accepts a private goods swap atomically and refuses the same goods after reservation", () => {
    let s = negotiation(prepared(2));
    const empty = () => ({
      goods: inventory(),
      cash: 0,
      contacts: [],
      discard: [],
    });
    const give = empty(),
      receive = empty();
    give.goods.medical = 1;
    receive.goods.communications = 1;
    s = move(s, "trade", "p0", { partner: "p1", give, receive });
    expect(viewFor(s, "p0").trades).toHaveLength(1);
    const id = s.trades[0].id;
    s = move(s, "accept-trade", "p1", { trade: id, discard: [] });
    expect(s.players[0].inventory.communications).toBe(1);
    expect(s.players[1].inventory.medical).toBe(1);
    assertInvariants(s);
    expect(() =>
      move(s, "accept-trade", "p1", { trade: id, discard: [] }),
    ).toThrow();
  });
  it("rejects pure cash gifts and leaves the state unchanged", () => {
    const s = negotiation(prepared(2));
    const before = canonical(s),
      side = { goods: inventory(), cash: 1, contacts: [], discard: [] };
    expect(() =>
      move(s, "trade", "p0", { partner: "p1", give: side, receive: side }),
    ).toThrow("penge");
    expect(canonical(s)).toBe(before);
  });
});
