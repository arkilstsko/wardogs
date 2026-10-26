# GDD v1 — 2026-10-25 / provisional

## Intent and audience

Desktop-first physical-style negotiation game for 2–5 houses, solo heuristic opponents, local hot-seat and authoritative online play. Target 90–120 minutes and ≤10 minutes to first-turn comprehension; neither measured with humans. Real countries provide geography, not claims about their actual administrations. All leaders and commercial entities are fictional. Cargo categories are medical, communications and utility vehicles; quantities and currencies are abstract.

The experience should foreground commitments, limited actions, asymmetric incentives and consequences. The digital table automates accounting but must explain every state transition. Designs and rules remain provisional until primary-rule gaps, strategy screening and blind human tests close.

## Current playable loop

Eight rounds, six phases: World Event → Income & Upkeep → Negotiation → Player Actions → Delivery & Enforcement → Scoring & Refresh. Three actions per player, spent on bids and action-phase commands. Starting player is seeded after tender setup; rotate each round. Public lowest-payout tenders require full cargo/logistics reservations and pay on delivery only. Signed coalitions divide revenue and liability using largest-remainder integer allocation. Acquisitions/sales move bounded prices and finite stock. Political pressure creates shared consequences and investigation rather than exclusive opportunities.

## Content and originality

15 countries; five fictional houses; three supply categories; six implemented world event effects; procedural public tenders; country leadership alternates fictional names on succession. Proposed 12-deck metadata exists, but does not imply 12 fully authored executable decks. The current engine implements command effects rather than one function for each catalogue placeholder. Leader personalities, private offers, all proposed organizations, contacts and unrest/investigation cards need authored content and tests.

Original combination: real geography, fictional administrations, lowest-payout delivery auctions, enforceable nonexclusive consortium pledges, shared destabilization effects and a bounded investigation economy. No source game's rules prose, artwork, layouts, names or characters are copied. Research register explains inspirations and unavailable sources. This is not an IP or trademark legal opinion.

## Firm setup

All: cash10, 2 cargo in a firm-associated category, contacts1, logistics1, investigation0, reputation1. Meridian logistics2 (with recurring upkeep); Northstar reputation2; Vesper cash12; Atlas contacts2; Redwood storage8 rather than6. These are unbalanced candidates, not approved asymmetries. Fixed objective association and unequal usefulness of reputation/contacts likely distort current faction value. Test against identical policies and varied strategies before adjusting points.

## UX contract

Central SVG world, opponent mats, supply cards, deck representations, finite market, tender cards, phase track and action ledger. Click/keyboard operation always available alongside pointer drag. Dragging onto a matching tender opens an explicit bid preview; it cannot auto-sign. Error feedback preserves state. Dialogs are native modal elements with Escape/focus behavior. Hot-seat switches use a privacy curtain. Client undo is local only, limited to non-revealing economic actions and cleared by bot/other-seat activity. Online undo/export is disabled.

## Milestones and gates

1. Access and research: private existing repo verified; Figma connected. Research partial with explicit source gaps.
2. Engine: complete eight-round games and deterministic replay; command/invariant/security tests. Not all proposed content authored.
3. Design: editable foundations/cards/icons/table. Secondary screens specification-level; all-state and responsive parity open.
4. Local tabletop: full game, bots, tutorial, saves. Full Danish narrative, robust screen-reader and DnD validation open.
5. Online: authoritative local three-seat play, reconnect token, per-seat hidden views. Persistent recovery and production identity open.
6. Balance: two10k screening runs retained; gate fails. Human games0/30. No fun claim.
7. Release/manufacturing: blocked; no public deployment, paid purchase or outbound factory request made.

## Risks and decisions

- Huge initial seat skew was evidence of ordering bias, not proof of intrinsic strategy dominance. Seed first player and rotate bot negotiation order; retain original outcomes. Revised screen still fails for3–5 players.
- Reputation/contacts do not yet carry enough consequence; firm bonuses are not comparable.
- Public events and initial stock are deterministic. The server hides seed/RNG; future shuffled content needs a server-private secret seed lifecycle and spectator/replay release policy.
- Negotiation is an untimed simultaneous phase; no chat system is included. Local conversations happen at the table. Online communication needs moderation/privacy/abuse design and host disconnect handling.
- No claim of China factory pricing or printer readiness without actual supplier evidence.
