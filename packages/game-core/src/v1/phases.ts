import { CARD, GOODS } from "./content";
import type { Game, Pending, Step } from "./model";
import {
  available,
  bid,
  canReact,
  changeStability,
  consumeContact,
  country,
  draw,
  drawContact,
  fillOrganizations,
  fillTenders,
  forcedLoss,
  freeCash,
  hasOrg,
  initiative,
  log,
  meaningful,
  pay,
  player,
  prepareBlackMarket,
  random,
  requireRule,
  standings,
  succession,
  tender,
} from "./state";
import { award, settle } from "./trading";

function due(s: Game) {
  return s.tenders
    .filter(
      (t) => t.status === "transit" && bid(s, t.winner!).arrival! <= s.round,
    )
    .sort(
      (a, b) =>
        initiative(s, bid(s, a.winner!).proposer) -
          initiative(s, bid(s, b.winner!).proposer) ||
        a.card.localeCompare(b.card) ||
        a.id.localeCompare(b.id),
    );
}
function queue(s: Game, ...steps: Step[]) {
  s.resolution!.steps.unshift(...steps);
}
function delay(s: Game, id: string) {
  const b = bid(s, tender(s, id).winner!);
  if (s.round === s.maxRounds) {
    queue(s, {
      kind: "loss",
      player: b.proposer,
      amount: 1,
      reason: "Sidste rundes administrative forsinkelse",
    });
    return;
  }
  b.arrival!++;
  if (!b.graceUsed) {
    tender(s, id).deadline = Math.min(s.maxRounds, tender(s, id).deadline + 1);
    b.graceUsed = true;
  }
  log(
    s,
    `Fragten ${id} forsinkes til runde ${b.arrival}. Fristen er ${tender(s, id).deadline}.`,
    "delay",
    { tender: id },
  );
}
function incident(s: Game) {
  if (s.config.scenario === "intro") return;
  const id =
    s.config.scenario === "freight" && s.round === 3
      ? "incident-form"
      : draw(s, "incident");
  requireRule(id, "Den sene hændelsesbunke mangler.");
  s.incidentCard = id;
  s.discards.incident.push(id);
  log(s, CARD[id].title, "incident");
  const ships = due(s);
  if (id === "incident-form") {
    const t = ships.find((t) => bid(s, t.winner!).mode === "standard");
    if (t) queue(s, { kind: "delay", tender: t.id });
  }
  if (id === "incident-holiday")
    queue(
      s,
      ...ships
        .filter((t) => bid(s, t.winner!).mode === "standard")
        .map((t) => ({ kind: "delay" as const, tender: t.id })),
    );
  if (id === "incident-fee")
    queue(
      s,
      ...ships.map((t) => ({
        kind: "loss" as const,
        player: bid(s, t.winner!).proposer,
        amount: 1,
        reason: "For god ordens skyld / " + t.id,
      })),
    );
  if (id === "incident-seal") {
    const target = ships
      .slice()
      .sort(
        (a, b) =>
          b.quantity - a.quantity ||
          initiative(s, bid(s, a.winner!).proposer) -
            initiative(s, bid(s, b.winner!).proposer) ||
          a.card.localeCompare(b.card),
      )[0];
    if (target) settle(s, target.id, false, true);
  }
}
function arrival(s: Game, id: string) {
  const t = tender(s, id);
  if (t.status !== "transit") return;
  const b = bid(s, t.winner!);
  if (b.arrival! > s.round) return;
  if (b.mode !== "gray" && country(s, t.country).sanctions) {
    s.pending = { kind: "sanction", player: b.proposer, tender: t.id };
    return;
  }
  if (b.mode === "gray") {
    const roll = random(s, 6) + 1;
    log(
      s,
      `Grå kontrol: ${roll}. ${s.incidentCard === "incident-inspection" ? "1–3" : "1–2"} fejler.`,
      "gray-roll",
      { roll, tender: t.id },
    );
    settle(
      s,
      t.id,
      roll > (s.incidentCard === "incident-inspection" ? 3 : 2),
      roll <= (s.incidentCard === "incident-inspection" ? 3 : 2),
    );
  } else settle(s, t.id, true);
}
function enforcement(s: Game, step: Extract<Step, { kind: "enforce" }>) {
  const p = player(s, step.player);
  if (p.investigation === 0) return;
  if (!step.skipBefore && canReact(s, p)) {
    s.pending = { kind: "before-enforcement", player: p.id };
    return;
  }
  const roll = random(s, 6) + 1;
  log(
    s,
    `${p.name}: efterforskningsslag ${roll} mod ${p.investigation}.`,
    "enforcement-roll",
    { roll, player: p.id },
  );
  if (canReact(s, p)) s.pending = { kind: "enforcement", player: p.id, roll };
  else
    queue(s, { kind: "enforce-result", player: p.id, roll, rerolled: false });
}
function enforceResult(
  s: Game,
  step: Extract<Step, { kind: "enforce-result" }>,
) {
  const p = player(s, step.player);
  if (step.roll > p.investigation) return;
  const good = GOODS.find((g) => available(s, p, g) > 0);
  if (good) {
    p.inventory[good]--;
    s.reserve[good]++;
  }
  p.reputation = Math.max(0, p.reputation - 1);
  queue(s, {
    kind: "loss",
    player: p.id,
    amount: 2,
    reason: "Efterforskningsbøde",
  });
  log(
    s,
    `${p.name}: ${good ? "én fri vare konfiskeres; " : ""}2 M bøde og omdømme −1.`,
    "enforcement",
    { player: p.id },
  );
}
function archive(s: Game) {
  for (const t of s.tenders.filter(
    (t) => !t.archived && !["awarded", "transit"].includes(t.status),
  )) {
    if (t.status === "open") t.status = "unawarded";
    s.discards.contracts.push(t.card);
    t.archived = true;
  }
}
function finish(s: Game) {
  archive(s);
  s.finished = true;
  s.phase = "scoring";
  const names = standings(s)
    .filter((p) => p.rank === 1)
    .map((p) => p.name);
  log(
    s,
    `${names.join(" og ")} ${names.length > 1 ? "deler sejren" : "vinder"}. Det sidste regnskab er åbent.`,
    "final",
  );
}
export function resolveTasks(s: Game) {
  let guard = 0;
  while (s.resolution && !s.pending && s.resolution.steps.length) {
    requireRule(++guard < 200, "Afregningen overskrider sin sikkerhedsgrænse.");
    const step = s.resolution.steps.shift()!;
    if (step.kind === "incident") incident(s);
    else if (step.kind === "loss") {
      if (step.amount <= 0) continue;
      const p = player(s, step.player);
      if (canReact(s, p)) s.pending = { ...step };
      else {
        forcedLoss(s, p, step.amount, step.category !== "maintenance");
        log(s, `${p.name} afregner ${step.amount} M: ${step.reason}.`, "loss", {
          player: p.id,
        });
      }
    } else if (step.kind === "delay") {
      const t = tender(s, step.tender);
      if (t.status !== "transit") continue;
      const b = bid(s, t.winner!);
      const eligible =
        step.remaining ??
        b.pledges
          .filter((x) => meaningful(x) && canReact(s, player(s, x.player)))
          .map((x) => x.player);
      if (eligible.length)
        s.pending = {
          kind: "delay",
          player: eligible[0],
          tender: t.id,
          remaining: eligible.slice(1),
        };
      else delay(s, t.id);
    } else if (step.kind === "arrive") arrival(s, step.tender);
    else if (step.kind === "deadline") {
      const t = tender(s, step.tender);
      if (["awarded", "transit"].includes(t.status) && t.deadline <= s.round)
        settle(s, t.id, false);
    } else if (step.kind === "enforce") enforcement(s, step);
    else if (step.kind === "enforce-result") enforceResult(s, step);
    else if (step.kind === "coffee") {
      const p = player(s, step.player);
      if (
        canReact(s, p) &&
        p.deliveries.some((d) => d.tender === step.tender && d.consortium)
      )
        s.pending = { kind: "coffee", player: p.id, tender: step.tender };
    } else if (step.kind === "world-contact") {
      if (canReact(s, player(s, step.player)))
        s.pending = { kind: "world", player: step.player };
    } else if (step.kind === "world-event") worldEvent(s);
    else if (step.kind === "tie") {
      if (canReact(s, player(s, step.player)))
        s.pending = { kind: "tie", player: step.player, tender: step.tender };
    } else if (step.kind === "award") award(s);
  }
  if (s.resolution && !s.pending && !s.resolution.steps.length) {
    const next = s.resolution.next;
    s.resolution = null;
    if (next === "finished") finish(s);
    else {
      s.phase = next;
      if (next === "negotiation") fillTenders(s);
      if (next === "actions") {
        s.active = s.first;
        s.ready = [];
      }
    }
  }
}
function resolveWorld(s: Game) {
  for (const p of s.players) p.actions = 3;
  if (s.config.scenario !== "intro" && s.round > 1)
    for (let i = 0; i < s.players.length; i++)
      drawContact(s, s.players[(s.first + i) % s.players.length]);
  if (s.blackMarket) s.blackMarket.visible = true;
  s.resolution = {
    steps: [
      ...Array.from({ length: s.players.length }, (_, i) => ({
        kind: "world-contact" as const,
        player: s.players[(s.first + i) % s.players.length].id,
      })),
      { kind: "world-event" },
    ],
    next: "income",
  };
  resolveTasks(s);
}
function worldEvent(s: Game) {
  const id = draw(s, "world");
  requireRule(id, "Morgennyheden mangler.");
  s.worldCard = id;
  s.discards.world.push(id);
  log(s, CARD[id].title, "world");
  if (id === "event-open-ports")
    for (const c of s.countries) changeStability(s, c, 1);
  if (id === "event-supply-shock")
    s.prices.communications = Math.min(8, s.prices.communications + 1);
  if (id === "event-public-scrutiny")
    for (const p of s.players)
      if (p.investigation >= 3) p.reputation = Math.max(0, p.reputation - 1);
  if (id === "event-relief-window")
    for (const c of s.countries) c.demand = Math.min(6, c.demand + 1);
  if (id === "event-quiet-diplomacy") {
    const c = s.countries.slice().sort((a, b) => a.stability - b.stability)[0];
    changeStability(s, c, 2);
  }
  if (s.config.scenario === "election" && [3, 6].includes(s.round))
    succession(
      s,
      s.countries.slice().sort((a, b) => a.stability - b.stability)[0],
    );
  for (const c of s.countries) {
    if (c.stability <= 1) {
      c.sanctions = true;
      c.sanctionRound = s.round;
    } else if (c.sanctions && c.sanctionRound < s.round) c.sanctions = false;
  }
  s.ready = [];
}
function resolveIncome(s: Game) {
  for (const p of s.players) p.cash += 2;
  const steps: Step[] = s.players.map((p) => ({
    kind: "loss",
    player: p.id,
    amount: Math.max(
      0,
      Math.ceil(p.debt / 3) +
        (s.worldCard === "event-credit-tightens" && p.debt > 0 ? 1 : 0) -
        (hasOrg(p, "credit") ? 1 : 0) -
        (p.used["contact-lunch"] === s.round ? 1 : 0),
    ),
    reason: "Gældsvedligeholdelse",
    category: "maintenance",
  }));
  s.resolution = { steps, next: "negotiation" };
  log(s, "Alle huse modtager 2 M. Gældsvedligeholdelsen afregnes.", "income");
  resolveTasks(s);
}
function resolveDelivery(s: Game) {
  const ordered = Array.from(
    { length: s.players.length },
    (_, i) => s.players[(s.first + i) % s.players.length],
  );
  s.resolution = {
    steps: [
      { kind: "incident" },
      ...due(s).map((t) => ({ kind: "arrive" as const, tender: t.id })),
      ...s.tenders
        .filter((t) => ["awarded", "transit"].includes(t.status))
        .map((t) => ({ kind: "deadline" as const, tender: t.id })),
      ...ordered.map((p) => ({ kind: "enforce" as const, player: p.id })),
    ],
    next: "scoring",
  };
  resolveTasks(s);
}
function cleanup(s: Game) {
  if (s.round === s.maxRounds) {
    if (s.blackMarket) {
      s.reserve[s.blackMarket.good]++;
      s.blackMarket = null;
    }
    s.resolution = {
      steps: s.tenders
        .filter((t) => ["awarded", "transit"].includes(t.status))
        .map((t) => ({ kind: "deadline", tender: t.id })),
      next: "finished",
    };
    resolveTasks(s);
    return;
  }
  archive(s);
  prepareBlackMarket(s);
  for (const g of GOODS) {
    const n = Math.min(s.players.length, s.reserve[g], 12 - s.stock[g]);
    s.stock[g] += n;
    s.reserve[g] -= n;
    if (s.stock[g] >= 8) s.prices[g] = Math.max(1, s.prices[g] - 1);
  }
  s.round++;
  s.first = (s.first + 1) % s.players.length;
  s.active = s.first;
  s.ready = [];
  s.worldCard = null;
  s.incidentCard = null;
  s.phase = "world";
  for (const p of s.players) p.actions = 3;
  if (s.blackMarket) s.blackMarket.visible = true;
  fillOrganizations(s);
  log(
    s,
    `Runde ${s.round}. ${s.players[s.first].name} har initiativet.`,
    "round",
  );
}
export function advance(s: Game) {
  requireRule(
    !s.pending && !s.resolution,
    "Afslut det åbne reaktionsvindue først.",
  );
  if (s.phase === "world") resolveWorld(s);
  else if (s.phase === "income") resolveIncome(s);
  else if (s.phase === "negotiation") {
    requireRule(
      s.players.every((p) => s.ready.includes(p.id)),
      "Alle huse skal forsegle, før buddene afgøres.",
    );
    const steps: Step[] = [];
    for (const t of s.tenders.filter((t) => t.status === "open")) {
      const offers = s.bids.filter(
        (b) => b.tender === t.id && b.status === "sealed",
      );
      if (offers.length < 2) continue;
      const low = Math.min(...offers.map((b) => b.offer)),
        relation = Math.max(
          ...offers.filter((b) => b.offer === low).map((b) => b.relation),
        );
      const tied = offers.filter(
        (b) => b.offer === low && b.relation === relation,
      );
      if (tied.length > 1)
        for (const id of [
          ...new Set(tied.flatMap((b) => b.pledges.map((p) => p.player))),
        ].sort((a, b) => initiative(s, a) - initiative(s, b)))
          steps.push({ kind: "tie", player: id, tender: t.id });
    }
    s.resolution = { steps: [...steps, { kind: "award" }], next: "actions" };
    resolveTasks(s);
  } else if (s.phase === "actions") {
    requireRule(
      s.players.every((p) => p.actions === 0),
      "Der er stadig handlinger tilbage.",
    );
    s.phase = "delivery";
  } else if (s.phase === "delivery") resolveDelivery(s);
  else if (s.phase === "scoring") cleanup(s);
}
export function react(
  s: Game,
  actor: string,
  use: boolean,
  card?: "contact-paid" | "contact-lunch",
) {
  const pending = s.pending;
  requireRule(
    pending &&
      pending.player === actor &&
      pending.kind !== "chain" &&
      pending.kind !== "sanction",
    "Der er ikke et reaktionsvindue til dig.",
  );
  const p = player(s, actor);
  s.pending = null;
  requireRule(
    !card || pending.kind === "loss",
    "Kortvalget gælder kun en konkret betaling.",
  );
  if (pending.kind === "loss") {
    if (use) {
      const effect = card === "contact-lunch" ? "lunch" : "paid";
      requireRule(
        effect !== "lunch" || pending.category === "maintenance",
        "Frokostpausen gælder kun gældsvedligeholdelse.",
      );
      consumeContact(s, p, effect);
    }
    const amount = Math.max(0, pending.amount - (use ? 1 : 0));
    forcedLoss(s, p, amount, pending.category !== "maintenance");
    log(s, `${p.name} afregner ${amount} M: ${pending.reason}.`, "loss", {
      player: p.id,
    });
  }
  if (pending.kind === "before-enforcement") {
    if (use) {
      consumeContact(s, p, "record");
      p.investigation = Math.max(0, p.investigation - 1);
    }
    queue(s, { kind: "enforce", player: p.id, skipBefore: true });
  }
  if (pending.kind === "enforcement") {
    let roll = pending.roll;
    if (use) {
      consumeContact(s, p, "reroll");
      roll = random(s, 6) + 1;
      log(
        s,
        `${p.name}: nyt efterforskningsslag ${roll}. Det nye slag gælder.`,
        "enforcement-roll",
        { roll, player: p.id },
      );
    }
    queue(s, { kind: "enforce-result", player: p.id, roll, rerolled: use });
  }
  if (pending.kind === "delay") {
    if (use) consumeContact(s, p, "paragraph");
    else
      queue(s, {
        kind: "delay",
        tender: pending.tender,
        remaining: pending.remaining,
      });
  }
  if (pending.kind === "coffee" && use) {
    consumeContact(s, p, "coffee");
    p.cash++;
  }
  if (pending.kind === "world" && use) {
    consumeContact(s, p, "chain");
    const cards = [];
    for (let i = 0; i < 2; i++) {
      const id = draw(s, "contacts");
      if (id) cards.push(id);
    }
    if (cards.length) s.pending = { kind: "chain", player: p.id, cards };
  }
  if (pending.kind === "tie" && use) {
    const b = s.bids.find(
      (b) =>
        b.tender === pending.tender &&
        b.pledges.some((x) => x.player === p.id) &&
        b.status === "sealed",
    );
    requireRule(b, "Dit bud er ikke længere i ligheden.");
    consumeContact(s, p, "tie");
    b.tieBonus++;
  }
  resolveTasks(s);
}
export function reroute(
  s: Game,
  actor: string,
  choice: "propose" | "accept" | "wait",
  payments?: Array<{ player: string; amount: number }>,
) {
  const pending = s.pending;
  requireRule(
    pending?.kind === "sanction",
    "Ingen fragt venter på et sanktionsvalg.",
  );
  const t = tender(s, pending.tender),
    b = bid(s, t.winner!);
  requireRule(
    b.pledges.some((x) => x.player === actor),
    "Kun kontraktens deltagere kan vælge.",
  );
  if (choice === "wait") {
    requireRule(
      actor === b.proposer || !!pending.proposal,
      "Ekspeditøren vælger først mellem ventetid og omlægning.",
    );
    b.arrival = s.round + 1;
    s.pending = null;
    log(s, "Parterne lader lasten vente uden ekstra frist.", "wait", {
      tender: t.id,
    });
    resolveTasks(s);
    return;
  }
  if (choice === "propose") {
    requireRule(
      actor === b.proposer && !pending.proposal,
      "Ekspeditøren kan foreslå én samlet omlægning.",
    );
    requireRule(
      payments &&
        new Set(payments.map((x) => x.player)).size === payments.length &&
        payments.every((x) => b.pledges.some((p) => p.player === x.player)) &&
        payments.reduce((n, x) => n + x.amount, 0) === 2,
      "Fordel præcis 2 M mellem deltagerne.",
    );
    for (const x of payments)
      requireRule(
        freeCash(s, player(s, x.player)) >= x.amount,
        "En parts frie betaling mangler.",
      );
    pending.proposal = {
      payments: structuredClone(payments),
      accepted: [actor],
    };
  } else {
    requireRule(
      pending.proposal && !pending.proposal.accepted.includes(actor),
      "Ingen ny underskrift til denne omlægning.",
    );
    pending.proposal.accepted.push(actor);
  }
  const proposal = pending.proposal!;
  if (proposal.accepted.length === b.pledges.length) {
    for (const x of proposal.payments)
      requireRule(
        freeCash(s, player(s, x.player)) >= x.amount,
        "Budgettet er ændret; omlægningen kan ikke godkendes.",
      );
    for (const x of proposal.payments) {
      pay(s, player(s, x.player), x.amount);
      b.pledges.find((p) => p.player === x.player)!.reroutePaid += x.amount;
    }
    if (!b.grayMarked) {
      for (const x of b.pledges)
        player(s, x.player).investigation = Math.min(
          6,
          player(s, x.player).investigation + 2,
        );
      b.grayMarked = true;
    }
    b.mode = "gray";
    b.insured = false;
    b.arrival = s.round;
    s.pending = null;
    log(
      s,
      "Alle godkender grå omlægning. Forsikringen bortfalder uden refusion.",
      "reroute",
      { tender: t.id },
    );
    queue(s, { kind: "arrive", tender: t.id });
    resolveTasks(s);
  }
}
export function pendingContact(pending: Pending) {
  return {
    loss: "paid",
    "before-enforcement": "record",
    enforcement: "reroll",
    delay: "paragraph",
    coffee: "coffee",
    chain: "chain",
    sanction: null,
    world: "chain",
    tie: "tie",
  }[pending.kind];
}
