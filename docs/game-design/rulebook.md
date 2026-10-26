# Experimental rulebook v0.1

**This describes the implemented game, not the complete proposed commercial content.** Last edited2026-10-25. Values are integers in abstract million-money units.

## Setup and public information

Choose2–5 houses; use a32-bit seed. Countries: Denmark, UK, France, Germany, Poland, Spain, Italy, Türkiye, Egypt, Nigeria, India, Brazil, US, Japan, South Africa. Each receives stability3–5 and demand2–4 by setup order, a fictional compatible head-of-government title and open/neutral/guarded stance. Current stance is informational. Relationship starts0, capped3. Fictional leader names change on succession; individual advantage/drawback/trigger decks are not yet implemented.

Each house has10 money,2 supplies,1 contact,1 logistics,0 debt,0 investigation,0 prestige,1 reputation, subject to its GDD bonus. Storage6 (Redwood8), logistics/contact cap3. Markets start8 tokens of each good; prices medical2/communications3/vehicles4. All player resources except cargo composition and secret objective are public online. Local hot-seat privacy relies on the curtain and players respecting the screen.

Starting player is seeded; rotate clockwise each round. Three action tokens are available each round; public bids consume them before alternating Player Actions. A player can spend at most3 total.

## Six phases

1. **World Event.** Host/any local house advances to draw and resolve exactly one event. Calm:+1 all stability; price:+1 communications price; scrutiny:−1 reputation for investigation≥3; demand:+1 all demand; relief:+2 lowest stability country (setup order ties); credit:add1 debt upkeep this round. Tracks clamp to valid range. Events sample with replacement in this edition, not a physical shuffled finite deck; physical analogue is a table/die lookup. A finite event deck is a content gate.
2. **Income & Upkeep.** Receive3. Pay ceil(debt/3) interest, plus1 if logistics>1, plus1 if credit event and in debt. Shortfalls consume remaining cash, add debt up to9, then lose prestige down to0. No player elimination.
3. **Negotiation.** Public tender bid specifies desired payout, between1 and printed ceiling. Bid costs1 action and1 cash escrow; reserves full cargo and logistics. Each proposer can submit one bid per tender. Reserved resources cannot support another bid or be sold. A house may participate in different consortia and also bid separately if it has spare resources. Investigation≥5 excludes a participant. All houses seal ready; sealed houses cannot bid or sign. When all ready, advance to award each tender: lowest payout; higher proposer-country relationship; earlier command submission; seeded die if still tied. Earlier submissions are unique in normal operation, so the die is generally unreachable. Losers regain escrow and all reservations. Winner retains reservations and no payout is made yet.
4. **Player Actions.** Starting at rotating first house, alternate one command until every house has zero actions. Players with zero are skipped. Invalid commands change nothing. See action reference below.
5. **Delivery & Enforcement.** Awarded tenders with deadline≤round fail if not transported. Lose escrow, charge penalty3 by signed liability and release reservations. For each investigation>0, roll d6. Roll≤investigation confiscates one free cargo in medical/communications/vehicles order and charges2; if no free cargo, only fine. It never confiscates pledged supplies. Insolvency uses the upkeep shortfall rule.
6. **Scoring & Refresh.** At round8, fail any remaining awarded contracts and score. Otherwise increment round, rotate first, restore3 actions, replenish each commodity by house count (stock cap12); stock≥8 lowers price1 (min1). Clear sanctions on countries with stability>1. Remove old/settled tenders and add house count+2 new public tenders.

## Action reference

All cost1 action unless specified; targets and legality are checked by strict Zod command schemas. All effects are public after resolution except sealed offer values/draft contents.

