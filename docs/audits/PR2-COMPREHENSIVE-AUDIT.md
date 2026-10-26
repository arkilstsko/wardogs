# PR #2 comprehensive audit — CHANGES REQUIRED

Audit date: 2026-10-26 UTC. Baseline PR head: `520a03ada667e93d9ead585e719a001f48a99449`; local checkpoint: `05c43a218ac7f9d87fb8ba6c12041f60875c7a45`. Both contain tree `c86cfe5ee171ca97d0c0c40c6e18204a482c2185`. No redesign or rule change preceded this baseline.

The complete original and supplemental remediation directives are acceptance inputs. Commercial readiness is rejected. Passing engine tests are useful evidence of implemented behaviors, not gameplay/visual/human approval. Existing engine authority, reservations, strict schemas, integer economy, golden replay tests, local saves, font licenses and original geographic vectors should be retained.

## Scope, methods and evidence limits

All application/server/UI/core/bot/shared source, assets, generators, CI/config, tests and game-design/research/production/playtest documents were inspected. All11 Figma pages were read structurally in the current run. Browser observations are fresh project-Chromium QA captures, not cached prior screenshots or an authenticated user-browser recording. The Browser app control tool is not exposed in this session; project Playwright is the reproducible capture/test surface. No screen-reader, Firefox/Edge/Safari or physical/human playtest result is inferred.

Reproduced baseline: typecheck PASS; lint PASS;64 unit/property/authorization tests PASS;2 legacy browser tests PASS. Fresh15-step local audit reports0 page errors. Additional adversarial engine fixtures and online browser checks are separate evidence and expose failures that those passing suites miss. Postgres recovery has not been reproduced against a real database.

Priorities: **P0** immediate information-integrity/security blocker; **P1** core game/product or major user-flow blocker; **P2** required quality/production correction; **P3** polish. Counts: P0 1, P1 35, P2 18, P3 0. These54 feature-area records aggregate the13 detailed asset findings in [asset/content inventory](PR2-ASSET-CONTENT-INVENTORY.md), including all15 family mappings; they do not count one defect several times merely because it affects multiple screens.

## Fresh user-flow evidence

| Step | Observed flow | Health | Screenshot |
|---|---|---|---|
| 1 | Title and available play entry points. | Partial: clear entry, product fantasy/content incomplete | [01-title-1440](evidence/01-title-1440.png) |
| 2 | Company roster, scenario count, mode and seed. | Partial: seed/power explanation gaps | [02-setup-1440](evidence/02-setup-1440.png) |
| 3 | Viewport-only table; measure whether hand and action controls fit900px. | Fail: microtype, dominant map/dashboard arrangement | [03-table-1440](evidence/03-table-1440.png) |
| 4 | Fictional leader baseline traits and political controls. | Fail: shared cosmetic leader traits | [04-country](evidence/04-country.png) |
| 5 | All leader gallery art uses one silhouette. | Fail: repeated placeholder portraits | [05-leaders](evidence/05-leaders.png) |
| 6 | Clicking a supply card opens market rather than enlarged physical card. | Fail: card inspection opens market | [06-hand-inspection](evidence/06-hand-inspection.png) |
| 7 | Tender identities and information hierarchy. | Partial: readable enlarged offers but identical card treatment | [07-contract-market](evidence/07-contract-market.png) |
| 8 | Cost, deadline, risk and offer controls. | Partial: commitment visible, missing negotiated regimes | [08-contract-dossier](evidence/08-contract-dossier.png) |
| 9 | UI constrains joint proposal to two players and50/50. | Fail: hardcoded2-party50/50 terms | [09-consortium](evidence/09-consortium.png) |
| 10 | Core labels Danish but narrative/actions still English. | Fail: mixed Danish/English | [10-danish](evidence/10-danish.png) |
| 11 | Target1080px viewport and essential-control bounds. | Fail: hand begins1094px below1080px viewport | [11-table-1920](evidence/11-table-1920.png) |
| 12 | No negotiation area, hidden offers in dialogs. | Fail: negotiation area absent | [12-negotiation](evidence/12-negotiation.png) |
| 13 | Projected scores reveal deterministic firm objective category. | Partial: current ledger; online hidden-score issue source-confirmed | [13-scores](evidence/13-scores.png) |
| 14 | Privacy curtain displays receiving house. | Working local curtain in sampled path | [14-hotseat-curtain](evidence/14-hotseat-curtain.png) |
| 15 | Opponent seat is accessible by intentional local switch. | Working local reveal; objective is inferable from public firm | [15-hotseat-objective](evidence/15-hotseat-objective.png) |

The screenshot files were opened and inspected before acceptance. At1440×900 the own mat fits (top690,bottom876); at1920×1080 document height1388 and own mat top1094 mean the hand/actions are outside the initial viewport. Essential card/action metadata includes7–10px text. These are measured DOM values, not image-scale estimates.

Figma captures: [world table](evidence/figma-world-board.png), [card variants](evidence/figma-card-variants.png), [consortium specification](evidence/figma-consortium-specification.png). [Complete structural inventory](evidence/figma-baseline.json):11 pages,12 card families/36 card variants plus4 button variants,22 icon components;20 secondary screen frames contain100 text nodes and no card/form control instances. Editable vectors/text are genuine, but specification-only screens do not meet the final-screen requirement.

Research: [11-reference matrix](../research/PR2-REMEDIATION-MATRIX.md), with exact verified vs excerpt/unread/inference labels. Asset/print detail: [inventory and15-family mapping](PR2-ASSET-CONTENT-INVENTORY.md). Engine counterexamples: [raw JSON](evidence/engine-baseline.json). Online counterexamples: [raw JSON](evidence/online-baseline.json) when the browser run completes.

## Findings and acceptance contracts

### A01 — P0 — Private consortium terms

1. **Original intended experience:** Draft offers visible only to named participants.
2. **Current implementation:** viewFor filters agreements only while phase===negotiation.
3. **Actual observable behavior/evidence:** Engine reproduction: outsider sees0 drafts in negotiation and1 complete withdrawn draft after award. Evidence engine-baseline.json.
4. **Missing behavior:** Privacy filtering across all phases and serialized/reconnect views.
5. **Design/gameplay impact:** Discloses private economic terms to a rival without consent.
6. **Recommended correction:** Filter unsigned agreements independently of phase; keep signed public agreements and participant-only draft history.
7. **Files affected:** packages/game-core/src/index.ts; apps/server/tests/authorization.test.ts
8. **Dependencies:** Public/private information contract.
9. **Acceptance tests:** Compare outsider/participant snapshots before signing, after ready/withdrawal, next round, reconnect and finish. No hidden terms in outsider payload.

### A02 — P1 — Consortium contribution and rewards

1. **Original intended experience:** Cooperation exchanges real resources, financing or liability for rewards.
2. **Current implementation:** Any unique participant may pledge0 cargo/0 logistics/0 liability yet receive revenue, full prestige, delivery/objective counters.
3. **Actual observable behavior/evidence:** Reproduction: passive participant spent0 actions/resources/liability and gained2 prestige,1 delivery and1 coalition.
4. **Missing behavior:** Economic contribution eligibility and proportional/shared prestige model.
5. **Design/gameplay impact:** Repeatable free scoring and coalition-objective inflation.
6. **Recommended correction:** Design contribution eligibility; preserve v1 replays; add versioned rules before rejecting old valid agreements.
7. **Files affected:** packages/game-core/src/index.ts; packages/game-core/tests/engine.test.ts
8. **Dependencies:** Versioned rules, meaningful financing/contacts, coalition research.
9. **Acceptance tests:** Adversarial zero-contribution and many-party pledges cannot produce unearned rewards; honest cargo/logistics/liability contributions remain possible.

