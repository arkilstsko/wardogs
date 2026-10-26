import { z } from "zod";
import {
  GOODS,
  SCENARIOS,
  type Good,
  type Phase,
  type Scenario,
  type Stance,
} from "./content";
export type Inventory = Record<Good, number>;
export type Mode = "standard" | "express" | "gray";
export interface Configuration {
  seed: number | string;
  count: number;
  scenario: Scenario;
  firms: number[];
  timerMinutes: number | null;
}
export interface DeliveryRecord {
  tender: string;
  country: string;
  region: string;
  good: Good;
  quantity: number;
  ownCargo: number;
  logistics: number;
  cashPaid: number;
  legal: boolean;
  consortium: boolean;
  partners: string[];
}
export interface Player {
  id: string;
  name: string;
  firm: number;
  cash: number;
  debt: number;
  prestige: number;
  reputation: number;
  investigation: number;
  logistics: number;
  contacts: number;
  storage: number;
  actions: number;
  inventory: Inventory;
  relationships: Record<string, number>;
  contactsHand: string[];
  objective: string | null;
  objectiveChoices: string[];
  initialRelationChosen: boolean;
  organizations: string[];
  used: Record<string, number>;
  contactUsed: string | null;
  restructured: boolean;
  repaid: number;
  deliveries: DeliveryRecord[];
  metrics: {
    finesPaid: number;
    audits: number;
    withdrawals: number;
    office: number;
  };
}
export interface Country {
  id: string;
  name: string;
  region: string;
  stability: number;
  demand: number;
  leader: 0 | 1;
  stance: Stance;
  sanctions: boolean;
  sanctionRound: number;
}
export interface Tender {
  id: string;
  card: string;
  country: string;
  good: Good;
  quantity: number;
  payout: number;
  deadline: number;
  relationship: number;
  legal: "legal" | "gray";
  round: number;
  archived: boolean;
  status: "open" | "awarded" | "transit" | "delivered" | "failed" | "unawarded";
  winner?: string;
}
export interface Pledge {
  player: string;
  quantity: number;
  logistics: number;
  freight: number;
  insurance: number;
  revenue: number;
  liability: number;
  contact?: "contact-call" | "contact-capacity";
}
export interface PaidPledge extends Pledge {
  freightPaid: number;
  insurancePaid: number;
  reroutePaid: number;
}
export interface Terms {
  proposer: string;
  offer: number;
  mode: Mode;
  insured: boolean;
  priority: boolean;
  pledges: Pledge[];
}
export interface Bid extends Omit<Terms, "pledges"> {
  id: string;
  tender: string;
  pledges: PaidPledge[];
  escrow: number;
  escrowOwner: string;
  status: "sealed" | "lost" | "awarded" | "transit" | "delivered" | "failed";
  relation: number;
  tieBonus: number;
  arrival: number | null;
  graceUsed: boolean;
  grayMarked: boolean;
}
export interface Agreement extends Terms {
  id: string;
  author: string;
  tender: string;
  kind: "bid" | "amendment";
  bid?: string;
  accepted: string[];
  required: string[];
  status: "draft" | "signed" | "withdrawn";
}
export interface TradeSide {
  goods: Inventory;
  cash: number;
  contacts: string[];
  discard: string[];
}
export interface Trade {
  id: string;
  proposer: string;
  partner: string;
  give: TradeSide;
  receive: TradeSide;
  status: "draft" | "accepted" | "withdrawn";
}
export interface LogEntry {
  seq: number;
  round: number;
  phase: Phase | "setup";
  kind: string;
  text: string;
  roll?: number;
  player?: string;
  tender?: string;
}
export type Step =
  | {
      kind: "loss";
      player: string;
      amount: number;
      reason: string;
      category?: "maintenance" | "penalty";
    }
  | { kind: "enforce"; player: string; skipBefore?: boolean }
  | { kind: "enforce-result"; player: string; roll: number; rerolled: boolean }
  | { kind: "delay"; tender: string; remaining?: string[] }
  | { kind: "arrive" | "deadline"; tender: string }
  | { kind: "coffee"; player: string; tender: string }
  | { kind: "world-contact"; player: string }
  | { kind: "tie"; player: string; tender: string }
  | { kind: "world-event" | "award" }
  | { kind: "incident" };
