import {
  CARD,
  CARDS,
  COUNTRY_DATA,
  FIRMS,
  GOODS,
  PHASES,
  RULESET,
  RULESET_HASH,
  familyCards,
  inventory,
  type Good,
} from "./content";
import {
  ConfigurationSchema,
  type Bid,
  type Configuration,
  type Country,
  type Game,
  type Player,
  type PublicPlayer,
  type Terms,
  type View,
} from "./model";
import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { hexToBytes } from "@noble/hashes/utils.js";

export function requireRule(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message);
}
export const clamp = (n: number, max = 6) => Math.max(0, Math.min(max, n));
export const totalGoods = (p: Pick<Player, "inventory">) =>
  GOODS.reduce((n, g) => n + p.inventory[g], 0);
export const player = (s: Game, id: string) => {
  const p = s.players.find((p) => p.id === id);
  requireRule(p, "Ukendt handelshus.");
  return p;
};
export const country = (s: Game, id: string) => {
  const c = s.countries.find((c) => c.id === id);
  requireRule(c, "Landet er ikke med i dette scenarie.");
  return c;
};
export const tender = (s: Game, id: string) => {
  const t = s.tenders.find((t) => t.id === id);
  requireRule(t, "Ukendt kontrakt.");
  return t;
};
export const bid = (s: Game, id: string) => {
  const b = s.bids.find((b) => b.id === id);
  requireRule(b, "Ukendt bud.");
  return b;
};
export const liveBids = (s: Game, exclude?: string) =>
  s.bids.filter(
    (b) =>
      b.id !== exclude && ["sealed", "awarded", "transit"].includes(b.status),
  );
export function reserved(
  s: Game,
  id: string,
  kind: "cargo" | "logistics" | "cash",
  good?: Good,
  exclude?: string,
) {
  return liveBids(s, exclude).reduce(
    (sum, b) =>
      sum +
      b.pledges
        .filter((p) => p.player === id)
        .reduce(
          (n, p) =>
            n +
            (kind === "cargo"
              ? !good || tender(s, b.tender).good === good
                ? p.quantity
                : 0
              : kind === "logistics"
                ? p.logistics
                : b.status === "transit"
                  ? 0
                  : p.freight + p.insurance),
          0,
        ),
    0,
  );
}
export const temporaryLogistics = (s: Game, id: string, exclude?: string) =>
  liveBids(s, exclude).reduce(
    (n, b) =>
      n +
      b.pledges.filter(
        (p) => p.player === id && p.contact === "contact-capacity",
      ).length,
    0,
  );
export const available = (s: Game, p: Player, g: Good, exclude?: string) =>
  p.inventory[g] - reserved(s, p.id, "cargo", g, exclude);
export const freeCash = (s: Game, p: Player, exclude?: string) =>
  p.cash - reserved(s, p.id, "cash", undefined, exclude);
export const hasOrg = (p: Player, id: string) =>
  p.organizations.includes("org-" + id);
export const unusedOrg = (s: Game, p: Player, id: string) =>
  hasOrg(p, id) && p.used["org-" + id] !== s.round;
export const useOrg = (s: Game, p: Player, id: string) => {
  p.used["org-" + id] = s.round;
};
export const contactKey = (s: Game) => `${s.round}:${s.phase}`;
export const canContact = (s: Game, p: Player, id: string) =>
  s.config.scenario !== "intro" &&
  p.contactsHand.includes("contact-" + id) &&
  p.contactUsed !== contactKey(s);
// Window eligibility uses public information, never the identity of a held card.
export const canReact = (s: Game, p: Player) =>
  s.config.scenario !== "intro" &&
  p.contactsHand.length > 0 &&
  p.contactUsed !== contactKey(s);
export function consumeContact(s: Game, p: Player, id: string) {
  requireRule(
    canContact(s, p, id),
    "Dit kontaktkort kan ikke bruges nu, eller du har allerede spillet et i fasen.",
  );
  p.contactsHand.splice(p.contactsHand.indexOf("contact-" + id), 1);
  s.discards.contacts.push("contact-" + id);
  p.contactUsed = contactKey(s);
  log(s, `${p.name} spiller ${CARD["contact-" + id].title}.`, "contact");
}
export const contactLimit = (p: Player) =>
  p.contacts + (hasOrg(p, "contacts") ? 1 : 0);
