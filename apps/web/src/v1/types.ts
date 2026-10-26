import type {
  Command,
  Good,
  PublicPlayer,
  View,
} from "../../../../packages/game-core/src/v1";
type WithoutBase<T> = T extends unknown ? Omit<T, "id" | "player"> : never;
export type Choice = WithoutBase<Command>;
export type Send = (choice: Choice) => Promise<boolean>;
export type Folio =
  | "menu"
  | "rules"
  | "market"
  | "actions"
  | "agreements"
  | "trade"
  | "catalogue"
  | "ledger"
  | "scores"
  | "reaction"
  | "private"
  | "timing"
  | "seal"
  | { country: string }
  | { tender: string }
  | { card: string; back?: boolean }
  | { player: string }
  | null;
export function privatePlayer(view: View, seat: string) {
  const p = view.players.find((p) => p.id === seat);
  if (!p?.inventory || !p.contactsHand)
    throw new Error("Din private hånd er endnu ikke tilgængelig.");
  return { ...p, inventory: p.inventory, contactsHand: p.contactsHand };
}
export function freeGoods(view: View, p: PublicPlayer, good: Good) {
  if (!p.inventory) return 0;
  return (
    p.inventory[good] -
    view.bids
      .filter((b) => ["sealed", "awarded", "transit"].includes(b.status))
      .reduce(
        (n, b) =>
          n +
          (view.tenders.find((t) => t.id === b.tender)?.good === good
            ? (b.details?.pledges
                .filter((x) => x.player === p.id)
                .reduce((n, x) => n + x.quantity, 0) ?? 0)
            : 0),
        0,
      )
  );
}
export function canAct(view: View, seat: string) {
  const p = view.players.find((p) => p.id === seat);
  return (
    view.phase === "actions" &&
    !view.pending &&
    !view.resolving &&
    !view.finished &&
    view.players[view.active]?.id === seat &&
    !!p &&
    p.actions > 0
  );
}
export const freeMoney = (p: PublicPlayer) => p.cash - p.reservedCash;
export const phaseKey = (view: View) => `${view.round}:${view.phase}`;
export const canPlayContact = (view: View, p: PublicPlayer, id: string) =>
  !!p.contactsHand?.includes(id) && p.contactUsed !== phaseKey(view);
export const modeNames = {
  standard: "Standard",
  express: "Ekspres",
  gray: "Grå passage",
};