export type Pending =
  | {
      kind: "loss";
      player: string;
      amount: number;
      reason: string;
      category?: "maintenance" | "penalty";
    }
  | { kind: "before-enforcement"; player: string }
  | { kind: "enforcement"; player: string; roll: number }
  | { kind: "delay"; player: string; tender: string; remaining: string[] }
  | { kind: "coffee"; player: string; tender: string }
  | { kind: "world"; player: string }
  | { kind: "tie"; player: string; tender: string }
  | { kind: "chain"; player: string; cards: string[] }
  | {
      kind: "sanction";
      player: string;
      tender: string;
      proposal?: {
        payments: Array<{ player: string; amount: number }>;
        accepted: string[];
      };
    };
export interface Game {
  version: 2;
  ruleset: "wardogs-1.0";
  rulesHash: string;
  config: Configuration;
  rng: number;
  round: number;
  maxRounds: number;
  phase: Phase | "setup";
  first: number;
  active: number;
  finished: boolean;
  setup: { order: string[]; cursor: number };
  players: Player[];
  countries: Country[];
  prices: Inventory;
  stock: Inventory;
  reserve: Inventory;
  blackMarket: { good: Good; visible: boolean } | null;
  decks: Record<
    | "contracts"
    | "world"
    | "incident"
    | "organizations"
    | "contacts"
    | "objectives",
    string[]
  >;
  discards: Record<
    "contracts" | "world" | "incident" | "contacts" | "objectives",
    string[]
  >;
  organizationRow: string[];
  excludedContracts: string[];
  tenders: Tender[];
  bids: Bid[];
  agreements: Agreement[];
  trades: Trade[];
  ready: string[];
  worldCard: string | null;
  incidentCard: string | null;
  resolution: { steps: Step[]; next: Phase | "finished" } | null;
  pending: Pending | null;
  log: LogEntry[];
  commands: Command[];
}
const good = z.enum(GOODS),
  amount = z.number().int().min(0).max(100);
const mode = z.enum(["standard", "express", "gray"]);
const base = {
  id: z.string().min(1).max(100),
  player: z.string().regex(/^p[0-4]$/),
};
const pledge = z
  .object({
    player: base.player,
    quantity: amount.max(2),
    logistics: amount.max(3),
    freight: amount.max(3),
    insurance: amount.max(1),
    revenue: amount,
    liability: amount,
    contact: z.enum(["contact-call", "contact-capacity"]).optional(),
  })
  .strict();
const terms = {
  offer: z.number().int().min(1).max(40),
  mode,
  insured: z.boolean(),
  priority: z.boolean(),
  pledges: z.array(pledge).min(1).max(5),
};
const side = z
  .object({
    goods: z
      .object({
        medical: amount.max(12),
        communications: amount.max(12),
        vehicles: amount.max(12),
        arms: amount.max(12),
      })
      .strict(),
    cash: amount,
    contacts: z.array(z.string().max(50)).max(4),
    discard: z.array(z.string().max(50)).max(4),
  })
  .strict();
export const ConfigurationSchema = z
  .object({
    seed: z.union([
      z.number().int().min(0).max(4294967295),
      z.string().regex(/^[0-9a-f]{64}$/),
    ]),
    count: z.number().int().min(2).max(5),
    scenario: z.enum(SCENARIOS),
    firms: z.array(z.number().int().min(0).max(4)).min(2).max(5),
    timerMinutes: z.number().int().min(1).max(60).nullable(),
  })
  .strict()
  .superRefine((x, c) => {
    if (x.firms.length !== x.count || new Set(x.firms).size !== x.count)
      c.addIssue({
        code: "custom",
        message: "Vælg forskellige firmaer til alle pladser.",
      });
  });
