import { CARD, GOODS, RULESET, RULESET_HASH } from "./content";
import { CommandSchema, type Command, type Game, type Terms } from "./model";
import {
  advance as advancePhase,
  react,
  reroute,
  resolveTasks,
} from "./phases";
import {
  acceptTrade,
  award,
  dispatch,
  propose,
  sign,
  submitBid,
  tradeSideValue,
  validateTerms,
} from "./trading";
import {
  assertInvariants,
  available,
  bid,
  canContact,
  changeStability,
  completeSetup,
  consumeContact,
  contactLimit,
  country,
  createGame,
  draw,
  drawContact,
  fillOrganizations,
  freeCash,
  log,
  modeFee,
  modeLogistics,
  pay,
  player,
  requireRule,
  tender,
  temporaryLogistics,
  totalGoods,
  unusedOrg,
  useOrg,
} from "./state";

const ACTIONS = new Set([
  "acquire",
  "sell",
  "black-buy",
  "influence",
  "unrest",
  "network",
  "draw-contact",
  "organization",
  "audit",
  "refinance",
  "restructure",
  "office",
  "transport",
  "pass",
]);
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
        .join(",") +
      "}"
    );
  return JSON.stringify(value) ?? "null";
}
function agreement(s: Game, id: string) {
  const a = s.agreements.find((a) => a.id === id);
  requireRule(a, "Ukendt aftale.");
  return a;
}
function playOrdinaryContact(
  s: Game,
  cmd: Extract<Command, { type: "contact" }>,
) {
  const p = player(s, cmd.player);
  requireRule(
    canContact(s, p, cmd.card.replace("contact-", "")),
    "Kortet kan ikke spilles nu.",
  );
  if (cmd.card === "contact-chain") {
    requireRule(s.phase === "world", "Telefonkæden spilles i verdensfasen.");
    consumeContact(s, p, "chain");
    const cards = [];
    for (let i = 0; i < 2; i++) {
      const id = draw(s, "contacts");
      if (id) cards.push(id);
    }
    if (cards.length) s.pending = { kind: "chain", player: p.id, cards };
    return;
  }
  if (cmd.card === "contact-lunch") {
    requireRule(
      s.phase === "income",
      "Frokostpausen spilles før indkomstens vedligehold.",
    );
    const orgDiscount = p.organizations.includes("org-credit") ? 1 : 0;
    requireRule(
      Math.ceil(p.debt / 3) +
        (s.worldCard === "event-credit-tightens" && p.debt > 0 ? 1 : 0) -
        orgDiscount >
        0,
      "Der er ingen gældsvedligeholdelse at reducere.",
    );
    consumeContact(s, p, "lunch");
    p.used["contact-lunch"] = s.round;
    return;
  }
  if (cmd.card === "contact-tie") {
    requireRule(
      s.phase === "negotiation" &&
        s.players.every((x) => s.ready.includes(x.id)),
      "Prioriteret bilag spilles efter alle har forseglet og før tildeling.",
    );
    requireRule(cmd.tender, "Vælg det udbud, bilaget gælder.");
    const offers = s.bids.filter(
      (b) => b.tender === cmd.tender && b.status === "sealed",
    );
    requireRule(offers.length > 1, "Der er ingen budlighed.");
    const low = Math.min(...offers.map((b) => b.offer)),
      best = Math.max(
        ...offers.filter((b) => b.offer === low).map((b) => b.relation),
      );
    const tied = offers.filter((b) => b.offer === low && b.relation === best);
    requireRule(tied.length > 1, "Relationerne afgør allerede ligheden.");
    const own = tied.find((b) => b.pledges.some((x) => x.player === p.id));
    requireRule(own, "Dit bud er ikke med i den relevante lighed.");
    consumeContact(s, p, "tie");
    own.tieBonus++;
    return;
  }
  throw new Error(
    "Dette kontaktkort spilles i sit konkrete bud-, ekspeditions- eller reaktionsvindue.",
  );
}
function setup(s: Game, cmd: Command) {
  const p = player(s, cmd.player);
  if (cmd.type === "choose-objective") {
    requireRule(
      s.config.scenario !== "intro" &&
        !p.objective &&
        p.objectiveChoices.includes(cmd.card),
      "Vælg ét af dine to startmål.",
    );
    p.objective = cmd.card;
    s.discards.objectives.push(
      ...p.objectiveChoices.filter((id) => id !== cmd.card),
    );
    p.objectiveChoices = [];
    log(s, `${p.name} vælger et hemmeligt mål.`, "setup");
  } else if (cmd.type === "choose-relation") {
    requireRule(
      !p.initialRelationChosen && p.firm === 1 && s.config.scenario !== "intro",
      "Denne startrelation er allerede valgt.",
    );
    country(s, cmd.country);
    p.relationships[cmd.country] = 1;
    p.initialRelationChosen = true;
    log(s, `${p.name} vælger startrelation i ${cmd.country}.`, "setup");
  } else if (cmd.type === "draft-good") {
    requireRule(
      s.setup.order[s.setup.cursor] === p.id,
      "Det er et andet hus, der vælger startvare.",
    );
    requireRule(s.reserve[cmd.good] > 0, "Startvarepuljen er tom.");
    s.reserve[cmd.good]--;
    p.inventory[cmd.good]++;
    s.setup.cursor++;
    if (s.setup.cursor < s.setup.order.length)
      s.active = s.players.findIndex(
        (p) => p.id === s.setup.order[s.setup.cursor],
      );
    log(s, `${p.name} tager en startvare.`, "setup");
  } else if (cmd.type === "advance") completeSetup(s);
  else throw new Error("Afslut opsætningen før spilhandlinger.");
}
export function execute(input: Game, raw: unknown): Game {
  const parsed = CommandSchema.safeParse(raw);
  requireRule(
    parsed.success,
    "Valget indeholder ugyldige felter. Opdatér visningen og prøv igen.",
  );
  const cmd = parsed.data;
  requireRule(
    input.version === 2 && input.ruleset === RULESET,
    "Denne gemning tilhører en anden spiludgave.",
  );
  const previous = input.commands.find((c) => c.id === cmd.id);
  if (previous) {
    requireRule(
      canonical(previous) === canonical(cmd),
      "Samme handlings-ID er allerede brugt til et andet valg.",
    );
    return input;
  }
  requireRule(!input.finished, "Spillet er afsluttet.");
  requireRule(
    input.commands.length < 10000,
    "Spillets handlingsjournal er fuld. Gem den og afslut denne session.",
  );
  const s = structuredClone(input),
    p = player(s, cmd.player);
  if (s.phase === "setup") setup(s, cmd);
  else if (cmd.type === "reaction") react(s, p.id, cmd.use, cmd.card);
  else if (cmd.type === "reroute") reroute(s, p.id, cmd.choice, cmd.payments);
  else if (cmd.type === "choose-chain") {
    const pending = s.pending;
    requireRule(
      pending?.kind === "chain" && pending.player === p.id,
      "Der er ikke et skjult kontaktvalg til dig.",
    );
    requireRule(
      cmd.card === null || pending.cards.includes(cmd.card),
      "Vælg et af de trukne kontaktkort.",
    );
    if (cmd.card) {
      requireRule(
        p.contactsHand.length < contactLimit(p),
        "Din kontakthånd er fuld.",
      );
      p.contactsHand.push(cmd.card);
    }
    s.discards.contacts.push(...pending.cards.filter((id) => id !== cmd.card));
    s.pending = null;
    if (s.resolution) resolveTasks(s);
  } else {
    requireRule(
      !s.pending && !s.resolution,
      "Afslut først bordets åbne reaktionsvindue.",
    );
    if (ACTIONS.has(cmd.type)) {
      requireRule(
        s.phase === "actions" && s.players[s.active].id === p.id,
        "Vent på din tur i handlingsfasen.",
      );
      requireRule(p.actions > 0, "Du har ingen handling tilbage.");
    }
    if (cmd.type === "advance") advancePhase(s);
    else if (cmd.type === "ready") {
      requireRule(
        s.phase === "negotiation" && !s.ready.includes(p.id),
        "Du kan ikke forsegle nu.",
      );
      s.ready.push(p.id);
      log(s, `${p.name} forsegler sine bud.`, "ready");
    } else if (cmd.type === "bid") {
      const t = tender(s, cmd.tender);
      const terms: Terms = {
        proposer: p.id,
        offer: cmd.offer,
        mode: cmd.mode,
        insured: cmd.insured,
        priority: cmd.priority,
        pledges: [
          {
            player: p.id,
            quantity: t.quantity,
            logistics: modeLogistics(cmd),
            freight: modeFee(cmd.mode),
            insurance: cmd.insured ? 1 : 0,
            revenue: 100,
            liability: 100,
            ...(cmd.contact ? { contact: cmd.contact } : {}),
          },
        ],
      };
      submitBid(s, cmd.id, t.id, terms);
    } else if (cmd.type === "propose")
      propose(
        s,
        cmd.id,
        cmd.tender,
        {
          proposer: p.id,
          offer: cmd.offer,
          mode: cmd.mode,
          insured: cmd.insured,
          priority: cmd.priority,
          pledges: cmd.pledges,
        },
        p.id,
      );
    else if (cmd.type === "amend")
      propose(
        s,
        cmd.id,
        cmd.tender,
        {
          proposer: cmd.proposer,
          offer: cmd.offer,
          mode: cmd.mode,
          insured: cmd.insured,
          priority: cmd.priority,
          pledges: cmd.pledges,
        },
        p.id,
        true,
      );
    else if (cmd.type === "revise") {
      const a = agreement(s, cmd.agreement);
      requireRule(
        a.status === "draft" && a.author === p.id,
        "Kun forfatteren kan rette sin åbne kladde.",
      );
      requireRule(
        a.kind === "bid"
          ? s.phase === "negotiation" && !s.ready.includes(p.id)
          : s.phase === "actions",
        "Kladdevinduet er lukket.",
      );
      const terms: Terms = {
        proposer: a.proposer,
        offer: cmd.offer,
        mode: cmd.mode,
        insured: cmd.insured,
        priority: cmd.priority,
        pledges: cmd.pledges,
      };
      const old = a.bid ? bid(s, a.bid) : null;
      requireRule(
        cmd.pledges.every(
          (x) =>
            !x.contact ||
            x.player === p.id ||
            x.contact === a.pledges.find((y) => y.player === x.player)?.contact,
        ),
        "Du kan ikke vedlægge andres private kontakter.",
      );
      if (old) validateTerms(s, a.tender, terms, old.id, p.id);
      requireRule(
        cmd.pledges.some((x) => x.player === a.proposer),
        "Ekspeditøren skal deltage.",
      );
      Object.assign(a, structuredClone(terms));
      a.required = [
        ...new Set([
          ...(old?.pledges.map((x) => x.player) ?? []),
          ...a.pledges.map((x) => x.player),
        ]),
      ];
      a.required.forEach((id) => player(s, id));
      a.accepted = [p.id];
      log(
        s,
        "Kladde ændret. Tidligere underskrifter gælder ikke længere.",
        "revision",
      );
    } else if (cmd.type === "attach-contact") {
      const a = agreement(s, cmd.agreement);
      requireRule(
        a.kind === "bid" &&
          a.status === "draft" &&
          s.phase === "negotiation" &&
          !s.ready.includes(p.id),
        "Kort kan kun vedlægges et åbent bududkast.",
      );
      const own = a.pledges.find((x) => x.player === p.id);
      requireRule(own, "Du er ikke part i dette udkast.");
      if (cmd.contact)
        requireRule(
          canContact(s, p, cmd.contact.replace("contact-", "")),
          "Kontakten er ikke tilgængelig.",
        );
      if (cmd.contact) own.contact = cmd.contact;
      else delete own.contact;
      a.accepted = [];
      log(
        s,
        "Et kontaktbilag er ændret. Alle skal underskrive igen.",
        "revision",
      );
    } else if (cmd.type === "accept")
      sign(s, agreement(s, cmd.agreement), p.id);
    else if (cmd.type === "withdraw") {
      const a = agreement(s, cmd.agreement);
      requireRule(
        a.status === "draft" && a.required.includes(p.id),
        "Du kan kun trække dig fra en åben kladde.",
      );
      requireRule(
        a.kind === "bid" ? s.phase === "negotiation" : s.phase === "actions",
        "Aftalens vindue er lukket.",
      );
      a.status = "withdrawn";
      p.metrics.withdrawals++;
      log(s, `${p.name} trækker sig fra kladden.`, "withdrawal");
    } else if (cmd.type === "acquire") {
      requireRule(s.stock[cmd.good] > 0, "Der er ingen vare på markedet.");
      requireRule(totalGoods(p) < p.storage, "Dit lager er fuldt.");
      pay(s, p, s.prices[cmd.good]);
      p.inventory[cmd.good]++;
      s.stock[cmd.good]--;
      s.prices[cmd.good] = Math.min(8, s.prices[cmd.good] + 1);
      log(s, `${p.name} køber én vare.`);
    } else if (cmd.type === "black-buy") {
      requireRule(
        s.config.scenario !== "intro" && s.blackMarket?.visible,
        "Der er intet åbent sort tilbud.",
      );
      requireRule(totalGoods(p) < p.storage, "Dit lager er fuldt.");
      const g = s.blackMarket.good;
      pay(s, p, Math.max(1, s.prices[g] - 1));
      p.inventory[g]++;
      p.investigation = Math.min(6, p.investigation + 1);
      s.blackMarket = null;
      log(
        s,
        `${p.name} køber sortmarkedets ene vare; efterforskning +1.`,
        "black-market",
      );
    } else if (cmd.type === "sell") {
      requireRule(
        available(s, p, cmd.good) > 0,
        "Du har ingen fri vare af denne type.",
      );
      requireRule(
        s.stock[cmd.good] < 12,
        "Varepuljen er inkonsistent; markedet kan ikke modtage mere.",
      );
      p.inventory[cmd.good]--;
      s.stock[cmd.good]++;
      let income = Math.max(0, s.prices[cmd.good] - 1);
      if (unusedOrg(s, p, "resale")) {
        income++;
        useOrg(s, p, "resale");
      }
      p.cash += income;
      s.prices[cmd.good] = Math.max(1, s.prices[cmd.good] - 1);
      log(s, `${p.name} sælger en vare for ${income} M.`);
    } else if (cmd.type === "influence" || cmd.type === "unrest") {
      const c = country(s, cmd.country);
      if (cmd.type === "influence") {
        requireRule(
          (p.relationships[c.id] ?? 0) < 3,
          "Relationen er allerede 3.",
        );
        const discount = unusedOrg(s, p, "diplomacy");
        pay(s, p, discount ? 1 : 2);
        if (discount) useOrg(s, p, "diplomacy");
        p.relationships[c.id] = (p.relationships[c.id] ?? 0) + 1;
        changeStability(s, c, 1);
        log(s, `${p.name} bygger relation i ${c.name}.`, "influence");
      } else {
        pay(s, p, 3);
        p.investigation = Math.min(6, p.investigation + 2);
        p.reputation = Math.max(0, p.reputation - 1);
        c.demand = Math.min(6, c.demand + 1);
        changeStability(s, c, -2);
        log(s, `${p.name} lægger politisk pres på ${c.name}.`, "unrest");
      }
    } else if (cmd.type === "network") {
      requireRule(
        s.config.scenario !== "intro" || cmd.upgrade === "logistics",
        "Introduktionen bruger ikke kontakter.",
      );
      requireRule(
        p[cmd.upgrade] < 3 &&
          (cmd.upgrade !== "logistics" ||
            p.logistics + temporaryLogistics(s, p.id) < 3),
        "Kapaciteten er allerede ved loftet 3.",
      );
      requireRule(
        !cmd.contact || cmd.upgrade === "logistics",
        "Nøgleringen gælder kun logistik.",
      );
      if (cmd.contact) consumeContact(s, p, "key");
      pay(s, p, cmd.contact ? 1 : 2);
      p[cmd.upgrade]++;
      if (cmd.upgrade === "contacts") drawContact(s, p);
      log(
        s,
        `${p.name} udvider ${cmd.upgrade === "logistics" ? "logistik" : "kontakter"}.`,
      );
    } else if (cmd.type === "draw-contact") {
      requireRule(
        s.config.scenario !== "intro" &&
          p.contactsHand.length < contactLimit(p),
        "Din kontakthånd er fuld, eller scenariet bruger ikke kontakter.",
      );
      requireRule(
        s.decks.contacts.length + s.discards.contacts.length > 0,
        "Alle kontaktkort er holdt.",
      );
      pay(s, p, 1);
      drawContact(s, p);
      log(s, `${p.name} henter et kontaktkort.`);
    } else if (cmd.type === "organization") {
      requireRule(
        s.config.scenario !== "intro" && s.organizationRow.includes(cmd.card),
        "Organisationen er ikke til salg.",
      );
      requireRule(
        p.organizations.length < 2,
        "Du ejer allerede to organisationer.",
      );
      pay(s, p, 3);
      s.organizationRow.splice(s.organizationRow.indexOf(cmd.card), 1);
      p.organizations.push(cmd.card);
      if (cmd.card === "org-storage") p.storage++;
      fillOrganizations(s);
      log(s, `${p.name} køber ${CARD[cmd.card].title}.`, "organization");
    } else if (cmd.type === "audit") {
      requireRule(
        p.investigation > 0,
        "Du har ingen efterforskning at reducere.",
      );
      const discount = unusedOrg(s, p, "audit");
      pay(s, p, discount ? 0 : 1);
      if (discount) useOrg(s, p, "audit");
      p.investigation = Math.max(0, p.investigation - 2);
      p.metrics.audits++;
      log(s, `${p.name} gennemfører revision.`, "audit");
    } else if (cmd.type === "refinance") {
      if (cmd.repay) {
        requireRule(p.debt >= 3, "Du har mindre end 3 M gæld.");
        pay(s, p, 3);
        p.debt -= 3;
        p.repaid += 3;
      } else {
        requireRule(p.debt <= 6, "Gælden er allerede ved loftet 9.");
        p.debt += 3;
        p.cash += 3;
      }
      log(s, `${p.name} ${cmd.repay ? "afdrager" : "låner"} 3 M.`);
    } else if (cmd.type === "restructure") {
      requireRule(
        !p.restructured && p.debt >= 6 && p.cash < 3,
        "Sanering kræver gæld mindst 6, kasse under 3 og ingen tidligere sanering.",
      );
      p.debt -= 3;
      p.cash += 6;
      p.restructured = true;
      log(s, `${p.name} sanerer; permanent −4 slutpoint.`, "restructure");
    } else if (cmd.type === "office") {
      requireRule(
        p.used.office !== s.round,
        "Kontorarbejde er allerede brugt denne runde.",
      );
      p.used.office = s.round;
      p.cash += 2;
      p.metrics.office++;
      log(s, `${p.name} arbejder på kontoret; +2 M.`, "office");
    } else if (cmd.type === "transport")
      dispatch(s, cmd.tender, p.id, !!cmd.contact);
    else if (cmd.type === "pass")
      log(s, `${p.name} passer én handling.`, "pass");
    else if (cmd.type === "trade") {
      requireRule(
        s.phase === "negotiation" &&
          !s.ready.includes(p.id) &&
          !s.ready.includes(cmd.partner) &&
          cmd.partner !== p.id,
        "Byt med en anden åben deltager i forhandlingen.",
      );
      player(s, cmd.partner);
      requireRule(
        s.trades.filter((t) => t.status === "draft").length < 20,
        "Afslut eller træk nogle af de åbne byttetilbud tilbage først.",
      );
      requireRule(
        tradeSideValue(cmd.give) > 0 &&
          tradeSideValue(cmd.receive) > 0 &&
          cmd.give.contacts.length +
            cmd.receive.contacts.length +
            GOODS.reduce(
              (n, g) => n + cmd.give.goods[g] + cmd.receive.goods[g],
              0,
            ) >
            0,
        "Et bytte skal omfatte en nuværende vare eller kontakt; penge må ikke gives gratis.",
      );
      requireRule(
        [
          ...cmd.give.contacts,
          ...cmd.receive.contacts,
          ...cmd.give.discard,
        ].every((id) => CARD[id]?.family === "Contact"),
        "Ukendt kontaktkort.",
      );
      requireRule(
        freeCash(s, p) >= cmd.give.cash &&
          GOODS.every((g) => available(s, p, g) >= cmd.give.goods[g]) &&
          cmd.give.contacts.every((id) => p.contactsHand.includes(id)),
        "Dine tilbudte ressourcer er ikke frie.",
      );
      s.trades.push({
        id: cmd.id,
        proposer: p.id,
        partner: cmd.partner,
        give: structuredClone(cmd.give),
        receive: structuredClone(cmd.receive),
        status: "draft",
      });
      log(s, `${p.name} foreslår et privat bytte.`, "trade-offer");
    } else if (cmd.type === "accept-trade") {
      const t = s.trades.find((t) => t.id === cmd.trade);
      requireRule(t, "Ukendt byttetilbud.");
      acceptTrade(s, t, p.id, cmd.discard);
    } else if (cmd.type === "withdraw-trade") {
      const t = s.trades.find((t) => t.id === cmd.trade);
      requireRule(
        s.phase === "negotiation" &&
          t?.status === "draft" &&
          [t.proposer, t.partner].includes(p.id),
        "Du kan ikke trække dette bytte tilbage.",
      );
      t.status = "withdrawn";
    } else if (cmd.type === "contact") playOrdinaryContact(s, cmd);
    else throw new Error("Dette valg hører til opsætningen.");
    if (ACTIONS.has(cmd.type)) {
      p.actions--;
      if (s.players.some((p) => p.actions > 0)) {
        do {
          s.active = (s.active + 1) % s.players.length;
        } while (s.players[s.active].actions === 0);
      }
    }
  }
  s.commands.push(cmd);
  assertInvariants(s);
  return s;
}
export function exportGame(s: Game) {
  assertInvariants(s);
  return JSON.stringify(s);
}
export function importGame(raw: string): Game {
  requireRule(raw.length <= 10_000_000, "Gemningen er større end 10 MB.");
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("Filen er ikke en gyldig spilgemning.");
  }
  requireRule(
    data &&
      typeof data === "object" &&
      "version" in data &&
      (data as { version: unknown }).version === 2,
    "Denne gemning tilhører v0.1 eller et andet format. Bevar filen og åbn den gamle udgave, eller start et nyt v1-bord.",
  );
  const parsed = data as Game;
  requireRule(
    parsed.ruleset === RULESET &&
      parsed.rulesHash === RULESET_HASH &&
      Array.isArray(parsed.commands) &&
      parsed.commands.length <= 10000,
    "Ukendt regeludgave eller ugyldig journal.",
  );
  const initial = createGame(parsed.config);
  const result = parsed.commands.reduce((s, c) => execute(s, c), initial);
  requireRule(
    canonical(result) === canonical(parsed),
    "Gemningen svarer ikke til dens journal. Den gemte fil er bevaret.",
  );
  return result;
}
export { award };
