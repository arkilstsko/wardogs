# Dogs of War — visual handoff

Status: substantial editable design delivery, not an approved production release. Updated 26 October 2026.

## Open the actual design

[Existing Figma file](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=31-2).
Original World map and Stitch pages are preserved. New pages 01–09 contain the authored system and its quality/source coverage reviews.

| Area | Figma nodes |
|---|---|
| Main table | 8:2 (1920×1080), 8:512 (1440×900) |
| Twelve illustrated families | 29:517 overview; front/back masters in manifest |
| Country set | 15 components, listed by ISO in manifest |
| Fictional leader set | 15 independently illustrated components, listed in manifest |
| Consortium draft / signatures / sealed | 11:2 → 11:52 → 11:102; compact equivalents in manifest |
| Five-party consortium | 19:268, 19:336 |
| Sanctioned country | 25:287, 25:266 |
| Player mats | 13:2, 13:41, 13:80, 13:119, 13:158 |
| Tokens, dice, deck stacks | 13:197; source components in 5:2 |
| Cover / back / spine | 13:388 / 35:236 / 35:244 |
| Editorial spread / full experimental rule text | 13:398 / 35:185, 35:202, 35:221 |
| Unresolved equipment annex | 27:185 |
| Handoff | 31:2 |

## Source of truth