- **Acquire:** pay current price, take1 stock token. Require stock>0 and free storage. Increase price1 (max8).
- **Sell:** return1 unreserved cargo; gain max(0,price−1); stock+1 up to12; price−1 min1. A buy/sell or sell/buy cycle cannot generate money; each uses2 actions.
- **Bid:** Negotiation only. Pay1 escrow; commit required cargo/logistics, relationship and investigation legality. No browser-submitted state can override the authoritative rules.
- **Influence:** pay2, relationship+1 (max3), country stability+1 (max6).
- **Network:** pay2, gain1 logistics or contact (max3). Extra logistics creates recurring upkeep. Contacts do not yet modify other actions in this edition.
- **Transport:** target an awarded contract you participate in. Country sanctions must be false. Consume every pledged cargo token, settle requested payout by revenue shares, refund proposer escrow1, each participant with revenue>0 gains printed prestige; every participant counts a delivered contract and consortium delivery if applicable. Gray tender adds its printed investigation risk to every participant. Logistics releases for future rounds; it is not consumed.
- **Defend/Audit:** require investigation>0; pay1 and lower investigation2, minimum0.
- **Unrest/Political pressure:** pay3; investigation+2 capped6; reputation−1 minimum0. Stability−2, demand+1. At stability≤1 sanctions block all deliveries to the country. At stability0, replace fictional leader, reset stability3, retain sanctions until next refresh and reduce every house's relationship there1. The engine currently changes demand for future generated tenders; it does not instantly open extra tenders. No operational real-world action is described.
- **Form Consortium:** free draft in Negotiation,2–5 unique named participants. Revenue and liability shares each total100; quantities sum exactly required cargo; pledged logistics cover required logistics. Proposer signs upon proposal; others explicitly Accept. Drafts reserve nothing and any participant may Withdraw. Final signature revalidates every pledge, charges proposer1 action/1 escrow and reserves all resources. Failure leaves draft unchanged. Maximum10 active drafts. Unaccepted drafts withdraw when Negotiation closes. Signed deals cannot withdraw or privately betray the enforced resource/payment settlement.
- **Refinance:** borrow3 if debt≤6, or pay3 to repay3 if debt≥3. Debt cap9. No fractional borrowing.
- **Pass:** spend1 action without other effect.

## Agreements and edge cases

Integer allocations floor each share, then award leftover units by descending fractional remainder, ties by participant order. Signed bid losing the auction releases everything and refunds escrow; signed proposal record remains as history. Pledges prevent double-spending. Delivery is all-or-nothing in this edition; no partial delivery. Sanctions can delay transport until deadline, at the risk of shared failure. Unpaid liability becomes bounded debt/prestige loss. Offline players keep their seat and reservations; reconnect restores control. A host-disconnect/timeout/takeover policy remains an online release gate; there is no silent reassignment.

No interrupts or reaction cards are implemented: each accepted command resolves atomically. There is no ambiguous priority stack. A future interrupt deck must add explicit windows before content is enabled. Private tenders, negotiated unsealed offers, betrayal/partial delivery variants and sanctions modifiers are not supported in this edition. No player gets exclusive country access from a relationship or consortium.

## Scoring and ties

Floor((cash + remaining cargo token count − debt)/2), plus delivered prestige, plus1 per country with relationship≥2, plus secret objective, minus2 per investigation. Prestige1–2 per current tender. Objectives: legitimate delivers≥3 and ends investigation0:+4; diplomat has≥3 countries at relationship≥2:+5; consortium participates in≥2 shared deliveries:+5. Reputation currently affects record only, not score/eligibility (release balancing gate). Cargo salvage value1 per token; logistics/contact salvage0. Ties: higher prestige, lower investigation, higher cash, then lexicographic seat ID. The final seating tie is deterministic but has a seat bias and needs design review.

## Saves, replay and digital-only conveniences

Local IndexedDB stores a version1 state. Import validates size≤5MB, command count≤2000, strict commands, invariants and equality with deterministic replay. No older schema exists to migrate; unknown versions are rejected, not guessed. Undo is a local convenience for public reversible actions before another house acts or hidden information is revealed. Online undo is disabled. Animations, zoom/dialogs, rule lookup, action log and save/replay are optional digital conveniences; they do not change scoring or physical information availability.