### A03 — P1 — Online seat identity in the interface

1. **Original intended experience:** Inspect opponents while retaining authenticated seat.
2. **Current implementation:** Online sets solo=false, and opponent click uses hot-seat setSeat/curtain branch.
3. **Actual observable behavior/evidence:** Source and fresh online browser reproduction recorded separately in online-baseline.json.
4. **Missing behavior:** Distinct authenticated seat and inspected-player state.
5. **Design/gameplay impact:** Locks users behind hot-seat curtain and prepares commands for the wrong seat; server still rejects impersonation.
6. **Recommended correction:** Allow seat switching only in local hot-seat; online opponent click opens public dossier.
7. **Files affected:** apps/web/src/main.tsx
8. **Dependencies:** Authoritative socket identity remains unchanged.
9. **Acceptance tests:** Three browser seats inspect every rival; local own hand/seat and command.player stay unchanged, no curtain. Forged server command still rejected.

### A04 — P1 — Live negotiation editing

1. **Original intended experience:** Other players acting must not dismiss your draft editor.
2. **Current implementation:** Every state message calls setModal(null), including unrelated Ready commands.
3. **Actual observable behavior/evidence:** Fresh online reproduction records dialog before/after a rival Ready.
4. **Missing behavior:** Initial-join handling separated from subsequent state updates; stale editor validity feedback.
5. **Design/gameplay impact:** Loses inspection context and interrupts simultaneous negotiation.
6. **Recommended correction:** Close lobby on join only; preserve editors on updates; report changed eligibility without auto-commit.
7. **Files affected:** apps/web/src/main.tsx
8. **Dependencies:** Socket lifecycle; pending command state.
9. **Acceptance tests:** Host opens contract/consortium editor; rival readies/bids; host dialog and entered offer remain intact.

### A05 — P1 — Secret objectives

1. **Original intended experience:** Private asymmetric goals remain uncertain until reveal.
2. **Current implementation:** Objective is fixed by public firm index%3.
3. **Actual observable behavior/evidence:** Engine fixture lists all5 firm→objective pairs; every scenario repeats them.
4. **Missing behavior:** Private seeded objective dealing and balanced objective deck.
5. **Design/gameplay impact:** Secrets can be inferred without cheating; no scenario uncertainty.
6. **Recommended correction:** Add versioned private objective deck and reveal policy; keep old save replay.
7. **Files affected:** packages/game-core/src/index.ts; content.ts; apps/server/src/rooms.ts
8. **Dependencies:** Content schema, server-private RNG, v1 compatibility.
9. **Acceptance tests:** Across seeds each firm receives several compatible objectives; rival views cannot reconstruct them; final reveal and replay deterministic.

### A06 — P1 — Game identity and equipment

1. **Original intended experience:** International arms-trading companies make legal/gray/black procurement decisions without operational instructions.
2. **Current implementation:** Only medical cargo, communications and utility vehicles; no arms-equipment or supplier system.
3. **Actual observable behavior/evidence:** Source content.ts and screenshot06 show generic cargo market only.
4. **Missing behavior:** Abstract equipment classifications, supplier/organization relationships, distinct legal regimes and ethics.
5. **Design/gameplay impact:** Original product concept has been simplified away.
6. **Recommended correction:** Restore fictional abstract equipment procurement as structured cards, no real routes, evasion, specifications or illicit operational advice.
7. **Files affected:** packages/game-core/src/content.ts; index.ts; apps/web/src/main.tsx; assets
8. **Dependencies:** Authored equipment/supplier content, rights-reviewed illustrations, risk rules.
9. **Acceptance tests:** Every required trade regime is playable and has cost/counterplay; content review confirms fictional/abstract boundaries.

### A07 — P1 — Political leader model

1. **Original intended experience:** Multiple country-compatible leaders have policies, traits, advantage, drawback and distinctive behavior.
2. **Current implementation:** Country stores numeric leader; leaderName alternates one initial name and generic synthesized names.
3. **Actual observable behavior/evidence:** Screenshot04 explicitly says shared baseline traits;05 repeats identical silhouette; source has no leader effect resolution.
4. **Missing behavior:** Full structured leader policy, compatibility, multiple identities and tested effects.
5. **Design/gameplay impact:** No meaningful leadership strategy or country-specific succession.
6. **Recommended correction:** Create validated leader cards and policy modifiers; deterministic selection/succession pools, visible upcoming transition risk.
7. **Files affected:** packages/game-core/src/content.ts; index.ts; apps/web/src/main.tsx; Figma03/04/06
8. **Dependencies:** Versioned scenario schema, tender modifiers, original portrait bible.
9. **Acceptance tests:** At least2 compatible unique leaders per country; each changes at least1 legal decision, has countervailing drawback and distinctive trigger; seeded scenario/replay tests.

### A08 — P1 — Scenario variation

1. **Original intended experience:** Reproducible political conditions, leaders, relationships and contract opportunities vary.
2. **Current implementation:** Seed changes tenders/events/first seat; leaders and relationship0 are fixed.
3. **Actual observable behavior/evidence:** Two createGame seeds inspected in source; leader0 and relationship{} assigned unconditionally.
4. **Missing behavior:** Political scenario generator with feasibility bounds and visible setup cards.
5. **Design/gameplay impact:** Random tender order substitutes for meaningful political scenarios.
6. **Recommended correction:** Generate validated compatible politics; enforce attainable opening tenders and distinct strategy opportunities.
7. **Files affected:** packages/game-core/src/index.ts; content.ts
8. **Dependencies:** Leader/equipment definitions and balance study.
9. **Acceptance tests:** Seed variation covers all leader archetypes and political tracks; no impossible starting contracts or forced faction wins in feasibility tests.

### A09 — P1 — Elections and government transitions

1. **Original intended experience:** Anticipatable election/succession events alter relationships, procurement and risk.
2. **Current implementation:** Only stability0 increments leader counter, resets stability3, decays relations1.
3. **Actual observable behavior/evidence:** Source advance/unrest; existing succession unit test passes.
4. **Missing behavior:** Election schedule/cards, transition warning, policy changes and response windows.
5. **Design/gameplay impact:** Leadership change lacks meaningful uncertainty and agency.
6. **Recommended correction:** Explicit versioned transition events with public forecast tokens and mitigation choices.
7. **Files affected:** packages/game-core/src/index.ts; content.ts; bots
8. **Dependencies:** Political event content, priority/window rules.
9. **Acceptance tests:** Elections, crisis succession and voluntary stabilization are legal alternatives; exact trigger order and effects replay identically.

### A10 — P1 — Conflict and unrest

1. **Original intended experience:** Stability, pressure, public order, legitimacy, demand, scrutiny, sanctions exposure and disruption produce shared opportunity/risk.
2. **Current implementation:** Pay3, stability−2, demand+1, investigation+2, reputation−1; no other political tracks.
3. **Actual observable behavior/evidence:** Source and04-country; baseline engine succession test passes.
4. **Missing behavior:** Conflict-pressure/public-order/legitimacy model, counterplay, shared new opportunities and disrupted obligations.
5. **Design/gameplay impact:** Single button mainly inflicts negative ROI; political specialization cannot form.
6. **Recommended correction:** Design a bounded token-track system and abstract event cards; document shared opportunities, externalities and counterplay before implementation.
7. **Files affected:** packages/game-core/src/index.ts; content.ts; docs/game-design
8. **Dependencies:** Full supplemental critical rules received; leader/economic interactions and human tests.
9. **Acceptance tests:** Pressure cannot print money; all players can exploit new opportunities; stabilization/audit/diplomacy change expected consequences; no operational real-world instructions.

