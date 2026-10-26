import { GOODS, GOOD_NAMES } from "./content";
import type {
  Agreement,
  Bid,
  Game,
  Step,
  Terms,
  Trade,
  TradeSide,
} from "./model";
import {
  allocate,
  available,
  bid,
  canContact,
  consumeContact,
  contactLimit,
  country,
  freeCash,
  hasOrg,
  initiative,
  liveBids,
  log,
  meaningful,
  modeFee,
  modeLogistics,
  pay,
  player,
  requireRule,
  reserved,
  temporaryLogistics,
  tender,
  totalGoods,
  unusedOrg,
  useOrg,
} from "./state";

export function validateTerms(
  s: Game,
  tenderId: string,
  terms: Terms,
  exclude?: string,
  inspectOnly?: string,
) {
  const t = tender(s, tenderId),
    old = exclude ? bid(s, exclude) : null;
  if (old)
    requireRule(
      terms.offer === old.offer,
      "Den tildelte kundebetaling kan ikke ændres.",
    );
  requireRule(
    terms.pledges.length >= 1 && terms.pledges.length <= s.players.length,
    "Aftalen skal have 1–5 deltagere.",
  );
  requireRule(
    new Set(terms.pledges.map((x) => x.player)).size === terms.pledges.length,
    "Et hus må kun stå én gang.",
  );
  requireRule(
    terms.pledges.some((x) => x.player === terms.proposer),
    "Ekspeditøren skal deltage i aftalen.",
  );
  requireRule(
    terms.offer >= 1 && terms.offer <= t.payout,
    "Betalingen overskrider udbuddets loft.",
  );
  requireRule(
    terms.pledges.reduce((n, p) => n + p.quantity, 0) === t.quantity,
    "Lasten skal svare præcis til ordren.",
  );
  requireRule(
    terms.pledges.reduce((n, p) => n + p.logistics, 0) === modeLogistics(terms),
    "Logistikken skal svare præcis til den valgte fragt.",
  );
  requireRule(
    terms.pledges.reduce((n, p) => n + p.freight, 0) === modeFee(terms.mode),
    "Fragtbudgettet skal dække hele grundgebyret.",
  );
  requireRule(
    terms.pledges.reduce((n, p) => n + p.insurance, 0) ===
      (terms.insured ? 1 : 0),
    "Forsikringsbudgettet skal være 0 eller 1 M.",
  );
  requireRule(
    !terms.insured || terms.mode !== "gray",
    "Grå passage kan ikke forsikres.",
  );
  requireRule(
    s.config.scenario !== "intro" || terms.mode !== "gray",
    "Introduktionen har ingen grå passage.",
  );
  for (const key of ["revenue", "liability"] as const)
    requireRule(
      terms.pledges.reduce((n, p) => n + p[key], 0) === 100,
      "Begge andelskolonner skal give præcis 100 %.",
    );
  const proposer = player(s, terms.proposer);
  if (terms.priority) {
    requireRule(
      terms.mode === "express" && unusedOrg(s, proposer, "priority"),
      "Ekspresfordelen er ikke ledig.",
    );
    requireRule(
      !liveBids(s, exclude).some(
        (b) => b.proposer === proposer.id && b.priority,
      ),
      "Ekspresfordelen er reserveret til en anden kontrakt.",
    );
  }
  for (const pledge of terms.pledges) {
    const p = player(s, pledge.player),
      previous = old?.pledges.find((x) => x.player === p.id);
    requireRule(
      pledge.quantity > 0 ||
        pledge.logistics > 0 ||
        pledge.freight + pledge.insurance >= 1,
      "Alle deltagere skal love et reelt bidrag.",
    );
    requireRule(
      p.investigation < 5 || !!previous,
      "Efterforskning 5–6 udelukker nye deltagere.",
    );
    if (!inspectOnly || inspectOnly === p.id)
      requireRule(
        available(s, p, t.good, exclude) >= pledge.quantity,
        "Den lovede vare er ikke fri.",
      );
    if (old)
      requireRule(
        !pledge.contact || pledge.contact === previous?.contact,
        "Et tildelt bud kan ikke få nye budkontakter.",
      );
    else if (pledge.contact && (!inspectOnly || inspectOnly === p.id))
      requireRule(
        canContact(s, p, pledge.contact.replace("contact-", "")),
        "En vedlagt kontakt er ikke tilgængelig.",
      );
    const extra = pledge.contact === "contact-capacity" ? 1 : 0;
    requireRule(
      p.logistics + temporaryLogistics(s, p.id, exclude) + extra <= 3,
      "Midlertidig logistik overskrider loftet 3.",
    );
    requireRule(
      p.logistics +
        temporaryLogistics(s, p.id, exclude) +
        extra -
        reserved(s, p.id, "logistics", undefined, exclude) >=
        pledge.logistics,
      "Den lovede logistik er ikke fri.",
    );
    requireRule(
      freeCash(s, p, exclude) >= pledge.freight + pledge.insurance,
      "Det lovede kontantbudget er ikke frit.",
    );
  }
  const relation = Math.min(
    3,
    Math.max(
      ...terms.pledges.map(
        (x) => player(s, x.player).relationships[t.country] ?? 0,
      ),
    ) + terms.pledges.filter((x) => x.contact === "contact-call").length,
  );
  if (!old)
    requireRule(
      relation >= t.relationship,
      "Mindst én deltager skal opfylde det stemplede relationskrav.",
    );
  return relation;
}
export function submitBid(s: Game, id: string, tenderId: string, terms: Terms) {
  const t = tender(s, tenderId),
    p = player(s, terms.proposer);
  requireRule(
    s.phase === "negotiation" && t.status === "open",
    "Bud kan kun indsendes til et åbent udbud i forhandlingen.",
  );
  requireRule(
    terms.pledges.every((x) => !s.ready.includes(x.player)),
    "En deltager har allerede forseglet sin forhandling.",
  );
  requireRule(p.actions > 0, "Ekspeditøren har ingen handling tilbage.");
  requireRule(
    !liveBids(s).some(
      (b) =>
        b.tender === t.id &&
        b.pledges.some((x) => terms.pledges.some((y) => x.player === y.player)),
    ),
    "Et hus må kun være part i ét bud pr. udbud.",
  );
  const relation = validateTerms(s, t.id, terms);
  const escrow = unusedOrg(s, p, "escrow") ? 0 : 1;
  const own = terms.pledges.find((x) => x.player === p.id)!;
  requireRule(
    freeCash(s, p) >= own.freight + own.insurance + escrow,
    "Der mangler frie penge til budget og deponering.",
  );
  pay(s, p, escrow);
  p.actions--;
  if (escrow === 0) useOrg(s, p, "escrow");
  for (const x of terms.pledges)
    if (x.contact)
      consumeContact(s, player(s, x.player), x.contact.replace("contact-", ""));
  const b: Bid = {
    ...structuredClone(terms),
    id: "bid-" + id,
    tender: t.id,
    relation,
    escrow,
    escrowOwner: p.id,
    status: "sealed",
    tieBonus: 0,
    arrival: null,
    graceUsed: false,
    grayMarked: false,
    pledges: terms.pledges.map((x) => ({
      ...x,
      freightPaid: 0,
      insurancePaid: 0,
      reroutePaid: 0,
    })),
  };
  s.bids.push(b);
  log(s, `${p.name} indsender et forseglet bud.`, "bid");
  return b;
}
export function propose(
  s: Game,
  id: string,
  tenderId: string,
  terms: Terms,
  actor: string,
  amending = false,
) {
  const t = tender(s, tenderId);
  requireRule(
    terms.pledges.length >= (amending ? 1 : 2),
    "Et nyt konsortium har mindst to parter.",
  );
  requireRule(
    s.agreements.filter((a) => a.status === "draft").length < 10,
    "Der ligger allerede ti kladder.",
  );
  const old = amending ? (t.winner ? bid(s, t.winner) : null) : null;
  requireRule(
    amending
      ? s.phase === "actions" && t.status === "awarded" && !!old
      : s.phase === "negotiation" &&
          t.status === "open" &&
          !s.ready.includes(actor),
    "Aftalen kan ikke oprettes i denne tilstand.",
  );
  if (old)
    requireRule(
      old.pledges.some((x) => x.player === actor),
      "Kun en nuværende part kan foreslå en ændring.",
    );
  else {
    requireRule(
      terms.proposer === actor,
      "Forslagsstilleren skal være ekspeditør.",
    );
    requireRule(
      !s.agreements.some(
        (a) =>
          a.status === "draft" &&
          a.author === actor &&
          a.tender === t.id &&
          a.kind === "bid",
      ),
      "Du har allerede en kladde til dette udbud.",
    );
  }
  requireRule(
    terms.pledges.every(
      (x) =>
        !x.contact ||
        x.player === actor ||
        x.contact === old?.pledges.find((y) => y.player === x.player)?.contact,
    ),
    "En spiller skal selv vedlægge sin private kontakt.",
  );
  if (old) validateTerms(s, t.id, terms, old.id, actor);
  else {
    // Only the proposer's private resources are inspected before partners consent.
    const own = terms.pledges.find((x) => x.player === actor);
    requireRule(own, "Forslagsstilleren skal deltage.");
    requireRule(
      terms.pledges.reduce((n, x) => n + x.revenue, 0) === 100 &&
        terms.pledges.reduce((n, x) => n + x.liability, 0) === 100,
      "Begge andelskolonner skal give 100 %.",
    );
  }
  const required = [
    ...new Set([
      ...(old?.pledges.map((x) => x.player) ?? []),
      ...terms.pledges.map((x) => x.player),
    ]),
  ];
  required.forEach((x) => player(s, x));
  const a: Agreement = {
    ...structuredClone(terms),
    id,
    author: actor,
    tender: t.id,
    kind: amending ? "amendment" : "bid",
    ...(old ? { bid: old.id } : {}),
    accepted: [actor],
    required,
    status: "draft",
  };
  s.agreements.push(a);
  log(
    s,
    `${player(s, actor).name} opretter ${amending ? "et ændringsforslag" : "en konsortiekladde"}.`,
    "proposal",
  );
  return a;
}
export function sign(s: Game, a: Agreement, actor: string) {
  requireRule(
    a.status === "draft" && a.required.includes(actor),
    "Du er ikke part i denne åbne kladde.",
  );
  requireRule(!a.accepted.includes(actor), "Du har allerede underskrevet.");
  requireRule(
    a.kind === "bid"
      ? s.phase === "negotiation" && !s.ready.includes(actor)
      : s.phase === "actions",
    "Underskriftens vindue er lukket.",
  );
  if (a.accepted.length + 1 === a.required.length) {
    if (a.kind === "bid") submitBid(s, a.id, a.tender, a);
    else {
      const b = bid(s, a.bid!);
      requireRule(
        b.status === "awarded",
        "Lasten er allerede afsendt eller afregnet.",
      );
      validateTerms(s, a.tender, a, b.id);
      Object.assign(b, {
        proposer: a.proposer,
        mode: a.mode,
        insured: a.insured,
        priority: a.priority,
        offer: a.offer,
        pledges: a.pledges.map((x) => ({
          ...x,
          freightPaid: 0,
          insurancePaid: 0,
          reroutePaid: 0,
        })),
      });
      log(
        s,
        "Alle har godkendt ændringen. Reservationerne er erstattet samlet.",
        "amendment",
      );
    }
    a.status = "signed";
  }
  a.accepted.push(actor);
}
export function award(s: Game) {
  for (const t of s.tenders.filter((t) => t.status === "open")) {
    const list = s.bids
      .filter((b) => b.tender === t.id && b.status === "sealed")
      .sort(
        (a, b) =>
          a.offer - b.offer ||
          b.relation - a.relation ||
          player(s, b.proposer).reputation +
            b.tieBonus -
            (player(s, a.proposer).reputation + a.tieBonus) ||
          initiative(s, a.proposer) - initiative(s, b.proposer),
      );
    if (!list.length) continue;
    const winner = list[0];
    winner.status = "awarded";
    t.winner = winner.id;
    t.status = "awarded";
    for (const loser of list.slice(1)) {
      loser.status = "lost";
      player(s, loser.escrowOwner).cash += loser.escrow;
    }
    log(
      s,
      `${player(s, winner.proposer).name} vinder ${country(s, t.country).name}: ${winner.offer} M, ${t.quantity + 1} fælles prestige.`,
      "award",
      { tender: t.id },
    );
  }
  for (const a of s.agreements.filter(
    (a) => a.status === "draft" && a.kind === "bid",
  ))
    a.status = "withdrawn";
  for (const t of s.trades.filter((t) => t.status === "draft"))
    t.status = "withdrawn";
}
export function dispatch(
  s: Game,
  tenderId: string,
  actor: string,
  stamp = false,
) {
  const t = tender(s, tenderId);
  requireRule(
    t.status === "awarded" && !!t.winner,
    "Kontrakten er ikke klar til ekspedition.",
  );
  const b = bid(s, t.winner);
  requireRule(
    b.proposer === actor,
    "Kun den aftalte ekspeditør kan sende lasten.",
  );
  requireRule(
    b.mode !== "standard" || s.round < s.maxRounds,
    "Standard kan ikke ankomme efter spillets sidste runde.",
  );
  requireRule(
    b.mode === "gray" || !country(s, t.country).sanctions,
    "Sanktioner blokerer lovlig ekspedition.",
  );
  if (b.priority) {
    const p = player(s, b.proposer);
    requireRule(
      unusedOrg(s, p, "priority"),
      "Ekspresfordelen er allerede brugt denne runde.",
    );
    useOrg(s, p, "priority");
  }
  let stampApplied = false;
  for (const x of b.pledges) {
    const p = player(s, x.player);
    let freight = x.freight,
      insurance = x.insurance;
    if (b.mode === "standard" && freight > 0 && unusedOrg(s, p, "booking")) {
      freight--;
      useOrg(s, p, "booking");
    }
    if (insurance > 0 && unusedOrg(s, p, "insurance")) {
      insurance--;
      useOrg(s, p, "insurance");
    }
    if (stamp && x.player === actor) {
      requireRule(
        freight > 0,
        "Din fragtbetaling er allerede 0; stemplet kan ikke reducere den.",
      );
      consumeContact(s, p, "stamp");
      freight--;
      stampApplied = true;
    }
    // All quoted budgets were reserved. Discounts release the unused portion.
    requireRule(
      p.cash >= freight + insurance,
      "Det reserverede budget mangler.",
    );
    p.cash -= freight + insurance;
    x.freightPaid = freight;
    x.insurancePaid = insurance;
  }
  requireRule(
    !stamp || stampApplied,
    "Du betaler ikke en del af fragtgebyret.",
  );
  b.status = "transit";
  t.status = "transit";
  b.arrival = s.round + (b.mode === "standard" ? 1 : 0);
  if (b.mode === "gray") {
    for (const x of b.pledges) {
      const p = player(s, x.player);
      p.investigation = Math.min(6, p.investigation + 2);
    }
    b.grayMarked = true;
  }
  log(
    s,
    `${player(s, actor).name} sender ${t.quantity} ${GOOD_NAMES[t.good].toLowerCase()} til ${country(s, t.country).name}; ankomst runde ${b.arrival}.`,
    "dispatch",
    { tender: t.id },
  );
}
export function settle(
  s: Game,
  tenderId: string,
  success: boolean,
  lostCargo = false,
) {
  const t = tender(s, tenderId);
  if (!["awarded", "transit"].includes(t.status)) return;
  const b = bid(s, t.winner!);
  if (success || lostCargo) {
    for (const x of b.pledges) {
      const p = player(s, x.player);
      p.inventory[t.good] -= x.quantity;
      s.reserve[t.good] += x.quantity;
      if (lostCargo && b.insured && b.mode !== "gray") p.cash += 2 * x.quantity;
    }
  }
  t.status = success ? "delivered" : "failed";
  b.status = success ? "delivered" : "failed";
  if (success) {
    const bonus =
      s.config.scenario === "freight" && s.round >= 4 && b.mode !== "gray"
        ? 1
        : 0;
    const money = allocate(
        b.offer + bonus,
        b.pledges.map((x) => x.revenue),
      ),
      prestige = allocate(
        t.quantity + 1,
        b.pledges.map((x) => x.revenue),
      );
    const coffees: Step[] = [];
    b.pledges.forEach((x, i) => {
      const p = player(s, x.player);
      p.cash += money[i];
      p.prestige += prestige[i];
      if (meaningful(x)) {
        const legal = b.mode !== "gray";
        if (legal) p.reputation = Math.min(3, p.reputation + 1);
        p.deliveries.push({
          tender: t.id,
          country: t.country,
          region: country(s, t.country).region,
          good: t.good,
          quantity: t.quantity,
          ownCargo: x.quantity,
          logistics: x.logistics,
          cashPaid: x.freightPaid + x.insurancePaid + x.reroutePaid,
          legal,
          consortium: b.pledges.length > 1,
          partners: b.pledges
            .filter((y) => y.player !== p.id)
            .map((y) => y.player),
        });
        if (legal && hasOrg(p, "prestige") && !p.used["org-prestige-ever"]) {
          p.used["org-prestige-ever"] = 1;
          p.prestige++;
        }
        if (b.pledges.length > 1)
          coffees.push({ kind: "coffee", player: p.id, tender: t.id });
      }
    });
    s.resolution!.steps.unshift(...coffees);
    player(s, b.escrowOwner).cash += b.escrow;
  } else {
    const losses = allocate(
      3,
      b.pledges.map((x) => x.liability),
    );
    const tasks = [];
    for (const [i, x] of b.pledges.entries()) {
      const p = player(s, x.player);
      if (p.reputation > 0) {
        if (unusedOrg(s, p, "mediation")) useOrg(s, p, "mediation");
        else p.reputation--;
      }
      if (losses[i])
        tasks.push({
          kind: "loss" as const,
          player: p.id,
          amount: losses[i],
          reason: "Kontraktbod / " + t.id,
        });
    }
    s.resolution!.steps.unshift(...tasks);
  }
  log(
    s,
    `${country(s, t.country).name}: ${success ? "leveret og afregnet" : "kontraktbrud"}${lostCargo ? " med tabt last" : ""}.`,
    success ? "delivery" : "failure",
    { tender: t.id },
  );
}
export function tradeSideValue(side: TradeSide) {
  return (
    side.cash +
    side.contacts.length +
    GOODS.reduce((n, g) => n + side.goods[g], 0)
  );
}
function checkTradeHand(
  s: Game,
  id: string,
  give: TradeSide,
  receive: TradeSide,
  discard: string[],
) {
  const p = player(s, id);
  requireRule(
    freeCash(s, p) >= give.cash,
    "Handlens penge er ikke længere frie.",
  );
  for (const g of GOODS)
    requireRule(
      available(s, p, g) >= give.goods[g],
      "En vare i handlen er ikke længere fri.",
    );
  requireRule(
    totalGoods(p) -
      GOODS.reduce((n, g) => n + give.goods[g], 0) +
      GOODS.reduce((n, g) => n + receive.goods[g], 0) <=
      p.storage,
    "Handlen overskrider lagerpladsen.",
  );
  requireRule(
    new Set(give.contacts).size === give.contacts.length &&
      give.contacts.every((id) => p.contactsHand.includes(id)),
    "Et kontaktkort i handlen er ikke tilgængeligt.",
  );
  const after = [
    ...p.contactsHand.filter((id) => !give.contacts.includes(id)),
    ...receive.contacts,
  ];
  requireRule(
    new Set(after).size === after.length &&
      new Set(discard).size === discard.length &&
      discard.every((id) => after.includes(id)),
    "Ugyldigt afkast efter bytte.",
  );
  requireRule(
    discard.length === Math.max(0, after.length - contactLimit(p)),
    "Vælg præcis det nødvendige afkast til håndgrænsen.",
  );
}
export function acceptTrade(
  s: Game,
  t: Trade,
  actor: string,
  discard: string[],
) {
  requireRule(
    s.phase === "negotiation" && t.status === "draft" && t.partner === actor,
    "Kun modparten kan godkende et åbent bytte.",
  );
  requireRule(
    !s.ready.includes(t.proposer) && !s.ready.includes(actor),
    "En part har forseglet sin forhandling.",
  );
  checkTradeHand(s, t.proposer, t.give, t.receive, t.give.discard);
  checkTradeHand(s, t.partner, t.receive, t.give, discard);
  const a = player(s, t.proposer),
    b = player(s, t.partner);
  for (const g of GOODS) {
    a.inventory[g] += t.receive.goods[g] - t.give.goods[g];
    b.inventory[g] += t.give.goods[g] - t.receive.goods[g];
  }
  a.cash += t.receive.cash - t.give.cash;
  b.cash += t.give.cash - t.receive.cash;
  for (const [p, give, receive, drop] of [
    [a, t.give, t.receive, t.give.discard],
    [b, t.receive, t.give, discard],
  ] as const) {
    p.contactsHand = [
      ...p.contactsHand.filter((id) => !give.contacts.includes(id)),
      ...receive.contacts,
    ].filter((id) => !drop.includes(id));
    s.discards.contacts.push(...drop);
  }
  t.status = "accepted";
  log(s, `${a.name} og ${b.name} gennemfører et aftalt bytte.`, "trade");
}