Content was aligned to [PR #2](https://github.com/arkilstsko/wardogs/pull/2), branch `feat/playable-tabletop`, commit `520a03ada667e93d9ead585e719a001f48a99449`.
This is a draft implementation, not a declaration that its balance or rules are approved.
No game code is changed by this handoff. All changes in this branch relative to PR #2 are under `docs/design/2026-10-26/`.

Keep the engine's IDs, values and validation authoritative. Do not extract numerical game rules from screenshots.
The three implemented goods are medical, communications and vehicles. Phases are world, income, negotiation, actions, delivery and scoring. Fictional leaders are visual identities with no invented personal abilities.
The current main tables use the named negotiation reference fixture; actual values must still come from session state. The new round ledger uses its ready continuation. See SYSTEMS-COVERAGE.md and ENGINE-REFERENCE-FIXTURE.json.

Consortium design represents draft, awaiting signatures and signed states, including two and five parties. Revenue shares and liability shares each total 100%. A draft reserves nothing. Final signature must revalidate and reserve/charge atomically according to the existing engine; a visual signature is not a successful transaction.
Sealed bid, reservation conflict, sanctions and investigation restrictions must keep their existing validation.

## Art direction and reusable system

Deep teal felt, warm parchment, brass edges, engraved symbols and painted cabinet/harbor imagery. Typography: Barlow Condensed Bold for display, Inter for operational labels, Source Serif 4 for editorial card prose. Use the Figma variables/styles and `design-tokens.json`.
144 components, 440 instances, 15 color variables, 4 dimension variables and 13 text styles were counted at verification. 12 families have editable fronts and backs. Text remains real text. Country borders and the symbol set remain vectors. Paintings remain raster image layers.

26 newly generated original illustrations: 15 fictional portraits, ten card scenes and the box cover. This is not artwork copied from the reference games.
The source Stitch art is retained only in the source page and explicitly unresolved equipment annex. Verify its rights before external release.

## Geography

Use the user's source node `1:2`, not the raster world map in Stitch. Its 200 vector shapes and original aspect ratio (approximately 1.8991) were preserved. All 15 playable countries were matched. US label placement was corrected for the geometry's overseas extent; European country access is separated to avoid label collisions.
The separate `user-world-map.svg` in the local asset package exports the original geography. Its provenance/license was not established. It must not be labeled as Natural Earth data.

Natural Earth is an independently researched valid fallback: [admin-0 countries](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/) and [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/). No silent political boundary substitution was made. Approve the boundary policy and map rights before publication.

## States and implementation order

1. Load fonts and tokens. Implement card, action, house, marker and dice primitives using the components, not raster screenshots.
2. Import the geographical SVG with stable country identity. Preserve aspect ratio; keep unsupported territories neutral. Provide accessible named country buttons and keyboard focus.
3. Implement the two main table layouts, player-house summaries and personal mat. Bind goods, money, actions and reservations to existing state.
4. Add country dossier, sanctions, market, card archive and expanded readable card views.
5. Add sealed bidding and consortium states. Connect existing validation and error messages. Do not infer gameplay from Figma prototype links.
6. Add setup, privacy curtain, saving, empty tenders, reservation failure and end-of-game views.
7. Verify keyboard flow, hidden-information privacy, reduced motion, contrast, image delivery and save/load behavior.
8. Run the existing repo tests and compare visual screenshots at both reference viewports. Test 2 and 5 players, full/empty inventories, long localized labels, blocked delivery, failed last signature, and loading/error recovery.

The 74 viewport frames include two main tables, 34 earlier supporting states, 14 systems frames and 24 action-ledger frames. Twenty-two selected navigation links are configured across the original and systems pages. This is not a fully interactive game.
The new final-scoring ledger (81:753 / 81:821) includes all five source-scored players, breakdowns, revealed objectives and tie order. Older scoring frames are legacy references.

## Asset delivery

`dogs-of-war-symbols.svg` is an original reusable 12-symbol sprite retained here as legacy artwork. The active UI/family icon set is now `phosphor-symbols.svg` (22 upstream Phosphor Duotone symbols, MIT; see `LICENSE-Phosphor.txt`). Import active symbols by ID.
`figma-node-manifest.json` gives authoritative Figma node IDs, including portrait art slots.
`asset-provenance.json` records source and export expectations.
The local accompanying asset package contains 26 PNG illustrations, the world SVG, previews and these documents. Binary paintings are embedded in Figma and included in that package; they are not committed into this GitHub branch. Export the original image fills from the listed art nodes, not a screenshot of the whole card.

The PNG illustrations are generative artwork requiring editorial review for likeness, artifacts and narrative consistency. No exclusive copyright or print readiness is asserted.
Use responsive image derivatives for the browser, while retaining the original PNG masters.

## Verification and remaining gates

See `qa.json`. Auto-layout checks found zero primary/cross-axis overflows with 1px tolerance on all new pages. This is a bounded geometry check, not a claim that every absolute-positioned layer or screen-reader behavior passed.
Reference palette contrast was measured; runtime contrast and focus behavior remain implementation checks.
The board, family overview, all 15 portrait crops in a combined overview, consortium and cover were visually reviewed. The three-page English experimental rulebook was compared to the complete source after ignoring Markdown and whitespace; all rule text is preserved. Typography spacing was normalized. Not every supporting screen received individual final pixel inspection.

Not finished / not approved:
- Complete authored card decks for organization, leader abilities, black market and additional weapon categories. Masters exist and unresolved content is labeled, rather than invented as approved gameplay.
- Final commercial rulebook editing/translation, manufacturing die lines, physical token dimensions, final print separations and printer proof. A complete typeset English experimental rulebook, editorial spread, cover, back and spine are present; they are not production print files.
- Every possible game state, full end-game results composition, full prototype interactivity and runtime accessibility.
- Original map/source artwork license and a published disputed-border policy.

These gates prevent calling this an entirely finished commercial game. They do not block review of the delivered editable Figma work.

## Reference research

Principles studied, without reproducing protected boards or artwork:
- [John Company 2nd Edition](https://wehrlegig.com/products/john-company-second-edition): editorial hierarchy and negotiation table.
- [Pax Pamir 2nd Edition](https://wehrlegig.com/products/pax-pamir-second-edition): material restraint and object legibility.
- [Brass Birmingham](https://roxley.com/products/brass-birmingham): dark board and tactile economic pieces.
- [Dune Imperium](https://www.direwolfdigital.com/dune-imperium/): card and action hierarchy.
- [Scythe](https://store.stonemaiergames.com/products/scythe): player-mat compartmentalization.
- [Arcs rules](https://rules.buriedgiant.com/): clear symbolic systems.
- [The Game Crafter templates](https://help.thegamecrafter.com/article/39-templates), [DPI guidance](https://help.thegamecrafter.com/article/33-dpi-dots-per-inch): supplier-specific safe areas and print resolution.

Use a printer's actual templates before describing exports as print ready. The card-master aspect is 63:88; Figma pixels alone do not establish physical bleed or DPI.


## Critical visual review and quality pass

See `VISUAL-REVIEW.md` and Figma review nodes 57:2 / 57:17. The review explicitly does not sign off the complete premium game. The portrait series repeats poses and settings; final art direction, distinctive house identities and a binding every view to one authoritative session state remain open.

The current board has portrait-shaped hand cards, restrained material layers, full European country names and clearer commodity icons. Actions now have Primary/Secondary tones × six states including Pressed and explicit Focus. Body copy on full 315×440 card masters is 16px. Upstream SVG paths and license are supplied. Two additional generated material textures are documented in `asset-provenance.json`; original prompts are in the local review package.

Do not treat static Figma button states or configured prototype reactions as tested runtime behavior. Do not carry the displayed initial reference values directly into an in-progress game. Bind actual engine state and preserve all existing command validation.


## Whole-game systems coverage update

See SYSTEMS-COVERAGE.md / .json and ENGINE-REFERENCE-FIXTURE.json. Page 08 (64:2) adds four source-verified freight states at both sizes, eight round-reference variants, six source event fronts, standard-game front/back, a gated scenario selector, public five-player ledger and event receipts. Coverage frame 72:411 records 36 areas and remaining gaps. Full node IDs are in the systems section of the manifest.

Actual delivery uses an action in phase `actions`; code phase `delivery` is visually labeled Frister & kontrol and handles deadlines/investigation. Event effects may repeat. Further scenarios, routes, journey time, freight tariffs, customs and insurance have no approved rules in PR #2. Do not invent them in implementation.

The five stored states passed engine invariants and exact replay. A sanctioned transport rejection preserved state. New-page auto-layout and nearest-solid-background text contrast checks passed after fixes. This is bounded design verification; full multiplayer, accessibility, all older screen data, complete card decks, house/portrait direction and print production remain open.

Implementation sequence addition: after bidding/consortia, bind reserved/free resources and freight settlement; then round/event history, deadlines and full scoring; then setup/scenario gates, recovery and online/privacy QA. See the systems document for details.


## Source-action ledger completion

Page 09 (81:2) supplies financing, borrowing/repayment, medical trading, influence, upgrades, audit, enforcement, private goal progress, public history, unrest and populated final scoring in both viewports. See systems coverage for node IDs. EXTENDED-ENGINE-REFERENCE.json contains 10 more actual states with command histories; all passed invariants and exact replay. The original five freight states remain separate. Three source-scored objective fronts share the existing Objective back. Total: 144 components, 440 instances, 74 viewport frames.