### A11 — P1 — Sanctions and delivery disruption

1. **Original intended experience:** Shared visible restrictions with anticipation, relief and contract consequences.
2. **Current implementation:** Boolean sanctions set on unrest; clears at refresh when stability>1.
3. **Actual observable behavior/evidence:** Source transport rejects sanctioned countries; unit test verified.
4. **Missing behavior:** Exposure/forecast, policy/event interactions, sanctioned obligations/options and physical markers.
5. **Design/gameplay impact:** Risk is abrupt and narrow; player cannot assess or negotiate mitigation.
6. **Recommended correction:** Retain rejection boundary, design explicit sanction events and relief/counterplay.
7. **Files affected:** packages/game-core/src/index.ts; main.tsx
8. **Dependencies:** Politics, transport and agreement liability model.
9. **Acceptance tests:** All country participants observe same restriction; forecast/relief/deadline outcomes and invalid delivery are tested.

### A12 — P1 — Procurement and tender variety

1. **Original intended experience:** Public sealed bids, negotiated private offers and black-market opportunities have meaningful eligibility and consequences.
2. **Current implementation:** Procedural public tenders; legal or gray by stability; all relationship requirements0.
3. **Actual observable behavior/evidence:** 07/08 screenshots and refreshTenders source.
4. **Missing behavior:** Private negotiation, black regime, real relationship/reputation/contact eligibility and contract preferences.
5. **Design/gameplay impact:** Influence/reputation do not determine access; market lacks intended strategic depth.
6. **Recommended correction:** Authored template-backed tenders with explicit regimes, leader preferences, commitment and enforcement costs.
7. **Files affected:** packages/game-core/src/index.ts; content.ts; main.tsx
8. **Dependencies:** Political policies, equipment and secret information rules.
9. **Acceptance tests:** Each regime generates reachable offers, differences affect choices and penalties; sanctioned/high-investigation exclusion tested.

### A13 — P2 — Sealed public bidding

1. **Original intended experience:** Private offer commitments, deterministic awards and no double spending.
2. **Current implementation:** Strict command, escrow and full cargo/logistics reservations implemented; lower payout wins.
3. **Actual observable behavior/evidence:** Baseline engine auction/tie/reservation tests pass;08 dossier exposes commitment cost.
4. **Missing behavior:** Pending submission feedback, locked offer representation, meaningful relationship thresholds; submission-order fairness unresolved.
5. **Design/gameplay impact:** Good authority should be retained, but human race/order can decide equal bids.
6. **Recommended correction:** Preserve reserves and settlement; research physical sealed-envelope timing and fair tie policy before rule changes.
7. **Files affected:** packages/game-core/src/index.ts; main.tsx
8. **Dependencies:** Seat/order experiment and human bargaining study.
9. **Acceptance tests:** Double spend and stale retry fail atomically; each tie rule observed; bids never auto-submit on drop.

### A14 — P1 — Consortium negotiation interface

1. **Original intended experience:** 2–5 parties negotiate supplies/logistics, arbitrary revenue/liability percentages and explicit escrow.
2. **Current implementation:** Engine supports2–5, UI hardcodes2 parties,1 cargo each and50/50 shares, only quantity2 tenders.
3. **Actual observable behavior/evidence:** Screenshot09 shows fixed50/50 and single partner dropdown.
4. **Missing behavior:** Contribution board, editable terms, signatures, counteroffers, multi-party and single-cargo/logistics-only deals.
5. **Design/gameplay impact:** Core negotiation pillar becomes one preset form.
6. **Recommended correction:** Build physical pledge slots and agreement sheets from validated drafts; keep all-party explicit consent.
7. **Files affected:** apps/web/src/main.tsx; packages/game-core/src/index.ts; Figma06
8. **Dependencies:** Contribution eligibility and data-driven cards.
9. **Acceptance tests:** Three-party and asymmetric shares can be composed by pointer/click/keyboard; sum100, reserve only on final acceptance, rival access remains open.

### A15 — P1 — Alliance, betrayal and liability

1. **Original intended experience:** Signed obligations and unsigned promises produce distinguishable risks, reputation and counterplay.
2. **Current implementation:** Signed resource transfers are automatic; unsigned promises are not represented; no partial delivery or betrayal command.
3. **Actual observable behavior/evidence:** Engine settlement/withdraw source; signed deals cannot withdraw.
4. **Missing behavior:** Explicit supported betrayal/withdrawal/partial-delivery/renegotiation policy and ethical consequences.
5. **Design/gameplay impact:** Intended social tension is absent, not a completed alliance feature.
6. **Recommended correction:** Specify versioned legally distinct signed terms/unsigned promises; avoid copying Dune binding-deal rules; make consequences visible.
7. **Files affected:** game-core/index.ts; content.ts; docs/game-design/rulebook.md
8. **Dependencies:** Research and human deal tests, reputation system.
9. **Acceptance tests:** Every allowed withdrawal/breach has cost, visibility, response window and settlement; no unilateral theft of committed resources.

### A16 — P1 — Company specialization

1. **Original intended experience:** Five houses offer comparably meaningful strategic tools.
2. **Current implementation:** Starting numeric bonuses only; Northstar reputation and Atlas contacts have no material action use.
3. **Actual observable behavior/evidence:** Source fields/action branches inspected; setup02 lists motto but not bonus explanation.
4. **Missing behavior:** Playable company ability cards, comparable opportunity costs, disclosed setup powers.
5. **Design/gameplay impact:** Nominal asymmetry grants unequal usable value and weak identity.
6. **Recommended correction:** Give each firm a rule-constrained active/passive specialization with testable drawbacks, before retuning numbers.
7. **Files affected:** content.ts; index.ts; bots; main.tsx
8. **Dependencies:** Full economy/contacts/reputation; controlled simulations.
9. **Acceptance tests:** Each house power affects legal choices and counterplay; identical-skill/full-seat-permutation tests separate faction from seat.

### A17 — P1 — Reputation

1. **Original intended experience:** Commercial behavior changes deal eligibility, pricing, trust and final consequence.
2. **Current implementation:** Track starts1/2; loss on risk/failure; no scoring/eligibility benefit.
3. **Actual observable behavior/evidence:** score and validatePledges do not consume reputation; screenshot player dossier shows number.
4. **Missing behavior:** Thresholds, benefits, recovery and meaningful loss.
5. **Design/gameplay impact:** Reputation is mostly cosmetic; ethical consequences do not support viable legitimate strategy.
6. **Recommended correction:** Define bounded public reputation tiers tied to procurement eligibility and contracting terms.
7. **Files affected:** game-core/index.ts; content.ts; bots
8. **Dependencies:** Political/tender preferences and balance.
9. **Acceptance tests:** Losing/gaining reputation changes available decisions; recovery costs an opportunity; legitimate strategy tested against risky policies.

### A18 — P1 — Contacts and organizations

