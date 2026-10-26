import catalogue from "./catalogue.json" with { type: "json" };
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export const GOODS = ["medical", "communications", "vehicles", "arms"] as const;
export type Good = (typeof GOODS)[number];
export const PHASES = [
  "world",
  "income",
  "negotiation",
  "actions",
  "delivery",
  "scoring",
] as const;
export type Phase = (typeof PHASES)[number];
export const SCENARIOS = ["intro", "standard", "freight", "election"] as const;
export type Scenario = (typeof SCENARIOS)[number];
export type Stance = "open" | "neutral" | "guarded";
export type Family =
  | "Country"
  | "Leader"
  | "Organization"
  | "Supply"
  | "Logistics"
  | "Contact"
  | "Contract"
  | "WorldEvent"
  | "Unrest"
  | "Investigation"
  | "Objective"
  | "Agreement";
export interface Card {
  id: string;
  family: Family;
  title: string;
  timing: string;
  body: string;
  flavor: string;
  collectorCode: string;
  effect?: string;
  reward?: number;
  cost?: number;
  deck?: "world" | "incident";
  iso?: string;
  good?: Good;
  quantity?: number;
  stance?: Stance;
  back?: { title: string; body: string; stance: Stance; flavor: string };
}
export const CATALOGUE = catalogue;
export const CARDS = catalogue.cards as unknown as Card[];
export const CARD = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<
  string,
  Card
>;
export const COUNTRY_DATA = catalogue.countries as Array<{
  iso: string;
  name: string;
  region: string;
  role: string;
  leaders: string[];
  stability: number;
  demand: number;
  stance: Stance;
}>;
export const GOOD_NAMES: Record<Good, string> = {
  medical: "Medicinsk",
  communications: "Kommunikation",
  vehicles: "Køretøjer",
  arms: "Våbenmateriel",
};
export const PHASE_NAMES: Record<Phase, string> = {
  world: "Verden",
  income: "Indkomst",
  negotiation: "Forhandling",
  actions: "Handlinger",
  delivery: "Fragt og kontrol",
  scoring: "Regnskab",
};
export const FIRMS = [
  {
    id: "meridian",
    name: "Meridian & Co.",
    color: "#C7A66B",
    motto: "Første afgang er planlagt. Resten er ønsketænkning.",
    advantage: "Logistik 2",
  },
  {
    id: "northstar",
    name: "Northstar Union",
    color: "#6EACBA",
    motto: "Vi kender nogen, som kender dagsordenen.",
    advantage: "Omdømme 2 og én relation",
  },
  {
    id: "vesper",
    name: "Vesper Exchange",
    color: "#AD91BC",
    motto: "Likviditet er et andet ord for handlefrihed.",
    advantage: "Start med 12 M",
  },
  {
    id: "atlas",
    name: "Atlas Cooperative",
    color: "#87AD8A",
    motto: "Fem underskrifter. Én kuglepen.",
    advantage: "Kontakter 2",
  },
  {
    id: "redwood",
    name: "Redwood Trading",
    color: "#DB9278",
    motto: "Alt kan lagres. Også dårlige beslutninger.",
    advantage: "Lagerplads 8",
  },
] as const;
export const RULESET = "wardogs-1.0" as const;
export const RULESET_HASH = bytesToHex(
  sha256(new TextEncoder().encode(JSON.stringify(catalogue))),
);
export const inventory = (n = 0): Record<Good, number> => ({
  medical: n,
  communications: n,
  vehicles: n,
  arms: n,
});
export const familyCards = (family: Family) =>
  CARDS.filter((c) => c.family === family).map((c) => c.id);
