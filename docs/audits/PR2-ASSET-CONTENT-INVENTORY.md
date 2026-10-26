# PR2 asset and content inventory

Audit date: 2026-10-26 UTC. Scope: existing local assets, content definitions, icons/tokens, print generator and production evidence. Read-only audit; no existing art or game content was redesigned. The 15 target family names and required record fields below come from the PR2 task. The supplied user text ends mid-section 9; this audit adds no missing-section requirements.

Evidence is source inspection plus bounded file/XML/CSV checks, not a fresh Figma inspection, physical proof or commercial rights clearance. Existing Figma assertions below are attributed to the saved ledger/milestone, not independently reverified.

## What exists

| Area | Factual inventory | Evidence / limit |
| --- | --- | --- |
| Engine content | 15 named countries; 15 initial fictional leaders embedded in country tuples; 5 firms; 3 abstract goods; 6 world-event definitions; 11 action-rule entries | `packages/game-core/src/content.ts`. Country tuples contain name EN/DA, office, leader name and coordinates; they are not authored country/leader card records. |
| Generic catalog | 12 family labels, 189 generated metadata rows: 15 Country, 30 Leader, 36 Supply and 12 for each other family | `CARD_CATALOG`. These are ordinal placeholders with three repeated effect-key strings per family; 189 metadata rows do not establish 189 authored or executable cards. |
| Actual print content | 53 distinct card/template records, requested quantity 281 | `docs/production/card-list.csv`: Country15, Leader15, Organization5, Supply3, Logistics1, Contact1, World Event6, Unrest1, Investigation1, Objective3, Contract1, Alliance/Agreement1. Some rows are writable records or references, not playable drawn cards. |
| Print SVGs | 58 well-formed XML files | `packages/assets/print`: 53 card SVGs, 1 monochrome medical specimen, A2 world board, A4 player mat/reference/ledger. Parsed all 58 on audit date. No production PDF or 300dpi raster export present there. |
| Digital illustration | 1 PNG, 2172×724px, 2,870,788 bytes; three supply motifs in one image | `apps/web/public/art/supply-triptych.png`. CSS crops by background position; this is three category motifs, not unique illustration for every card. See `generated-art.md`. |
| Characters / other families | No separate illustrated leader portraits, organization scenes, supplier scenes, event illustrations, objective illustrations or financing art files located | Leaders use a shared SVG person icon/silhouette. Country map and original icons are legitimate assets but are not substitutes for a requested unique illustration inventory. |
| Geography | 1 simplified local map JSON | `packages/assets/src/map.json`, Natural Earth source recorded in `asset-provenance.md`. No pinned upstream commit/hash in that provenance record. |
| Icons | 29 original paths; 24×24 viewBox, 1.75 rounded stroke | `packages/ui/src/Icon.tsx`. Includes all 19 originally named gameplay concepts plus three good-category and seven utility icons. Unknown names silently fall back to supply. |
| Tokens | 15 color values, 3 radii, 7 spacing values | `packages/ui/src/tokens.ts`. Simple exports; no semantic text-size/state/print token model there. CSS separately contains many hardcoded values. |
| Fonts | Inter variable TTF; Source Serif4 variable TTF; Barlow Condensed Bold TTF; three OFL notices | `apps/web/public/fonts`. Barlow800 asset not present. Variable-face weight ranges are not declared in current CSS `@font-face` rules. |
| Figma evidence | Saved ledger describes 11 pages, 38 variables, original 12 card families with 3 variants | `docs/production/figma-ledger.json`, `milestone.md`, `tools/figma-cards.mjs`. New supply raster was documented as browser-only. All-15 content/state/art parity cannot be inferred from the saved counts. |

## Preserve the old 12; map to the required 15

A migration should retain existing IDs and records through explicit aliases/subtypes. The following is a mapping proposal, not a claim that target content has been authored. It does not silently discard Logistics or signed agreements.