1. **Original intended experience:** Government/commercial contacts create access, bargaining leverage and constrained abilities.
2. **Current implementation:** contacts is a capped number purchasable for2; organization cards are metadata.
3. **Actual observable behavior/evidence:** network increments contacts; no effect elsewhere; CONTACTS deck opens rulebook.
4. **Missing behavior:** Playable contact/organization cards and interaction hooks.
5. **Design/gameplay impact:** Paying for contacts is currently an economically dominated action; apparent deck is not a deck.
6. **Recommended correction:** Author structured contact/organization effects and truthful deck states; integrate into tenders and politics.
7. **Files affected:** content.ts; index.ts; main.tsx; assets
8. **Dependencies:** Leader/faction policies and card resolver registry.
9. **Acceptance tests:** Every contact/organization has effect tests; contact spend/acquire changes an otherwise unavailable legal option.

### A19 — P2 — Market scarcity and arbitrage

1. **Original intended experience:** Finite inventories and bounded prices create trading choices without money loops.
2. **Current implementation:** Three finite commodities, prices1–8, buy+1, sellprice−1; storage and debt limits.
3. **Actual observable behavior/evidence:** Existing buy/sell conservation tests for all goods pass.
4. **Missing behavior:** Supplier inventory, equipment-specific liquidity, broader multi-party/round cycle tests and measured market behavior.
5. **Design/gameplay impact:** Simple loop safety is good; it does not prove economic balance.
6. **Recommended correction:** Preserve integer conservation; extend cycle properties and authored supplier/equipment scarcity.
7. **Files affected:** game-core/index.ts; content.ts; tests
8. **Dependencies:** Equipment model and varied policies.
9. **Acceptance tests:** No repeatable profitable zero-risk cycle across buy/sell/borrow/coalition/refill; finite component bounds hold.

### A20 — P2 — Debt and financing

1. **Original intended experience:** Financing offers meaningful investment/default tradeoffs with physical debt contracts.
2. **Current implementation:** Borrow/repay3, debt cap9, ceil(debt/3) upkeep; shortfall debt then prestige.
3. **Actual observable behavior/evidence:** Baseline debt/income tests pass; UI is Borrow3 quick button.
4. **Missing behavior:** Financing cards, alternative terms, lender identity and explicit insolvency breakdown.
5. **Design/gameplay impact:** Basic financing works but lacks intended negotiation/identity.
6. **Recommended correction:** Retain bounded debt; implement authored financing terms and visible liability ledger.
7. **Files affected:** game-core/index.ts; content.ts; main.tsx
8. **Dependencies:** Card effects and insolvency rules.
9. **Acceptance tests:** Borrow/repay/default all conserve accounting and terminate; finance preview explains current/future upkeep.

### A21 — P2 — Investigation and enforcement

1. **Original intended experience:** Risk/reward creates uncertainty with fair recovery and visible consequences.
2. **Current implementation:** Investigation0–6; d6≤track confiscates free cargo and fines2; audit1 reduces2.
3. **Actual observable behavior/evidence:** Existing enforcement/audit/gray-delivery tests pass; source checks exclusion≥5.
4. **Missing behavior:** Black-market risk, card/event variety, ethical reputation interaction, visible die/payment resolution.
5. **Design/gameplay impact:** Working track is too narrow to validate a complete risk strategy.
6. **Recommended correction:** Keep atomic confiscation/escrow safety; design regime-specific risk and physical investigation cards.
7. **Files affected:** game-core/index.ts; content.ts; main.tsx
8. **Dependencies:** Reputation/markets/political policy.
9. **Acceptance tests:** Reserved goods never confiscated; probability table exact; audit counterplay and risk returns measured.

### A22 — P1 — Bots play the whole game

1. **Original intended experience:** Rule-equivalent personalities negotiate, propose coalitions, use politics and manage risk.
2. **Current implementation:** One heuristic buys/delivers/audits/influences; may accept a draft, never proposes, never chooses unrest/network/borrow.
3. **Actual observable behavior/evidence:** botCommand branches inspected; both historical10k runs explicitly omit coalition proposals/unrest.
4. **Missing behavior:** Distinct policy modules and information-limited inputs plus complete action coverage.
5. **Design/gameplay impact:** Simulation excludes the central negotiation/politics design; cannot support release conclusions.
6. **Recommended correction:** Introduce observable bot views, legal action generation and varied personality objectives; retain engine validation.
7. **Files affected:** packages/bots/src/index.ts; tools/simulate/run.ts
8. **Dependencies:** Complete rules and content, hidden-info schema.
9. **Acceptance tests:** Policy coverage includes proposal/counteroffer/politics/risk; changing rival private state cannot change bot decisions; all bots obey identical rules.

### A23 — P1 — Balance methodology

1. **Original intended experience:** ≥10k controlled games across seats/factions/scenarios/policies, plus separate2p and human validation.
2. **Current implementation:** Only first-house faction rotated, remaining firms ordered; one policy; reports severe skew.
3. **Actual observable behavior/evidence:** Historical JSON inspected; new baseline100-game property test passes only termination.
4. **Missing behavior:** Full permutations, controlled bot skill, multi-strategy returns, uncertainty estimates and human consented games.
5. **Design/gameplay impact:** Cannot distinguish seat bias from faction/policy effects; release balance gate fails.
6. **Recommended correction:** Preserve raw historical evidence; replace screening harness with paired/permuted factorial experiments after rule completeness.
7. **Files affected:** tools/simulate/run.ts; packages/bots; docs/playtests
8. **Dependencies:** Rules version provenance, measurement plan.
9. **Acceptance tests:** ≥10k reproducible complete games; expected-rate deviation gate conditional on skill; independent2p report; no claim of fun from bots.

### A24 — P1 — Table composition and object hierarchy

1. **Original intended experience:** Cards, mats, decks, tokens, negotiation and discards dominate a physical table.
2. **Current implementation:** Three-column CSS layout with opponent list, map and tender sidebar; bottom mat; no discard/token manipulation/negotiation area.
3. **Actual observable behavior/evidence:** 03 at1440 fits but cards/metadata tiny;11 at1920 puts mat top1094 below1080 viewport, document1388px high.
4. **Missing behavior:** Resolution-aware table composition and progressive table zoom/inspect controls.
5. **Design/gameplay impact:** Own hand/actions disappear at a required resolution; huge map space and dashboard forms dominate.
6. **Recommended correction:** Design a board-surface layout with opponent positions, physical contract row, negotiation/escrow zone and always-accessible own mat.
7. **Files affected:** apps/web/src/main.tsx; style.css; Figma04/05/06
8. **Dependencies:** Approved visual target, token/type scales and interaction model.
9. **Acceptance tests:** At1440×900 and1920×1080 own hand/actions/phase accessible without page scroll; no tiny text compensation;200% zoom flow tested.

### A25 — P1 — Typography and token system

1. **Original intended experience:** 14–16px gameplay body,12–14 metadata and shared semantic styling in code/Figma.
2. **Current implementation:** Many6–11px rules/metadata, repeated hardcoded CSS colors; tokens.ts is not imported by stylesheet.
3. **Actual observable behavior/evidence:** Fresh computed-style capture lists10px action counts;7px card labels; Figma only3 text styles/38 variables.
4. **Missing behavior:** Semantic state/elevation/ownership/text/motion tokens and enforced minimum gameplay type.
5. **Design/gameplay impact:** Poor readability and independent drift across implementations.
6. **Recommended correction:** Generate code/Figma token artifacts from one source, type roles and contrast checks; enlarge objects/progressive disclosure.
7. **Files affected:** packages/ui/src/tokens.ts; style.css; main.tsx; Figma01
8. **Dependencies:** Table layout and accessible contrast pairs.
9. **Acceptance tests:** Automated computed-style assertions for essential text≥12px/normal body≥14px; AA pairs and font licenses verified; no color duplication outside primitives.