export const CommandSchema = z.discriminatedUnion("type", [
  z
    .object({
      ...base,
      type: z.enum([
        "advance",
        "ready",
        "audit",
        "office",
        "restructure",
        "pass",
        "black-buy",
        "draw-contact",
      ]),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("choose-objective"),
      card: z.string().max(50),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("choose-relation"),
      country: z.string().length(2),
    })
    .strict(),
  z
    .object({ ...base, type: z.enum(["draft-good", "acquire", "sell"]), good })
    .strict(),
  z
    .object({
      ...base,
      type: z.enum(["influence", "unrest"]),
      country: z.string().length(2),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("network"),
      upgrade: z.enum(["contacts", "logistics"]),
      contact: z.literal("contact-key").optional(),
    })
    .strict(),
  z
    .object({ ...base, type: z.literal("refinance"), repay: z.boolean() })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("organization"),
      card: z.string().max(50),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("bid"),
      tender: z.string().max(100),
      offer: terms.offer,
      mode,
      insured: z.boolean(),
      priority: z.boolean(),
      contact: z.enum(["contact-call", "contact-capacity"]).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("propose"),
      tender: z.string().max(100),
      ...terms,
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("amend"),
      tender: z.string().max(100),
      proposer: base.player,
      ...terms,
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("revise"),
      agreement: z.string().max(100),
      ...terms,
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("attach-contact"),
      agreement: z.string().max(100),
      contact: z.enum(["contact-call", "contact-capacity"]).nullable(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.enum(["accept", "withdraw"]),
      agreement: z.string().max(100),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("transport"),
      tender: z.string().max(100),
      contact: z.literal("contact-stamp").optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("trade"),
      partner: base.player,
      give: side,
      receive: side,
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("accept-trade"),
      trade: z.string().max(100),
      discard: z.array(z.string().max(50)).max(4),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("withdraw-trade"),
      trade: z.string().max(100),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("contact"),
      card: z.string().max(50),
      tender: z.string().max(100).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("reaction"),
      use: z.boolean(),
      card: z.enum(["contact-paid", "contact-lunch"]).optional(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("choose-chain"),
      card: z.string().max(50).nullable(),
    })
    .strict(),
  z
    .object({
      ...base,
      type: z.literal("reroute"),
      choice: z.enum(["propose", "accept", "wait"]),
      payments: z
        .array(
          z.object({ player: base.player, amount: amount.max(2) }).strict(),
        )
        .max(5)
        .optional(),
    })
    .strict(),
]);
export type Command = z.infer<typeof CommandSchema>;
export type PublicPlayer = Omit<
  Player,
  "inventory" | "contactsHand" | "objective" | "objectiveChoices"
> & {
  inventory?: Inventory;
  contactsHand?: string[];
  objective?: string | null;
  objectiveChoices?: string[];
  objectiveChosen: boolean;
  inventoryCount: number;
  contactCount: number;
  reservedCargo: number;
  reservedCash: number;
  reservedLogistics: number;
};
export interface PublicBid {
  id: string;
  tender: string;
  proposer: string;
  status: Bid["status"];
  sealed: boolean;
  details?: Bid;
}
export interface View {
  version: 2;
  ruleset: string;
  rulesHash: string;
  round: number;
  maxRounds: number;
  scenario: Scenario;
  phase: Game["phase"];
  first: number;
  active: number;
  finished: boolean;
  setup: Game["setup"];
  players: PublicPlayer[];
  countries: Country[];
  prices: Inventory;
  stock: Inventory;
  reserve: Inventory | null;
  blackMarket: Game["blackMarket"];
  organizationRow: string[];
  tenders: Tender[];
  bids: PublicBid[];
  agreements: Agreement[];
  trades: Trade[];
  ready: string[];
  worldCard: string | null;
  incidentCard: string | null;
  pending: Pending | null;
  resolving: boolean;
  log: LogEntry[];
  deckCounts: Record<string, number>;
  discardedContacts: string[];
  timerMinutes: number | null;
}