| Required target family | Existing source / legacy mapping | Gap or migration caution |
| --- | --- | --- |
| Country | Country; country tuples and `country-XX` print records | Preserve country codes; author stable card records and effects/eligibility beyond setup tracks. |
| President / Head of Government | Leader; initial leader name in country tuple; `leader-XX-0` | Use office-compatible subtype. Only shared baseline succession exists; unique advantage/drawback/trigger/succession and portraits are missing. |
| Government Contact | Contact; one capacity reference and player `contacts` integer | No distinct executable contact-card abilities or named government contacts. A capacity integer cannot be renamed into a complete deck. |
| Organization | Organization label; currently five fictional **player trading houses** | Preserve firms as faction entities. Nonplayer organization cards need their own authored records; do not conflate house and external-organization roles. |
| Equipment | Supply (three cargo categories); retain Logistics as an equipment-capability attachment/subtype or separately preserved legacy family | Do not delete Logistics. Its reusable reserved-capacity behavior differs from consumable cargo. No expanded unique equipment inventory/art exists. |
| Supplier | No matching authored legacy deck | Acquire/finite market is a mechanism, not named supplier cards with eligibility/effects. New records required. |
| Contract | Contract; procedural tenders and writable print template | Procedural tender IDs exist, but no authored contract-art/translation registry. Preserve dynamic scenario IDs separately from template IDs. |
| World Event | World Event; six effect definitions and six printed lookup cards | Existing effect IDs can seed the canonical registry. Full bilingual effects, art and execution metadata missing. |
| Political Event | No independent legacy family | Some world/unrest effects are political in theme. Splitting or aliasing them requires explicit authored timing/target/effect decisions, not duplicate execution. |
| Unrest / Conflict | Unrest; political-pressure action/reference | Preserve abstract, nonoperational treatment. One action reference is not a distinct conflict deck. |
| Investigation | Investigation; enforcement action/reference | Track/die procedure exists; distinct draw-card effects and illustrations missing. |
| Secret Objective | Objective; three implemented scoring conditions | Alias existing objective IDs and preserve scoring. Only English effect text and three objectives, not twelve authored catalog rows. |
| Company Ability | Firm `bonus` metadata and setup advantages; no legacy card family | Extract/reference actual setup behavior without executing it twice. No ability deck or unique ability art exists. |
| Special Negotiation | Alliance/Agreement; consortium proposal/signature records and writable form | Preserve enforceable agreement data as an explicit subtype. “Special” negotiation abilities/reaction cards are not implemented. |
| Financing / Debt | Refinance action and bounded debt/upkeep tracks; no legacy card family | Existing mechanism is not a card deck. Author lender/loan/effect records and physical representation deliberately. |

## Required record fields versus current evidence

| PR2 field | Present evidence | Missing or unreliable detail |
| --- | --- | --- |
| stable ID | Firms/events have descriptive IDs; countries have codes; procedural tenders have round IDs; print records have semantic IDs | Generic catalog uses `country-1`, `leader-1`, etc.; print uses `country-DK`, `leader-DK-0`. No unified cross-surface ID map. Ordinal localization keys change when family/order changes. |
| type | Original12 strings and separate print type field | No canonical15 enum/migration; capability/reference/writable-template roles are not formal subtypes. |
| name | Country/firm/event names, leader names, print titles | Generic catalog rows have no name. All15 named playable records not authored. |
| art | Single supply triptych; original SVG symbols/map; provenance prose | No per-card `art` record/path/hash/license/crop/alt metadata. Identical generic provenance text cannot identify a particular asset. |
| effect | Six event effect IDs; command reducer; print effect text | Catalog effect-key strings do not resolve to 189 card effects. Content-level effect executor registry absent. |
| timing | Catalog timing string, print prose and action-rule phases | Generic catalog calls all nonworld/nonobjective rows `action`, including setup country/leader and agreement behavior. No formal timing-window model per card. |
| target | Action-rule target prose, command fields | Absent from generic card records; no per-effect target schema. |
| eligibility | Engine guards | Absent from catalog and print CSV as structured conditions. |
| cost | Action-rule prose and engine guards | Absent from generic cards as machine-readable integers/resource costs. |
| restrictions | Action cap prose and reducer checks | Absent from cards as explicit structured restrictions. |
| resolution | Reducer code and print prose | No per-card ordered resolution representation or authoritative links. |
| visualState | Card/template styling and saved Figma variant evidence | No content field defining supported states; no all15 state matrix. |
| localization | Main-label EN/DA dictionary; country EN/DA names; event DA titles; generic localization-key strings | No `cards.i.n` content translation lookup in current dictionary. Most effects, restrictions, print text, error strings and narrative remain English. |
| a11y description | Generic SVG `aria-label` based on title; runtime surrounding controls | No authored per-card description. Icon SVGs are aria-hidden, so explicit readable caller labels remain necessary. |
| physical print representation | Card dimensions, print-friendly flag; actual SVGs and CSV multiplicities | No unified mapping from catalog entry to print asset/quantity. PDF/CMYK/dieline/300dpi proof and completed physical bookkeeping tests remain open. |