### A26 — P1 — Card pickup/drop and legal targets

1. **Original intended experience:** Pickup, clear legal-slot highlights, snapback with reason; explicit commitment confirmation.
2. **Current implementation:** dnd-kit drag; every tender highlights whenever over, then mismatch checked only after drop; card click opens market.
3. **Actual observable behavior/evidence:** SupplyCard/TenderCard/dragEnd inspected;06 inspection observed; no existing DnD e2e.
4. **Missing behavior:** Eligibility-aware zones and selected-card click-place parity.
5. **Design/gameplay impact:** Wrong destinations appear legal; clicking and dragging have different workflows.
6. **Recommended correction:** Compute legal targets without committing, share preview path for pointer/click/keyboard; retain explicit submit.
7. **Files affected:** main.tsx; packages/ui; style.css
8. **Dependencies:** Legal action preview API and card instance IDs.
9. **Acceptance tests:** Wrong commodity/phase/resources never green-highlighted; all three inputs reach same preview; drop alone cannot submit a bid.

### A27 — P1 — Physical card inspection, fan, stack and flip

1. **Original intended experience:** Cards can expand, flip, stack, return to hand and be selected from a fan.
2. **Current implementation:** Fixed horizontal row of duplicated cargo category buttons; no card back/state/stack/fan.
3. **Actual observable behavior/evidence:** 06 hand click opens Market rather than card; Figma03 has onlyFront/Back/Print component variants.
4. **Missing behavior:** Card interaction state machine and real per-card instances.
5. **Design/gameplay impact:** Most of the promised tabletop manipulation does not exist.
6. **Recommended correction:** Create data-driven Card/Hand/Stack/Inspector components; persistent face/reservation state; physical-safe enlargement.
7. **Files affected:** packages/ui; main.tsx; style.css; Figma03/07
8. **Dependencies:** Validated content, stable instance IDs, motion and keyboard semantics.
9. **Acceptance tests:** Inspect/flip/fan/stack/return work by pointer/click/keyboard; focus restored; reduced-motion respects identical gameplay state.

### A28 — P2 — Tokens, decks and discards

1. **Original intended experience:** Visible pieces carry money/stability/commitment/event resolution; decks have counts and discards.
2. **Current implementation:** Numeric indicators and action pips;3 decorative deck buttons; CONTACTS links rules.
3. **Actual observable behavior/evidence:** 03/12 screenshots and JSX deck mapping.
4. **Missing behavior:** Token placement/movement and real draw/discard zones.
5. **Design/gameplay impact:** Bookkeeping is invisible and a decorative deck suggests unavailable gameplay.
6. **Recommended correction:** Implement real component inventories and public discard/draw animations tied to events; mark unavailable content honestly until real.
7. **Files affected:** main.tsx; ui; game-core content; Figma02/04
8. **Dependencies:** Physical inventory and authored deck rules.
9. **Acceptance tests:** Draw changes deck/discard counts deterministically; money/escrow tokens reconcile with state; token click/keyboard alternative exists.

### A29 — P2 — Motion and resolution feedback

1. **Original intended experience:** Unified hover/select/move/reveal/event motion, never blocking server transitions.
2. **Current implementation:** CSS hover/transforms and450ms bot timeout; no award/payment/die/succession animations.
3. **Actual observable behavior/evidence:** Source style inspection; reduced-motion checkbox changes CSS classes.
4. **Missing behavior:** Event-based motion queue, explicit defaults/durations and OS preference-aware initial state.
5. **Design/gameplay impact:** State jumps are hard to explain; timeout is not card movement animation.
6. **Recommended correction:** Define motion tokens and nonauthoritative event presentation; preserve immediate engine updates.
7. **Files affected:** style.css; main.tsx; ui; Figma07
8. **Dependencies:** Typed event envelope and reduced-motion tests.
9. **Acceptance tests:** Award/payment/penalty/succession visible; turning motion off changes no commands or outcome; reconnect skips stale animation.

### A30 — P1 — Card catalogue and schema completeness

1. **Original intended experience:** All15 families have validated identity/art/effect/timing/target/eligibility/cost/restriction/resolution/localization/a11y/print fields.
2. **Current implementation:** 189 generated metadata placeholders across12 proposed types; effectKey strings have no resolver map.
3. **Actual observable behavior/evidence:** content.ts and asset inventory inspected; no card catalogue-driven JSX renderer.
4. **Missing behavior:** Authored validated15-family catalogue and exhaustive effect handlers.
5. **Design/gameplay impact:** Metadata is being mistaken for playable content.
6. **Recommended correction:** Preserve12→15 migration map, author cards against shared schemas and explicit effect resolver registry.
7. **Files affected:** content.ts; ui; assets; tools/export-schema.ts; docs/game-design
8. **Dependencies:** Research/physical analogues, versioning and localization.
9. **Acceptance tests:** Every published card resolves and localizes; unknown effects/art/keys fail validation; all old IDs mapped or explicitly retired with migration.

### A31 — P1 — Original artwork and identity

1. **Original intended experience:** Unique professional political portraits, equipment, firms/organizations and locations form one art direction.
2. **Current implementation:** One supply triptych, one repeated silhouette, letter monograms, emoji country flags.
3. **Actual observable behavior/evidence:** 05 gallery and03 table; source icon/asset audit.
4. **Missing behavior:** Art bibles, distinct leader/company/organization imagery, original vector flags and per-family illustration coverage.
5. **Design/gameplay impact:** Visual identity does not meet accepted production standard.
6. **Recommended correction:** Document and implement original art pipelines per family, ownership/provenance and accessible badges; no real-politician likeness.
7. **Files affected:** packages/assets; ui; main.tsx; Figma02/03/05/06
8. **Dependencies:** Art bible, content IDs and owner visual approval.
9. **Acceptance tests:** Every major published card has approved original art or explicitly approved coherent shared system; no unrelated image reuse/emoji/placeholder silhouettes.

### A32 — P1 — Editable Figma production library

1. **Original intended experience:** Reusable components, properties, variants, variable bindings and actual finished screens match browser.
2. **Current implementation:** 11 pages;12×3 card variants;20 text-only screen specification frames,6 two-text state frames.
3. **Actual observable behavior/evidence:** Fresh all-page structural audit andfigma-consortium-specification screenshot; main board is editable vectors/text.
4. **Missing behavior:** 15-family coverage, interaction variants/properties, complete screens/loading/error/empty/responsive variants and code parity.
5. **Design/gameplay impact:** Editable does not mean design complete; current screens cannot guide implementation faithfully.
6. **Recommended correction:** Retain real vectors/tokens; replace spec-only frames with actual compositions after audited behavior/design decisions.
7. **Files affected:** Figma pages00–10; tools/figma-*; packages/ui
8. **Dependencies:** Authored content and selected table visual target.
9. **Acceptance tests:** Visual review of all major screens at2 desktop sizes andstates; structural check no flattened UI; component instances/bindings and code parity.

### A33 — P2 — Title, onboarding and tutorial