export const initiative = (s: Game, id: string) =>
  (s.players.findIndex((p) => p.id === id) - s.first + s.players.length) %
  s.players.length;
export function log(
  s: Game,
  text: string,
  kind = "action",
  extra: Partial<Game["log"][number]> = {},
) {
  s.log.push({
    seq: s.log.length,
    round: s.round,
    phase: s.phase,
    kind,
    text,
    ...extra,
  });
}
export function random(s: Game, max: number) {
  requireRule(
    Number.isInteger(max) && max > 0 && max <= 4294967296,
    "Ugyldig tilfældig pulje.",
  );
  const encoder = new TextEncoder();
  const key =
    typeof s.config.seed === "string"
      ? hexToBytes(s.config.seed)
      : sha256(encoder.encode("numeric-replay-seed:" + s.config.seed));
  const ceiling = Math.floor(4294967296 / max) * max;
  for (;;) {
    const bytes = hmac(sha256, key, encoder.encode(RULESET + ":" + s.rng++));
    const value = new DataView(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength,
    ).getUint32(0);
    if (value < ceiling) return value % max;
  }
}
export function shuffle(s: Game, ids: string[]) {
  const out = ids.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = random(s, i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function draw(
  s: Game,
  deck: "contracts" | "world" | "incident" | "contacts",
) {
  if (!s.decks[deck].length && s.discards[deck].length) {
    s.decks[deck] = shuffle(s, s.discards[deck]);
    s.discards[deck] = [];
  }
  return s.decks[deck].shift() ?? null;
}
export function drawContact(s: Game, p: Player) {
  if (p.contactsHand.length >= contactLimit(p)) return null;
  const id = draw(s, "contacts");
  if (id) p.contactsHand.push(id);
  return id;
}
export function pay(s: Game, p: Player, n: number, exclude?: string) {
  requireRule(Number.isSafeInteger(n) && n >= 0, "Ugyldig betaling.");
  requireRule(freeCash(s, p, exclude) >= n, `Der kræves ${n} M i frie penge.`);
  p.cash -= n;
}
export function forcedLoss(s: Game, p: Player, n: number, countFine = true) {
  const cash = Math.min(freeCash(s, p), n);
  p.cash -= cash;
  const debt = Math.min(9 - p.debt, n - cash);
  p.debt += debt;
  p.prestige = Math.max(0, p.prestige - (n - cash - debt));
  if (countFine) p.metrics.finesPaid += cash;
}
export function allocate(total: number, shares: number[]) {
  requireRule(
    Number.isSafeInteger(total) &&
      total >= 0 &&
      shares.length > 0 &&
      shares.every((n) => Number.isSafeInteger(n) && n >= 0) &&
      shares.reduce((n, s) => n + s, 0) === 100,
    "Andelene skal give præcis 100 %.",
  );
  const result = shares.map((s) => Math.floor((total * s) / 100));
  const order = shares
    .map((s, i) => ({ i, r: (total * s) % 100 }))
    .sort((a, b) => b.r - a.r || a.i - b.i);
  for (const { i } of order.slice(0, total - result.reduce((n, v) => n + v, 0)))
    result[i]++;
  return result;
}
export function modeLogistics(terms: Pick<Terms, "mode" | "priority">) {
  return terms.mode === "express" ? (terms.priority ? 1 : 2) : 1;
}
export const modeFee = (mode: Terms["mode"]) => (mode === "express" ? 3 : 1);
export const meaningful = (pledge: Bid["pledges"][number]) =>
  pledge.quantity > 0 ||
  pledge.logistics > 0 ||
  pledge.freightPaid + pledge.insurancePaid + pledge.reroutePaid >= 1;
export function changeStability(s: Game, c: Country, delta: number) {
  c.stability = clamp(c.stability + delta);
  if (c.stability <= 1) {
    c.sanctions = true;
    c.sanctionRound = s.round;
  }
  if (c.stability === 0) succession(s, c);
}
export function succession(s: Game, c: Country) {
  c.leader = c.leader === 0 ? 1 : 0;
  c.stance =
    c.leader === 0
      ? COUNTRY_DATA.find((x) => x.iso === c.id)!.stance
      : CARD["leader-" + c.id].back!.stance;
  c.stability = 3;
  c.sanctions = true;
  c.sanctionRound = s.round;
  for (const p of s.players)
    p.relationships[c.id] = Math.max(0, (p.relationships[c.id] ?? 0) - 1);
  log(
    s,
    `${c.name}: ${leaderName(c)} overtager. Relationer falder; sanktioner gælder resten af runden.`,
    "succession",
  );
}
export function leaderName(c: Country) {
  const card = CARD["leader-" + c.id];
  return c.leader === 0 ? card.title : card.back!.title;
}
export function prepareBlackMarket(s: Game) {
  if (s.blackMarket) s.reserve[s.blackMarket.good]++;
  s.blackMarket = null;
  if (s.config.scenario === "intro") return;
  const choices = GOODS.filter((g) => s.reserve[g] > 0);
  if (choices.length) {
    const g = choices[random(s, choices.length)];
    s.reserve[g]--;
    s.blackMarket = { good: g, visible: false };
  }
}
export function fillOrganizations(s: Game) {
  if (s.config.scenario === "intro") return;
  while (s.organizationRow.length < 3 && s.decks.organizations.length)
    s.organizationRow.push(s.decks.organizations.shift()!);
}
export function exposeTender(s: Game, cardId: string) {
  const card = CARD[cardId],
    c = country(s, card.iso!),
    q = card.quantity!,
    g = card.good!;
  const legal = c.stability <= 1 ? "gray" : "legal";
  s.tenders.push({
    id: `r${s.round}-${cardId}-${s.tenders.length}`,
    card: cardId,
    country: c.id,
    good: g,
    quantity: q,
    payout:
      q * s.prices[g] +
      4 +
      Math.floor(c.demand / 2) +
      (c.stance === "open" ? 1 : 0) +
      (legal === "gray" ? 3 : 0),
    deadline: Math.min(s.maxRounds, s.round + 2),
    relationship: c.stance === "guarded" ? 1 : 0,
    legal,
    round: s.round,
    archived: false,
    status: "open",
  });
}
export function fillTenders(s: Game) {
  const wanted = s.players.length + 2;
  if (s.round === 1 && !s.tenders.length) {
    const initial =
      s.config.scenario === "intro"
        ? ["contract-01", "contract-20", "contract-12", "contract-25"]
        : GOODS.map((g) =>
            s.decks.contracts.find((id) => CARD[id].good === g),
          ).filter((x): x is string => !!x);
    for (const id of initial.slice(0, wanted)) {
      const i = s.decks.contracts.indexOf(id);
      if (i >= 0) {
        s.decks.contracts.splice(i, 1);
        exposeTender(s, id);
      }
    }
    if (s.config.scenario !== "intro")
      s.decks.contracts = shuffle(s, s.decks.contracts);
  }
  while (s.tenders.filter((t) => t.status === "open").length < wanted) {
    const id = draw(s, "contracts");
    if (!id) break;
    exposeTender(s, id);
  }
}
export function createGame(options: Partial<Configuration> = {}): Game {
  const count = options.count ?? 3;
  const config = ConfigurationSchema.parse({
    seed: 20261026,
    count,
    scenario: "standard",
    firms: Array.from({ length: count }, (_, i) => i),
    timerMinutes: count === 2 ? 3 : count === 3 ? 4 : 5,
    ...options,
  });
  const intro = config.scenario === "intro";
  const countries = COUNTRY_DATA.filter(
    (c) => !intro || ["DK", "DE", "IT", "NG", "IN", "BR"].includes(c.iso),
  );
  const s: Game = {
    version: 2,
    ruleset: RULESET,
    rulesHash: RULESET_HASH,
    config,
    rng: 0,
    round: 1,
    maxRounds: intro || config.scenario === "freight" ? 6 : 8,
    phase: "setup",
    first: 0,
    active: 0,
    finished: false,
    setup: { order: [], cursor: 0 },
    players: [],
    countries: countries.map((c) => ({
      id: c.iso,
      name: c.name,
      region: c.region,
      stability: config.scenario === "election" ? 2 : c.stability,
      demand: config.scenario === "election" ? 3 : c.demand,
      leader: 0,
      stance: c.stance,
      sanctions: false,
      sanctionRound: 0,
    })),
    prices:
      config.scenario === "freight"
        ? { medical: 3, communications: 4, vehicles: 5, arms: 6 }
        : { medical: 2, communications: 3, vehicles: 4, arms: 5 },
    stock: inventory(),
    reserve: inventory(12),
    blackMarket: null,
    decks: {
      contracts: [],
      world: [],
      incident: [],
      organizations: [],
      contacts: [],
      objectives: [],
    },
    discards: {
      contracts: [],
      world: [],
      incident: [],
      contacts: [],
      objectives: [],
    },
    excludedContracts: [],
    organizationRow: [],
    tenders: [],
    bids: [],
    agreements: [],
    trades: [],
    ready: [],
    worldCard: null,
    incidentCard: null,
    resolution: null,
    pending: null,
    log: [],
    commands: [],
  };
  s.first = random(s, count);
  s.active = s.first;
  s.decks.contracts = shuffle(
    s,
    familyCards("Contract").filter((id) =>
      s.countries.some((c) => c.id === CARD[id].iso),
    ),
  );
  s.excludedContracts = familyCards("Contract").filter(
    (id) => !s.decks.contracts.includes(id),
  );
  s.decks.world = shuffle(
    s,
    CARDS.filter((c) => c.deck === "world").map((c) => c.id),
  );
  s.decks.incident = shuffle(
    s,
    CARDS.filter(
      (c) =>
        c.deck === "incident" &&
        (config.scenario !== "freight" || c.id !== "incident-form"),
    ).map((c) => c.id),
  );
  s.decks.organizations = shuffle(s, familyCards("Organization"));
  s.decks.contacts = shuffle(s, familyCards("Contact"));
  s.decks.objectives = shuffle(s, familyCards("Objective"));
  for (let i = 0; i < count; i++) {
    const f = config.firms[i];
    const p: Player = {
      id: "p" + i,
      name: FIRMS[f].name,
      firm: f,
      cash: !intro && f === 2 ? 12 : 10,
      debt: 0,
      prestige: 0,
      reputation: !intro && f === 1 ? 2 : 1,
      investigation: 0,
      logistics: !intro && f === 0 ? 2 : 1,
      contacts: !intro && f === 3 ? 2 : 1,
      storage: !intro && f === 4 ? 8 : 6,
      actions: 3,
      inventory: inventory(),
      relationships: {},
      contactsHand: [],
      objective: null,
      objectiveChoices: [],
      initialRelationChosen: intro || f !== 1,
      organizations: [],
      used: {},
      contactUsed: null,
      restructured: false,
      repaid: 0,
      deliveries: [],
      metrics: { finesPaid: 0, audits: 0, withdrawals: 0, office: 0 },
    };
    if (!intro) p.objectiveChoices = s.decks.objectives.splice(0, 2);
    s.players.push(p);
  }
  const order = Array.from(
    { length: count },
    (_, i) => s.players[(s.first + i) % count].id,
  );
  s.setup.order = [...order, ...order.slice().reverse()];
  log(
    s,
    "Bordet er åbent. Vælg mål, Northstars relation og to startvarer i slangedraft.",
    "setup",
  );
  assertInvariants(s);
  return s;
}
export function completeSetup(s: Game) {
  requireRule(
    s.setup.cursor === s.setup.order.length,
    "Fordel alle startvarer først.",
  );
  requireRule(
    s.players.every(
      (p) =>
        (s.config.scenario === "intro" || p.objective) &&
        p.initialRelationChosen,
    ),
    "Vælg mål og Northstars startrelation først.",
  );
  prepareBlackMarket(s);
  const limit = s.config.scenario === "freight" ? 6 : 8;
  for (const g of GOODS) {
    const n = Math.min(limit, s.reserve[g]);
    s.stock[g] += n;
    s.reserve[g] -= n;
  }
  if (s.config.scenario !== "intro")
    for (const p of s.players)
      for (let i = 0; i < p.contacts; i++) drawContact(s, p);
  fillOrganizations(s);
  s.phase = "world";
  if (s.blackMarket) s.blackMarket.visible = true;
  log(s, "Startvarerne er fordelt. Runde 1 begynder.", "setup");
}
export type ScorablePlayer = Pick<
  Player,
  | "id"
  | "name"
  | "cash"
  | "inventory"
  | "debt"
  | "prestige"
  | "relationships"
  | "objective"
  | "investigation"
  | "restructured"
  | "repaid"
  | "deliveries"
>;
export function objectiveBonus(
  p: Pick<
    ScorablePlayer,
    | "objective"
    | "deliveries"
    | "investigation"
    | "relationships"
    | "cash"
    | "debt"
    | "repaid"
  >,
) {
  if (!p.objective) return 0;
  const d = p.deliveries,
    relations = Object.values(p.relationships);
  const achieved: Record<string, boolean> = {
    legitimate: d.filter((x) => x.legal).length >= 3 && p.investigation === 0,
    diplomat: relations.filter((n) => n >= 2).length >= 3,
    consortium: d.filter((x) => x.consortium).length >= 2,
    exporter: new Set(d.map((x) => x.country)).size >= 3,
    tonnage: d.reduce((n, x) => n + x.ownCargo, 0) >= 4,
    regions: new Set(d.map((x) => x.region)).size >= 2,
    ledger: d.length >= 1 && p.cash >= 18 && p.debt === 0,
    repay: p.repaid >= 6 && p.debt === 0,
    broker:
      d.filter((x) => x.ownCargo === 0 && (x.logistics > 0 || x.cashPaid > 0))
        .length >= 2,
    home: d.some((x) => (p.relationships[x.country] ?? 0) === 3),
    gray:
      d.some((x) => x.legal) && d.some((x) => !x.legal) && p.investigation <= 1,
    mixed: GOODS.every((g) => d.some((x) => x.good === g && x.ownCargo > 0)),
  };
  return achieved[p.objective.replace("objective-", "")]
    ? CARD[p.objective].reward!
    : 0;
}
export function scoreBreakdown(
  s: { config: Pick<Configuration, "scenario"> },
  p: ScorablePlayer,
) {
  const wealth = Math.floor((p.cash + totalGoods(p) - p.debt) / 3),
    relations = Object.values(p.relationships).filter((n) => n >= 2).length,
    objective = objectiveBonus(p),
    investigation = -2 * p.investigation,
    restructure = p.restructured ? -4 : 0,
    scenario =
      s.config.scenario === "election"
        ? Math.min(
            3,
            Object.values(p.relationships).filter((n) => n === 3).length,
          )
        : 0;
  return {
    wealth,
    prestige: p.prestige,
    relations,
    objective,
    investigation,
    restructure,
    scenario,
    total:
      wealth +
      p.prestige +
      relations +
      objective +
      investigation +
      restructure +
      scenario,
  };
}
export function standings(s: {
  config: Pick<Configuration, "scenario">;
  players: ScorablePlayer[];
}) {
  const sorted = s.players
    .map((p) => ({
      player: p.id,
      name: p.name,
      ...scoreBreakdown(s, p),
      investigationTrack: p.investigation,
      cash: p.cash,
    }))
    .sort(
      (a, b) =>
        b.total - a.total ||
        b.prestige - a.prestige ||
        a.investigationTrack - b.investigationTrack ||
        b.cash - a.cash,
    );
  return sorted.map((p, i) => ({
    ...p,
    rank:
      i > 0 &&
      p.total === sorted[i - 1].total &&
      p.prestige === sorted[i - 1].prestige &&
      p.investigationTrack === sorted[i - 1].investigationTrack &&
      p.cash === sorted[i - 1].cash
        ? sorted.findIndex(
            (x) =>
              x.total === p.total &&
              x.prestige === p.prestige &&
              x.investigationTrack === p.investigationTrack &&
              x.cash === p.cash,
          ) + 1
        : i + 1,
  }));
}
export function assertInvariants(s: Game) {
  requireRule(
    s.version === 2 &&
      s.ruleset === RULESET &&
      s.rulesHash === RULESET_HASH &&
      s.players.length === s.config.count,
    "Ugyldig spiludgave eller spillerantal.",
  );
  requireRule(
    s.round >= 1 &&
      s.round <= s.maxRounds &&
      (s.phase === "setup" || PHASES.includes(s.phase)),
    "Ugyldig runde eller fase.",
  );
  for (const p of s.players) {
    for (const n of [
      p.cash,
      p.debt,
      p.prestige,
      p.reputation,
      p.investigation,
      p.logistics,
      p.contacts,
      p.actions,
      p.repaid,
      ...Object.values(p.inventory),
      ...Object.values(p.relationships),
    ])
      requireRule(
        Number.isSafeInteger(n) && n >= 0,
        "En ressource er negativ eller ikke et helt tal.",
      );
    requireRule(
      p.debt <= 9 &&
        p.reputation <= 3 &&
        p.investigation <= 6 &&
        p.logistics <= 3 &&
        p.contacts <= 3 &&
        p.actions <= 3,
      "Et spor overskrider loftet.",
    );
    requireRule(
      totalGoods(p) <= p.storage && p.contactsHand.length <= contactLimit(p),
      "Hånd eller lager er fuldt.",
    );
    requireRule(freeCash(s, p) >= 0, "Kontanter er reserveret to gange.");
    for (const g of GOODS)
      requireRule(available(s, p, g) >= 0, "Varer er reserveret to gange.");
    requireRule(
      reserved(s, p.id, "logistics") <=
        p.logistics + temporaryLogistics(s, p.id) &&
        p.logistics + temporaryLogistics(s, p.id) <= 3,
      "Logistik er reserveret to gange eller over loftet.",
    );
    requireRule(
      Object.values(p.relationships).every((n) => n <= 3),
      "Relation over loftet.",
    );
  }
  for (const g of GOODS) {
    requireRule(
      s.prices[g] >= 1 && s.prices[g] <= 8 && Number.isInteger(s.prices[g]),
      "Markedspris uden for 1–8.",
    );
    requireRule(
      Number.isInteger(s.stock[g]) &&
        s.stock[g] >= 0 &&
        s.stock[g] <= 12 &&
        Number.isInteger(s.reserve[g]) &&
        s.reserve[g] >= 0,
      "Ugyldigt varelager.",
    );
    requireRule(
      s.stock[g] +
        s.reserve[g] +
        s.players.reduce((n, p) => n + p.inventory[g], 0) +
        (s.blackMarket?.good === g ? 1 : 0) ===
        12,
      "Den fysiske varepulje skal altid være 12.",
    );
  }
  for (const c of s.countries)
    requireRule(
      [c.stability, c.demand].every(
        (n) => Number.isInteger(n) && n >= 0 && n <= 6,
      ) &&
        (![0, 1].includes(c.stability) || c.sanctions),
      "Ugyldigt landespor.",
    );
  for (const b of s.bids) {
    requireRule(
      b.pledges.reduce((n, p) => n + p.revenue, 0) === 100 &&
        b.pledges.reduce((n, p) => n + p.liability, 0) === 100,
      "Ugyldige aftaleandele.",
    );
    requireRule(
      b.pledges.reduce((n, p) => n + p.quantity, 0) ===
        tender(s, b.tender).quantity,
      "Forkert lastmængde.",
    );
  }
  const contacts = [
    ...s.decks.contacts,
    ...s.discards.contacts,
    ...s.players.flatMap((p) => p.contactsHand),
    ...(s.pending?.kind === "chain" ? s.pending.cards : []),
  ];
  requireRule(
    contacts.length === 12 &&
      new Set(contacts).size === 12 &&
      contacts.every((id) => CARD[id]?.family === "Contact"),
    "Kontaktpuljen er ikke bevaret.",
  );
  const orgs = [
    ...s.decks.organizations,
    ...s.organizationRow,
    ...s.players.flatMap((p) => p.organizations),
  ];
  requireRule(
    orgs.length === 12 &&
      new Set(orgs).size === 12 &&
      s.players.every((p) => p.organizations.length <= 2),
    "Organisationspuljen er ikke bevaret.",
  );
  const contracts = [
    ...s.decks.contracts,
    ...s.discards.contracts,
    ...s.excludedContracts,
    ...s.tenders.filter((t) => !t.archived).map((t) => t.card),
  ];
  requireRule(
    contracts.length === 32 && new Set(contracts).size === 32,
    "Kontraktpuljen er ikke bevaret.",
  );
  const objectives = [
    ...s.decks.objectives,
    ...s.discards.objectives,
    ...s.players.flatMap((p) => [
      ...p.objectiveChoices,
      ...(p.objective ? [p.objective] : []),
    ]),
  ];
  requireRule(
    objectives.length === 12 && new Set(objectives).size === 12,
    "Målpuljen er ikke bevaret.",
  );
}
export function viewFor(s: Game, pid: string): View {
  requireRule(
    s.players.some((p) => p.id === pid),
    "Ukendt privat plads.",
  );
  const reveal =
    s.finished ||
    s.phase !== "negotiation" ||
    s.players.every((p) => s.ready.includes(p.id));
  const players: PublicPlayer[] = s.players.map((p) => {
    const {
      inventory: goods,
      contactsHand,
      objective,
      objectiveChoices,
      ...publicData
    } = p;
    return {
      ...structuredClone(publicData),
      objectiveChosen: s.config.scenario === "intro" || p.objective !== null,
      inventoryCount: totalGoods(p),
      contactCount: contactsHand.length,
      reservedCargo: reserved(s, p.id, "cargo"),
      reservedCash: reserved(s, p.id, "cash"),
      reservedLogistics: reserved(s, p.id, "logistics"),
      ...(p.id === pid || s.finished
        ? {
            inventory: { ...goods },
            contactsHand: contactsHand.slice(),
            objective,
            objectiveChoices: objectiveChoices.slice(),
          }
        : {}),
    };
  });
  const pending = s.pending ? structuredClone(s.pending) : null;
  if (pending?.kind === "chain" && pending.player !== pid) pending.cards = [];
  return {
    version: 2,
    ruleset: RULESET,
    rulesHash: RULESET_HASH,
    round: s.round,
    maxRounds: s.maxRounds,
    scenario: s.config.scenario,
    phase: s.phase,
    first: s.first,
    active: s.active,
    finished: s.finished,
    setup: structuredClone(s.setup),
    players,
    countries: structuredClone(s.countries),
    prices: { ...s.prices },
    stock: { ...s.stock },
    reserve: s.blackMarket && !s.blackMarket.visible ? null : { ...s.reserve },
    blackMarket: s.blackMarket?.visible ? { ...s.blackMarket } : null,
    organizationRow: s.organizationRow.slice(),
    tenders: structuredClone(s.tenders),
    bids: s.bids.map((b) => ({
      id: b.id,
      tender: b.tender,
      proposer: b.proposer,
      status: b.status,
      sealed: !reveal && !b.pledges.some((p) => p.player === pid),
      ...(reveal || b.pledges.some((p) => p.player === pid)
        ? { details: structuredClone(b) }
        : {}),
    })),
    agreements: structuredClone(
      s.agreements.filter(
        (a) => a.required.includes(pid) || (a.status === "signed" && reveal),
      ),
    ),
    trades: structuredClone(
      s.trades.filter((t) => t.proposer === pid || t.partner === pid),
    ),
    ready: s.ready.slice(),
    worldCard: s.worldCard,
    incidentCard: s.incidentCard,
    pending,
    resolving: !!s.resolution,
    log: structuredClone(s.log),
    deckCounts: Object.fromEntries(
      Object.entries(s.decks).map(([k, v]) => [k, v.length]),
    ),
    discardedContacts: s.discards.contacts.slice(),
    timerMinutes: s.config.timerMinutes,
  };
}