## Findings and acceptance tests

Priority meaning: P0 blocks safe ongoing use; P1 blocks the requested PR2 deliverable/release; P2 materially weakens quality/reliability; P3 improves maintainability. No P0 was established by this bounded asset audit; that is not a security or full-game verdict.

| ID / severity | Finding and affected files | Concrete acceptance test |
| --- | --- | --- |
| AC01 / P1 | **Catalog is metadata scaffolding, not the required authored15-family system.** `content.ts`, engine reducer, `tools/export-schema.ts`, print generator, Figma card generator. | Validate every enabled card against one canonical record schema containing all PR2 fields; execute each effect through legal/illegal command cases; reject unresolved effect/localization/art keys. Report authored/disabled counts separately. All15 families must appear with explicit legacy aliases. |
| AC02 / P1 | **Unique illustrations and character art are mostly absent.** `apps/web/public/art`, `packages/assets`, Figma ledger/card generator. One triptych does not cover15 families or unique leaders. | Produce an inventory keyed by stable card ID with asset path, provenance, license/review status, crop, dimensions and alt description; browser/Figma/print links resolve. Check uniqueness intentionally; generic fallback icons cannot count as portraits or unique scenes. |
| AC03 / P1 | **Important text remains below PR2 size thresholds.** `apps/web/src/style.css`: tender metadata10px, action controls10px/amount9px in laptop override, supply kicker7px/line6px, phase/footer/deck metadata7–10px. Later rules override some earlier declarations, so raw CSS counts are not a computed-style audit. | At1920×1080,1366×768 and laptop zoom, inspect computed visible text: main14–16px and metadata12–14px; no important7–10px labels. Verify legible card zoom and no clipped/replaced decision text after size fixes. Include screenshots and text-node bounds. |
| AC04 / P1 | **Bilingual content completeness is not met.** `packages/shared/src/i18n.ts`, `content.ts`, `main.tsx`, generated CSV/SVGs. | Enumerate every enabled card/error/rule/state string; ensure EN/DA keys exist with no English fallback in Danish mode. Render ÆØÅ/æøå and long Danish text in every card/state; prove no clipping. |
| AC05 / P1 | **Physical exports remain construction/playtest materials.** `tools/export-print.ts`, all print SVGs, `manufacturing.md`. Safe/trim outlines are visible; no factory dieline or color-managed production output; no300dpi raster/PDF present. | Separate construction-guide and production layers/export modes; verify63×88mm trim,3mm bleed and5mm safe area against approved printer dielines; image effective resolution≥300dpi where required; PDF/font/CMYK preflight; real100% ruler/cut/duplex proof and physical setup/round test. Actual supplier quotes must be retained as evidence, not inferred. |
| AC06 / P2 | **Five generic-family icon keys silently resolve to supply.** `content.ts` computes `organization`, `contact`, `world event`, `objective`, `alliance`; none exists in `Icon.tsx`. Print generator chooses explicit existing symbols and does not share that failure. | Generate every enabled family's icon; assert exact ID exists; fail unknown identifiers in development/build checks. Cover all15 target families plus preserved Logistics/agreement subtypes without silent supply fallback. |
| AC07 / P2 | **Cross-surface IDs, quantities and content drift.** Generic189 rows versus53 print records/281 objects; Figma uses12 families; engine has procedural content. `content.ts`, CSVs, `export-print.ts`, `figma-cards.mjs`. | Join every enabled card by stable ID across engine, EN/DA, UI, Figma and print manifest; zero orphan/unmapped records; seed/version/hash recorded on generated outputs. Distinguish physical copy quantity from distinct effect count. |
| AC08 / P2 | **All leaders share baseline traits; contacts are inert capacity.** `content.ts`, `leaderName`/reducer, leader/contact SVGs, `GDD-v1.md`. | Authored leaders each have advantage/drawback/trigger/succession plus compatible-country pool and tests; contact eligibility/effect changes a legal state; every print description matches executable behavior. Existing baseline/inert references must remain labeled as such until replaced. |
| AC09 / P2 | **Color tokens are not universally safe as text on parchment.** `tokens.ts`, CSS, print colors. Calculated solid-token contrasts: legal-green/parchment3.79:1, enforcement-red/parchment3.72:1, amber/parchment2.18:1, violet/parchment4.14:1. These are palette-pair calculations, not confirmed rendered failures. Muted/panel6.02:1 and brass/charcoal6.32:1 pass4.5:1. | Test every actual text/background/state pair, including composited opacity and art overlays; normal text≥4.5:1, noncolor status labels/icons retained. Create safe semantic text tokens instead of assuming every palette color can carry text. |
| AC10 / P2 | **Print typography has only character-count wrapping.** `export-print.ts`: body2.4mm≈6.8pt; ID1.7mm≈4.8pt; Arial fallback; no glyph-box checks, embedded fonts or font-aware wrapping. | Render at actual print size, measure text bounding boxes against safe area, validate minimum printer-approved type size and Danish glyphs, embed/license fonts or outline only in approved export copy, and inspect all53 records. XML parsing alone is insufficient. |
| AC11 / P2 | **Provenance is useful but incomplete as a reproducible manifest.** `asset-provenance.md`, `generated-art.md`, local fonts/map/art. No map upstream version/hash or card-art source hashes/crop manifest. | Machine manifest records exact source URL/version, retrieval date, SHA256, license/rights owner/review state and transformation; generated art separately records tool/prompt/reference/right limitations. No clearance inferred from generation. |
| AC12 / P3 | **Token/font declarations drift between TS, CSS and Figma.** `tokens.ts`, CSS, Figma tools/ledger. Barlow800 absent; variable font ranges undeclared; print uses Arial. | Generate or reconcile semantic typography/color/state/spacing tokens; verify rendered family/weight for display700/800, UI400–700 and narrative400/600. Assert Figma and browser declarations agree; document any approved print variant. |
| AC13 / P3 | **Print proof variants/collation are incomplete.** Only medical has a monochrome specimen; contact sheet shows one distinct record rather than281 objects. | All enabled families have intentional print-friendly variants, generated full collation manifest/deck counts, backs/duplex alignment where needed and a printable reference consistent with final rules. |

## Verification performed and limits

Performed: source/file inspection; all58 print SVGs parsed with Python XML parser; CSV distinct/copy/family counts;29 icon keys extracted and compared with12 computed family icon names; PNG dimensions read from its header; exact opaque color-pair contrast calculations; CSS declaration inspection. No existing asset files were changed.

Not performed: Figma canvas/tool mutation or fresh file read; screenshot rendering or computed browser text measurements; card-effect execution tests; legal rights/trademark search; full screen-reader/keyboard or WCAG audit; print raster/PDF generation/preflight; physical cutting/duplex/setup/full game; supplier outreach or quotes. Existing production docs correctly describe many of these as open. No later section9 requirements are inferred.