1. **Original intended experience:** Explain the arms-trading negotiation fantasy and first meaningful action within10min.
2. **Current implementation:** Title and6 text lessons; separate Setup; no contextual guided first turn.
3. **Actual observable behavior/evidence:** 01/02 captured; tutorial code read; legacy e2e name claims tutorial but does not open it.
4. **Missing behavior:** Interactive tutorial with real cards/tokens, first bid/coalition/risk decision and novice comprehension evidence.
5. **Design/gameplay impact:** Rules are read rather than learned by play; theme is softened to generic cargo.
6. **Recommended correction:** Build a deterministic tutorial scenario using real engine commands and contextual explanations.
7. **Files affected:** main.tsx; ui; docs/game-design; Figma08
8. **Dependencies:** Complete mechanics, novice human participants.
9. **Acceptance tests:** Keyboard-only novice path completes first contract; measured first-turn comprehension≤10min, no fake forced gameplay state.

### A34 — P1 — Setup input and scenario eligibility

1. **Original intended experience:** Invalid seed/roster cannot crash start; bonuses and political scenario visible before commitment.
2. **Current implementation:** Number input constraints but Start calls createGame without guarded validation.
3. **Actual observable behavior/evidence:** Source start handler; no form check/inline errors; roster displays mottos rather than mechanical bonuses.
4. **Missing behavior:** Validated setup form, clear power comparison, leader draft and political scenario preview.
5. **Design/gameplay impact:** Invalid input can throw from event handler; player cannot assess company choice.
6. **Recommended correction:** Validate setup before engine call; present structured scenario/power cards and errors next to inputs.
7. **Files affected:** main.tsx; shared; game-core schemas
8. **Dependencies:** Versioned scenario generator and content.
9. **Acceptance tests:** Negative/fractional/overflow seed and invalid roster rejected inline with no pageerror; displayed bonuses equal actual setup.

### A35 — P1 — Leader draft

1. **Original intended experience:** Choose compatible political setup when scenario supports it.
2. **Current implementation:** No browser leader-draft flow; Figma frame says not implemented.
3. **Actual observable behavior/evidence:** Source screen union title/setup/board and Figma06 leader-draft text audited.
4. **Missing behavior:** Actual draft commands, turn priority, compatible pools and setup consequences.
5. **Design/gameplay impact:** A required screen/mechanic is absent.
6. **Recommended correction:** Implement bounded public draft over authored leaders or explicitly define a scenario without draft; do not label spec as implemented.
7. **Files affected:** game-core; main.tsx; Figma06
8. **Dependencies:** Leader cards/scenario version and setup rules.
9. **Acceptance tests:** Draft never assigns incompatible title/country, consumes choices once, replays and works remotely.

### A36 — P1 — Bilingual completeness

1. **Original intended experience:** Every gameplay card, rule, dialog, validation and accessibility label supports EN/DA.
2. **Current implementation:** Core labels translated; most prose/tender names/rules/errors/logs English literals.
3. **Actual observable behavior/evidence:** 10 screenshot mixes languages; shared i18n and JSX audited.
4. **Missing behavior:** Structured translated content and message-ID event/error system.
5. **Design/gameplay impact:** Danish players cannot play the complete game in chosen language.
6. **Recommended correction:** Move all player-facing strings to validated locale dictionaries and typed content; record logs as localizable events.
7. **Files affected:** packages/shared/src/i18n.ts; content.ts; main.tsx; index.ts
8. **Dependencies:** Typed content/events and text expansion layouts.
9. **Acceptance tests:** Missing keys fail build; full-game EN/DA captures contain no unintended mixed strings; ÆØÅ and long text render at target sizes.

### A37 — P1 — Opponent public information and online scores

1. **Original intended experience:** Inspect public facts without inventing hidden values or changing identity.
2. **Current implementation:** Client casts filtered view to Game, fills hidden inventory with0 and objectives undefined; score() still computes exact rankings.
3. **Actual observable behavior/evidence:** Source online normalization and score dialog; local screenshot13 only proves local projections.
4. **Missing behavior:** Typed public/own/hidden view and unknown-score presentation.
5. **Design/gameplay impact:** Produces false online precision and fragile non-null assumptions.
6. **Recommended correction:** Separate GameView from authoritative Game; display public ledger or ranges until reveal; no fabricated0 cargo.
7. **Files affected:** main.tsx; game-core/viewFor; shared protocol
8. **Dependencies:** Information policy and server schema.
9. **Acceptance tests:** Changing rival hidden inventory cannot change client-visible exact score; final scores equal authoritative revealed state.

### A38 — P2 — Hot-seat privacy and local undo

1. **Original intended experience:** Pass physical control under curtain; undo only before new hidden info/other player commitment.
2. **Current implementation:** Curtain on action handoff; economic undo snapshot; local Auto move shortcut.
3. **Actual observable behavior/evidence:** 14/15 screenshots verify intentional local seat switch; source clears undo on bot actions.
4. **Missing behavior:** Guaranteed sealing/handoff after simultaneous negotiation, explicit debug control boundary and undo tests.
5. **Design/gameplay impact:** Privacy relies on social behavior; Auto move drives all seats and is not human-playtest proof.
6. **Recommended correction:** Keep local mode explicit, test handoffs and remove QA shortcuts from production play surfaces.
7. **Files affected:** main.tsx; e2e tests
8. **Dependencies:** GameView separation and human-test protocol.
9. **Acceptance tests:** No hidden hand flashes before curtain; forbidden undo after award/reveal/deal/remote command; local save persists exact state.

### A39 — P2 — Local save/load and migration

1. **Original intended experience:** Valid saves restore all actual decisions; old rules remain replayable after remediation.
2. **Current implementation:** IndexedDB JSON and canonical command replay v1; unknown version rejected.
3. **Actual observable behavior/evidence:** 64-test run includes full roundtrip/tamper; browser baseline verifies save write only, not load despite test name.
4. **Missing behavior:** Real browser restore/import/export/error/upgrade coverage and versioned engine dispatch.
5. **Design/gameplay impact:** Changing rules in-place would break saved games and historical evidence.
6. **Recommended correction:** Retain v1 interpreter/golden replay; introduce explicit rulesVersion and migrations for expanded rules.
7. **Files affected:** game-core/index.ts; apps/web/src/save.ts; tests/e2e
8. **Dependencies:** Canonical serialization and versioned content IDs.
9. **Acceptance tests:** Golden v1 saves replay byte-identically after remediation; browser roundtrip resumes phase/hand/agreements; corrupted/oversized imports fail safely.

### A40 — P2 — Deterministic engine and action economy

1. **Original intended experience:** Pure strict commands, atomic resolution, seeded randomness and physical action limits.
2. **Current implementation:** Pure execute, schema validation,3 actions shared between bids and actions,6 phases,8 rounds.
3. **Actual observable behavior/evidence:** Fresh64-test run includes2–5p full-game replay, caps, phases, conservation and source immutability.
4. **Missing behavior:** Typed event payloads, richer invariants and versioned expanded effects.
5. **Design/gameplay impact:** Strong validated foundation should be preserved rather than rewritten for visuals.
6. **Recommended correction:** Keep engine authority and golden tests; isolate presentation previews and versioned effect additions.
7. **Files affected:** packages/game-core/src/index.ts; tests
8. **Dependencies:** Content and protocol versioning.
9. **Acceptance tests:** No UI mutation changes authority; rejected commands preserve state; full games terminate across legal command fuzzing and replay.

### A41 — P1 — Online multiplayer and room admission

