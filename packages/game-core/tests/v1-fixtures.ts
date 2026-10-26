import { expect } from "vitest";
import {
  CARD,
  GOODS,
  assertInvariants,
  createGame,
  execute,
  type Game,
  type Scenario,
  type Terms,
} from "../src/v1";
export function move(
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
export function prepared(count = 5, scenario: Scenario = "standard") {
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
export function negotiation(s: Game) {
  s = noReaction(move(s, "advance"));
  return noReaction(move(s, "advance"));
}
export function fixtureTender(s: Game, id: string, keep: string[] = []) {
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
export function nextIncident(s: Game, id: string) {
  const index = s.decks.incident.indexOf(id);
  expect(index).toBeGreaterThanOrEqual(0);
  s.decks.incident.splice(index, 1);
  s.decks.incident.unshift(id);
}
export function noReaction(s: Game) {
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
export function actions(s: Game, target?: string) {
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
export function endDelivery(s: Game) {
  return noReaction(move(s, "advance"));
}
export function fiveParty(): Omit<Terms, "proposer"> {
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
export function signFive(s: Game, tenderId: string) {
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