1. **Original intended experience:** 2–5 remote humans/bots, private invitations/auth, stable seat ownership and authoritative validation.
2. **Current implementation:** All rooms fixed3 human seats; room code claims vacant seat; opaque reconnect tokens.
3. **Actual observable behavior/evidence:** newRoom/joinRoom source;3-seat browser audit; baseline authorization tests pass.
4. **Missing behavior:** 2–5 player setup, real admission/account policy, identity recovery, ownership/host transfer and expiry.
5. **Design/gameplay impact:** Development room is not a complete online product.
6. **Recommended correction:** Preserve server validation/hash/rate/origin boundaries; add production room lifecycle and explicit configured capacity.
7. **Files affected:** apps/server/src; main.tsx; shared
8. **Dependencies:** Credential/hosting decisions and privacy threat model.
9. **Acceptance tests:** 2,3,4,5 clients/bots finish/reconnect; invite-only seats, forged identity/stale revisions fail; tokens never leak.

### A42 — P1 — Disconnection and room recovery

1. **Original intended experience:** Disconnect does not invalidate deals or permanently stall a room; crash recovery preserves signed obligations.
2. **Current implementation:** Seat stays claimed; host-only advance; memory fallback; optional Postgres load/save.
3. **Actual observable behavior/evidence:** Source and documented adapter; no actual DB restart test or host timeout policy.
4. **Missing behavior:** Disconnected state UI, policy-based pause/consented takeover/host succession, crash/restart and persistence-failure tests.
5. **Design/gameplay impact:** One missing host can halt every player; process loss destroys memory games.
6. **Recommended correction:** Specify physical fair timeout rules and transactional persistence/recovery; no silent AI takeover or false success.
7. **Files affected:** apps/server/src/index.ts; rooms.ts; main.tsx
8. **Dependencies:** Approved DB environment, room lifecycle, full-game online tests.
9. **Acceptance tests:** Kill/restart server at commit boundaries; no duplicate charge or lost signed deal; host loss recoverable under documented policy.

### A43 — P1 — Protocol and state typing

1. **Original intended experience:** Client receives only authorized fields in a validated, versioned message schema.
2. **Current implementation:** Server validates input; output any; browser arbitrary JSON cast and seed/rng/commands filled withfake values.
3. **Actual observable behavior/evidence:** Source viewFor/connection handler inspected.
4. **Missing behavior:** Shared GameView/message schemas, public event types, typed command results/pending state.
5. **Design/gameplay impact:** Hides incomplete assumptions and permits UI/private-state bugs.
6. **Recommended correction:** Define distinct authoritative state and seat projection, validate messages on both ends, acknowledged command IDs.
7. **Files affected:** game-core/index.ts; packages/shared; apps/server; apps/web
8. **Dependencies:** Information policy, idempotence/revision contract.
9. **Acceptance tests:** Malformed server view fails safely, private data not part of rival type, UI cannot call core execute on projected state.

### A44 — P2 — Persistence, rate limits and observability

1. **Original intended experience:** Durable per-room state, bounded resource use, useful privacy-safe logs.
2. **Current implementation:** Parameterized Postgres queries,16KiB max,token bucket,origin allowlist,heartbeat,100 loaded rooms,one global queue.
3. **Actual observable behavior/evidence:** Source audited; baseline room unit tests verify key guards.
4. **Missing behavior:** Room eviction/per-IP cap, per-room queues, multi-process locks, structured errors/revision logs and DB integration.
5. **Design/gameplay impact:** Global queue creates cross-room head-of-line blocking; no configured service is production durability.
6. **Recommended correction:** Retain existing guards; add tested room-level serialization and operational limits with no secret logging.
7. **Files affected:** apps/server/src/index.ts; rooms.ts
8. **Dependencies:** Load/security testing and DB setup.
9. **Acceptance tests:** Concurrent rooms stay isolated, overload bounded, SQL persistence failures atomic, logs omit tokens/private cards.

### A45 — P1 — Accessibility and alternative controls

1. **Original intended experience:** All gameplay keyboard/click usable, readable, screen-reader described and non-color-only.
2. **Current implementation:** Keyboard countries and native dialogs; dnd-kit sensors; many small targets/text and icon-only semantics.
3. **Actual observable behavior/evidence:** Fresh country keyboard capture04; no assistive-technology test; computed small metadata.
4. **Missing behavior:** Full keyboard flows, contrast/focus/target audit, AT smoke and accessible board alternative.
5. **Design/gameplay impact:** Passing one country-key test cannot establish WCAG-AA or complete non-drag play.
6. **Recommended correction:** Use semantic piece controls and equivalent card selection/placement; implement readable list inspector/board navigation.
7. **Files affected:** main.tsx; style.css; packages/ui; shared
8. **Dependencies:** Content a11y text, table layout and validated interactions.
9. **Acceptance tests:** Complete bid/coalition/delivery/politics/save online using keyboard and screen reader; AA contrasts and≥24px targets or documented alternatives.

### A46 — P2 — Responsive layout, zoom and browser support

1. **Original intended experience:** Readable1440×900/1920×1080 and laptop zoom with controlled table pan/zoom.
2. **Current implementation:** Media-query cascade; mobile width smoke; no pan/zoom; desktop height overflow.
3. **Actual observable behavior/evidence:** 11 capture: document1388px,mat begins1094px in1080 viewport.
4. **Missing behavior:** Height-aware composition,200% zoom, Firefox/Edge/Safari and pointer/touch parity.
5. **Design/gameplay impact:** Basic width test conceals inaccessible below-fold actions and clipped controls.
6. **Recommended correction:** Test bounding boxes and workflows, not just document width; implement local table pan/zoom and contextual inspector.
7. **Files affected:** style.css; main.tsx; tests/e2e
8. **Dependencies:** Selected table layout, test browser availability.
9. **Acceptance tests:** No essential actions hidden at target sizes/zoom; all supported browsers complete a saved/resumed game.

### A47 — P2 — Performance evidence

1. **Original intended experience:** Measured reducer, interaction responsiveness, save/reload and ordinary60fps on representative hardware.
2. **Current implementation:** Container Node profile plus no FPS/browser trace; max outlier743ms in old report.
3. **Actual observable behavior/evidence:** tools/profile.ts and performance.json inspected; not rerun as a laptop benchmark.
4. **Missing behavior:** Representative hardware/browser traces, render timings, long-task attribution, independent save measurement.
5. **Design/gameplay impact:** Cannot call performance gate passed from p95 reducer alone.
6. **Recommended correction:** Profile actual card/token moves and board interactions; memoize/static-map optimize only from measured hotspots.
7. **Files affected:** main.tsx; packages/ui; tools/profile.ts; e2e
8. **Dependencies:** Representative device access and stable scene workload.
9. **Acceptance tests:** p95 reducer<20ms; common card interaction no attributable>100ms block; save/reload<2s; publish hardware and limitations.

### A48 — P1 — Test coverage and truthfulness

1. **Original intended experience:** Tests assert claimed user workflows and all effects; meaningful fuzz/property coverage.
2. **Current implementation:** 64 tests pass,2 e2e pass; e2e name claims tutorial/invalid-feedback/load yet never performs these. Fuzz mostly arbitrary JSON rejected at schema.
3. **Actual observable behavior/evidence:** Fresh suites reproduced; exact source assertions inspected.
4. **Missing behavior:** Named positive/negative workflow tests, schema-valid stateful fuzz, content effects, multiplayer browser/recovery, varied bot policies.
5. **Design/gameplay impact:** Broad test names overstate coverage; critical bugs survive.
6. **Recommended correction:** Rename baseline tests accurately; add regressions for observed defects and a requirement/test trace matrix.
7. **Files affected:** tests/e2e/table.spec.ts; game-core/tests; server/tests; tools
8. **Dependencies:** Prioritized audit acceptance tests and full content.
9. **Acceptance tests:** Every advertised test behavior actually asserted; mutation/counterexample checks expose missing guards; no swallowed invariant failures.

### A49 — P2 — Repository maintainability and packages

1. **Original intended experience:** Modular typed UI, shared design/content/protocol packages and reproducible builds.
2. **Current implementation:** main.tsx has92 extremely long lines; stylesheet12 huge lines with repeated overrides; package directories have no individual workspace manifests.
3. **Actual observable behavior/evidence:** All source inventory inspected; lint/typecheck pass but no complexity/format boundary.
4. **Missing behavior:** Readable modules, bounded components/hooks, actual package entry points or truthful folder architecture.
5. **Design/gameplay impact:** Changes are hard to review and regressions easy; nominal monorepo obscures dependency boundaries.
6. **Recommended correction:** Format and split incrementally under tests; separate table/session/card/negotiation/politics modules; clarify package graph.
7. **Files affected:** apps/web/src; packages/*; package.json; tsconfig
8. **Dependencies:** Typed GameView/content/UI systems and preserved tests.
9. **Acceptance tests:** No broad Record<string,unknown>/any at UI protocol boundaries; modules independently tested; clean install/build and same game replay.

### A50 — P2 — Security and dependency release gates

1. **Original intended experience:** No client secrets, server authority and auditable vulnerabilities/hardening.
2. **Current implementation:** Zero-known-vulnerability prior audit after Vitest upgrade; threat model documents major open risks.
3. **Actual observable behavior/evidence:** Current64-tests verify forged-seat/stale/retry/token hashes; full penetration test not performed.
4. **Missing behavior:** Fresh audit, CSP/HTTPS/WSS, identity/invites, abuse limits and data retention/security review.
5. **Design/gameplay impact:** Local secure command guards are not production security approval.
6. **Recommended correction:** Preserve guards, update threat model per new feature, test production boundaries before any public deployment.
7. **Files affected:** apps/server; package-lock; CI; threat-model.md
8. **Dependencies:** Approved deployment/account environment.
9. **Acceptance tests:** No critical/high unresolved dependency/authorization/data leak; private data absent from logs/network; no public deploy without approval.

### A51 — P2 — Print and manufacturing

1. **Original intended experience:** Physical card/token/board analogues with dieline-based trim/bleed/safe typography, BOM and real supplier evidence.
2. **Current implementation:** 58 XML-valid SVGs,53 print records/281 requested copies; playtest assets only.
3. **Actual observable behavior/evidence:** Asset audit counts reproduced; no CMYK/300dpi proof or physical round observed.
4. **Missing behavior:** Authored15-family export parity, printer dielines/PDF preflight, physical bookkeeping, actual RFQs/quotes.
5. **Design/gameplay impact:** Digital screenshot quality does not establish physical readiness or cost.
6. **Recommended correction:** Keep useful vectors, validate dimensions/glyphs/bleed; use actual printer specification and consented outreach.
7. **Files affected:** packages/assets/print; tools/export-print.ts; docs/production
8. **Dependencies:** Final rules/content and printer contacts/approval.
9. **Acceptance tests:** Physical full round reconciles with engine; print-proof accepted; quotes500/1000/2000/3000/5000 distinguish actual offers from estimates.

### A52 — P1 — Human playtesting and owner acceptance

1. **Original intended experience:** 30 complete consented games incl separate2p/large/novice, plus owner approval of final experience.
2. **Current implementation:** 0 recorded human games; no visual owner acceptance; simulations only.
3. **Actual observable behavior/evidence:** No human session evidence in docs/playtests; prior status explicitly incomplete.
4. **Missing behavior:** Real player recruitment/consent, full-game records, ambiguity/fun/negotiation/pacing/accessibility feedback and iterations.
5. **Design/gameplay impact:** Commercial readiness cannot be established autonomously by code or bots.
6. **Recommended correction:** Prepare test campaign and build complete enough to test; recruit/contact only through authorized channels; owner reviews final actual game.
7. **Files affected:** docs/playtests; production release ledger
8. **Dependencies:** Real participants/time/consent and final authored experience.
9. **Acceptance tests:** ≥30 full human games with required cohorts; separate2p results; final blind ambiguities0 and explicit owner approval.

### A53 — P2 — Research before redesign

1. **Original intended experience:** Specific sourced findings guide hypotheses while respecting IP.
2. **Current implementation:** Earlier matrix nine games has unavailable rules/review gaps. New PR2 matrix covers11 references with precise excerpt/official-doc evidence.
3. **Actual observable behavior/evidence:** docs/research/PR2-REMEDIATION-MATRIX.md freshly written; no full-reading/app-testing claims.
4. **Missing behavior:** Complete required primary reading where available, installed gameplay observations and hypothesis-specific validation.
5. **Design/gameplay impact:** Unverified analogies cannot justify a final design or copy expressive assets.
6. **Recommended correction:** Use explicit verified/inference/unread labels; close source gaps and record rule/art originality decisions.
7. **Files affected:** docs/research; docs/game-design
8. **Dependencies:** Publisher-authorized sources and playable demonstrations.
9. **Acceptance tests:** Every consequential design choice cites inspected evidence or labels hypothesis; no proprietary prose/art/layout/icon copying.

### A54 — P2 — Release branch, PR and evidence management

1. **Original intended experience:** Work in reviewable branches/PRs; preserve release branch and require concrete gates.
2. **Current implementation:** PR2 draft; local tree equals remote tree;CI configured; main protection unverified; release blockers documentation only.
3. **Actual observable behavior/evidence:** GitHub PR2 head520a03ada667e93d9ead585e719a001f48a99449 matches local tree c86cfe5ee171ca97d0c0c40c6e18204a482c2185.
4. **Missing behavior:** Machine-readable acceptance ledger, verified branch protection/remote CI and release approval enforcement.
5. **Design/gameplay impact:** A green build can be mistaken for release approval.
6. **Recommended correction:** Keep PR draft, use remediation commits with evidence; separate engineering CI from human/visual/manufacturing release gates.
7. **Files affected:** CI; docs/production; GitHub settings
8. **Dependencies:** Authorized account capability; owner approvals.
9. **Acceptance tests:** No merge to release withP0/P1 blockers; remote commit/tree and CI verified; final owner sign-off recorded, no public deployment/spend without approval.

## Remediation order and preservation contract

1. Freeze baseline evidence and retain v1 golden saves/replay semantics. Fix seat-view privacy and online inspection/editor disruption first, with regressions. Do not alter historical game outcomes while calling a fix cosmetic.
2. Establish distinct State/SeatView/content schemas and15-family mapping; separate UI/session/piece rendering and shared tokens.
3. Author a versioned complete political/equipment/contact/reputation/contract/effect model with physical rules and measurable counterplay. Add full bot policies and controlled simulation experiments. Fix zero-contribution scoring in that version, retaining old interpreter for old saves.
4. Use evidence-led tabletop art direction: real piece zones, inspection/fan/flip/stack/token handling, semantic typography/motion, original art bibles; replace spec-only Figma screens and synchronize matching React components. No placeholder presented as finished.
5. Full multiplayer/persistence/accessibility/browser verification; human campaign and owner visual/gameplay review; physical preflight/bookkeeping/RFQs. No public publishing/spending or release merge without authorization.

Status at baseline: **CHANGES REQUIRED**. Findings are OPEN until linked implementation and reproduced acceptance evidence close them. Human fun, clarity, pacing and replayability remain unverified, regardless of any automated result.
