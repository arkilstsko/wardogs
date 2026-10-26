# Dogs of War — system coverage and source-verified freight

26 October 2026. This expands the existing editable Figma file; it does not change the game implementation or approve new rules.

[Open systems page](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=64-2). [Open 36-area coverage inventory](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=72-411).

## Delivered designs

- Four freight states at 1920×1080 and 1440×900: ready, blocked by sanctions, delivered, and failed deadline. Actual Italy vector geography, cargo commitments, logistics, payment, escrow, deadline, available actions and settlement details.
- Eight round-reference component variants, including a distinct final-round reminder. They are phase aids, not a random deck.
- Six editable world-event fronts using the six actual source effects. They may recur; no finite deck exhaustion rule is implied. Existing World Event back master remains 6:286.
- Standard game front/back components, scenario selection in both viewports, and a visible content gate for additional scenarios. No scenario-specific start positions, goals or effects were invented as approved rules.
- Round overview and public house ledger for five players in both viewports. Cargo totals are public; opponent cargo composition and secret objectives are not exposed.
- Event receipt for Quiet Diplomacy in both viewports, with Denmark stability 3 → 5, setup-order tie resolution and the next-phase explanation.
- Thirty-six-area coverage inventory with rule source, visual nodes and remaining work. JSON counterpart is supplied.

There are 16 new components, 73 instances and 14 new viewport frames on page 08. Totals across authored pages: 144 components, 440 instances, 19 variables and 13 text styles; 74 viewport frames including the existing main tables, supporting states and action ledgers. These counts describe artifacts, not functional completeness.

## Authoritative source and deterministic evidence

PR #2 at commit `520a03ada667e93d9ead585e719a001f48a99449`; core files `packages/game-core/src/index.ts`, `content.ts`, `docs/game-design/GDD-v1.md`, `rulebook.md`, and `action-economy.json`.

`ENGINE-REFERENCE-FIXTURE.json` contains complete engine states and their real command histories, generated with seed 20261031, five players, bots disabled and human firm 0. Tender `r1-t0`: Italy, one medical cargo, one logistics, ceiling 7 M, deadline round 2, legal, risk 0, penalty 3 M, prestige 1. Meridian offers 6 M.

| State | Round / phase | Cash | Actions | Medical / held | Logistics / held | Investigation | IT stability / sanctions |
|---|---|---:|---:|---|---|---:|---|
| Negotiation | 1 / negotiation | 12 | 3 | 2 / 0 | 2 / 0 | 0 | 3 / no |
| Ready | 1 / actions | 11 | 2 | 2 / 1 | 2 / 1 | 0 | 3 / no |
| Blocked | 1 / actions | 8 | 1 | 2 / 1 | 2 / 1 | 2 | 1 / yes |
| Delivered | 1 / actions | 18 | 1 | 1 / 0 | 2 / 0 | 0 | 3 / no |
| Failed | 2 / scoring | 5 | 0 | 1 / 0 | 2 / 0 | 2 | 2 / yes |

Delivered and blocked are alternative continuations of ready; failed continues the blocked branch. The failed balance includes intervening income, upkeep and enforcement, not just the 3 M contract penalty. The full command log explains it.

All five states passed `assertInvariants` and exact canonical replay:

```js
for (const state of Object.values(fixture.states)) {
  assertInvariants(state);
  assert.equal(canonical(state), canonical(replay(state.seed, 5, state.commands, false, 0)));
}
```

A transport attempt in the blocked state was rejected and left canonical state unchanged. This verification used read-only copies of the exact engine source with zod 4.1.12. The local Node 24 loader needed an explicit .ts extension for the copied content import; no repository game source was modified. This is bounded fixture validation, not a complete gameplay or balance test suite.

The main table now uses the negotiation fixture for its own cash/actions, medical cargo and Italy tender. The new ledger uses the ready fixture. These are named moments, not a claim that every older static screen was converted to this seed.

## Rules boundaries that affect graphics

1. Shipping is an action in phase `actions`. The engine phase ID `delivery` later resolves deadlines and investigation. Its visual label is now **Frister & kontrol**. Preserve the engine ID.
2. Logistics is reserved capacity. No approved routes, travel time, ports, distances, shipping tariffs, customs, insurance, loss-in-transit tables or ship classes exist in this source. Do not illustrate invented routes as mechanically meaningful.
3. Events are selected with replacement from six effects. Do not show an exhausted event deck or discard count implying uniqueness.
4. The source has one eight-round standard game. Further scenarios need authored setup, active rules/cards, player count, duration, end condition and victory conditions. The scenario gate records missing content; it does not ship a playable new campaign.
5. Draft agreements reserve nothing. Final signature validates and charges according to the engine. Each revenue and liability column totals 100 separately.
6. The source's 189 proposed metadata entries are not 189 finished, balanced cards. Organization abilities, broader weapon categories, black-market expansion and extra scenarios remain unresolved.

## Coverage by area

| Area | Status | Nodes / remaining work |
|---|---|---|
| Opsætning · 2–5 huse | Regler + design | 11:316, 18:158, 66:312 — 2–5 huse, valg af firma, seed og startbonusser. Online drift er særskilt. |
| Scenarier | Afventer regler | 68:128, 68:226, 66:302, 66:312 — Ét grundspil med otte runder. Ingen godkendte særscenarier, kampagner eller scenariemål. |
| Runder & faser | Regler + design | 67:42, 68:57, 68:155 — Otte rundereferencer. Seks faser; levering er en handling, fase 05 afvikler frister og kontrol. |
| Verdensbegivenheder | Regler + design | 67:41, 69:81, 69:125 — Seks kildeeffekter; de kan gentages. En rundereference er ikke en udtømmelig trækbunke. |
| Offentlig & privat viden | Design; drift mangler | 68:57, 68:155, 11:413, 18:255 — Offentligt regnskab; lastens sammensætning og hemmeligt mål forbliver private. |
| Kort & landegrænser | Licensafklaring | 1:2, 8:2, 8:512 — 200 eksisterende landevektorer bevaret. 15 aktive lande. Grænsepolitik og kortlicens kræver afklaring. |
| Politikere & organisationer | Redaktionel QA | 20:2, 6:75, 6:110 — 15 fiktive portrætnavne. Organisationers udvidede roller er ikke godkendte mekanikker. |
| Fem handelshuse | Design; navne QA | 7:59, 13:2, 13:41, 13:80, 13:119, 13:158 — Fem spillerplader og kildebonusser. Firmanavne er bevaret; endelig navneredaktion mangler. |
| Indkomst, gæld & vedligehold | Regler + design | 81:37, 81:105, 81:173 — Lån, afdrag, gældsloft, normal vedligehold og tvungent tab er vist med kildeberegnede kvitteringer. |
| Varer & udstyr | Regler + design | 6:147, 27:185, 11:366 — Medicinsk, kommunikation og køretøjer er aktive. Flere våbenkategorier er kun uafklaret metadata. |
| Marked & lager | Regler + design | 81:207, 81:241, 11:366, 18:208 — Medicinsk køb/salg viser pris- og lagerændringer, fri/bundet last og kapacitetsgrænser. |
| Gråhandel & sort marked | Afventer udvidelse | 6:260, 27:185 — Kontrakter kan være legal/gray. Et separat sort marked med egne regler er ikke defineret. |
| Udbud & kontrakter | Regler + design | 8:2, 8:512, 6:260 — N+2 udbud, last, logistik, loft, frist, risiko og bod. Hovedbordets Italien-udbud er kildebaseret. |
| Bud, deponering & lighed | Delvist design | 11:392, 18:234, 67:1406 — Laveste betaling vinder; 1 handling + 1 M i deponering. Lighed og tabende bud skal forklares særskilt. |
| Konsortier · 2–5 deltagere | Design; drift mangler | 11:2, 11:52, 11:102, 19:268, 19:336 — Indtægts- og ansvarsandele skal hver summe til 100. Kladder binder ikke ressourcer. |
| Last & reserveret logistik | Regler + design | 67:1367, 67:1406, 11:560 — Fri og bundet last vises særskilt. Sidste underskrift genvaliderer ressourcer og handling. |
| Fragt & levering | Regler + design | 67:1367, 67:1406, 67:1523, 67:1562 — Én samlet transporthandling bruger last, frigiver logistik og afregner kontrakt + deponering. |
| Ruter, havne & rejsetid | Afventer regler | 65:2 — Ingen godkendte distancer, rejserunder, fragtrater, told, forsikring eller skibstyper. |
| Sanktioner & blokering | Regler + design | 67:1445, 67:1484, 25:266, 25:287 — Sanktioner blokerer transport. Stabilitet alene fjerner ikke flaget før kildeopdateringen. |
| Frister & misligholdelse | Regler + design | 67:1601, 67:1640, 66:290 — Fristfase, tabt deponering, bod, frigivelse og omdømme. Sidste runde afslutter åbne tildelinger. |
| Relationer & indflydelse | Regler + design | 81:275, 81:309, 81:343, 81:377 — Relation og stabilitet vises før/efter. Kontakter og logistik har separate kildealternativer og loft 3. |
| Oprør & lederskifte | Delvist design | 81:685, 81:719, 25:266 — Pris, ustabilitet, efterspørgsel, efterforskning og sanktioner er vist; lederskifte forklares. Egen successionskvittering mangler. |
| Efterforskning & kontrol | Regler + design | 81:411, 81:445, 81:479, 81:513 — Revision og faktisk D6-kontrol med konfiskation, bøde, frist og frigivelse af reservationer er vist. |
| Handlingspulje & tur | Regler + design | 68:57, 68:155, 13:197 — Tre fælles handlinger pr. runde; bud og transport bruger samme pulje. Pas og turmarkør. |
| Hemmelige mål | Regler + design | 83:131, 81:547, 81:581, 81:821 — Tre faktiske målkort, privat fremskridt og afslørede mål i slutregnskabet. Andre metadata er ikke godkendte mål. |
| Slutspil & point | Regler + design | 81:753, 81:821, 66:290 — Fuldt kildeberegnet slutregnskab for fem huse, alle pointled, mål, ressourcer og kildens rækkefølge ved lighed. |
| Hændelseslog & replay | Delvist design | 81:615, 81:650 — Offentlig afviklet tidslinje og kvitteringer findes. Komplet filtrering, afspilningskontrol og hele loggen mangler. |
| Gem, indlæs & fejl | Delvist design | 11:533, 11:560, 11:579 — Gem/venter/fejl findes visuelt. Indlæsning, ugyldig fil, version og gendannelse mangler fuld QA. |
| Online bord & afbrudt forbindelse | Afventer driftsdesign | 11:316, 18:158 — Udviklingsserver med tre pladser er ikke dokumentation for færdig 2–5 spillerdrift. |
| Bots & lokal turtagning | Afventer spiltest | 11:413, 18:255 — Lokal hotseat og bots findes i kilden. Sværhedsgrad og fairness er ikke kvalitetssikret her. |
| 12 kortfamilier & indhold | Delvist færdigt | 29:517, 69:169, 83:132 — 12 redigerbare familier plus seks begivenheder, otte rundereferencer og tre faktiske mål. 189 metadata er ikke en færdig kortstak. |
| Brikker, terninger & bunker | Design; produktion QA | 13:197, 13:388 — Penge, handlinger, indflydelse og status; bunker skal afspejle de faktiske regler. |
| Bog, æske & fysisk kvalitet | Afventer trykprøve | 35:185, 35:202, 35:221, 35:236, 35:244 — Bogtekst og æskeflader findes. Stans, bleed, farveprøve, kortkarton og tolerancer er ikke verificeret. |
| Ikoner & materialer | Design + kilde | 57:17, 7:38 — 22 Phosphor-vektorer med MIT-licens. Specialbrikker og papir/filt følger fælles bibliotek. |
| Læsbarhed & tilgængelighed | Delvis QA | 8:2, 8:512, 67:1406 — 1920×1080 og 1440×900, kontraster og layout kontrolleres. Tastatur og skærmlæser kræver runtime. |
| Navne, illustrationer & udgivelse | Afventer redaktion | 44:310, 57:2, 20:2 — Portrætvariation, firmanavne, titelkontrol, indholdsredaktion og geografiske rettigheder er åbne gates. |

## Verification and prototype limits

Measured auto-layout overflow: zero on page 08 and both changed main tables, at 1 px tolerance. Text against its nearest opaque solid ancestor: zero failing pairs after correcting event banner and green-on-paper headings; threshold 4.5 for normal text and 3 for large text. This does not prove contrast over all image overlays, every absolute overlap or runtime accessibility. Source map geometry was not modified.

Eight additional selected navigation links are stored: round overview → freight, ready freight → delivered, round overview → event receipt, receipt → round overview, at both sizes. Hover reactions are preserved. Scenario-to-setup and remaining contract/back buttons are not wired; cross-page prototype navigation is not represented as complete. The prototype is not a working multiplayer game.

Screenshots in the accompanying local systems package document the changed main boards, ready/blocked freight, round overview, scenario selection, event receipt, round/event cards and coverage inventory. Other new states received structural validation; no claim of final individual pixel inspection of every frame.

## Reference use

- [John Company 2nd Edition — publisher resources and rulebook](https://wehrlegig.com/pages/resources): 48-page publisher-linked rulebook. Setup/scenario distinction and Manager of Shipping allocation reviewed. No rules or artwork imported.
- [Pax Pamir — Board Game Arena game panel and rule summary](https://en.boardgamearena.com/gamepanel?game=paxpamir): Turn/action/cleanup and event timing used as organizational reference only. Dogs of War keeps its own phases.
- [Brass Birmingham — publisher product reference](https://roxley.com/products/brass-birmingham): Economic table hierarchy and component legibility. Not a claim of a complete rulebook audit this turn.
- [BoardGameGeek — John Company official errata thread](https://boardgamegeek.com/thread/2936700/official-errata): Access blocked (403); not used as rules evidence.

Use references for hierarchy, phase aids, material legibility and complete scenario specifications. Do not transfer their rules, illustration styles, protected layouts or production dimensions as Dogs of War requirements.

## Next implementation order

1. Keep existing engine command validation and privacy projections authoritative. Load existing tokens, fonts, vectors and licensed icon sprite.
2. Bind table, public ledger and private player mat to the same state snapshot; expose resources without leaking opponent cargo or objectives.
3. Bind the existing bid/consortium screens, reserved/free resources and conflict errors.
4. Implement the four freight receipts from command results; render rejected commands without spending or releasing anything.
5. Add phase history, event resolution, deadline outcomes and full source-scored results.
6. Integrate standard setup, saves, loading/error recovery and online presence. Keep unapproved scenario expansions gated.
7. Verify 2 and 5 players, long labels, sanctions, insufficient resources, tied bids, final-signature conflicts, failed deadlines, investigation, round 8, privacy, reconnect, keyboard and responsive behavior.

The remaining portrait/house identity, full card authoring, print proof, rights and accessibility gates in VISUAL-REVIEW.md still apply. This addition makes omissions explicit; it does not sign off a completed commercial board game.


## Completed source-action ledger addition

Page 09 (81:2) adds 24 viewport frames: finance choice, loan receipt, repayment receipt, medical buy/sell sequence, influence, contacts/logistics alternatives, audit receipt, deadline/enforcement settlement, private objective progress, public history, political-pressure consequences and full final scoring. Each exists at both reference sizes. Three source objective fronts are 83:92 / 83:105 / 83:118, set 83:131, proof 83:132; pair with the existing back 6:399.

The additional 10 complete states in EXTENDED-ENGINE-REFERENCE.json all passed invariants and exact replay. They are branches from the original freight example, including a fully completed eight-round pass continuation. Its five-house final ledger is 81:753 / 81:821: Vesper 19; Northstar, Atlas and Redwood 18; Meridian 17. Every score term and revealed objective is shown. This is a reproducible mechanical example, not evidence of strategy balance.

Page 09 adds three components and 55 instances. Current totals are 144 components, 440 instances and 74 viewport frames, with the existing 19 variables and 13 styles. Two further loan-navigation links bring selected navigation examples to 22. Full prototype/runtime behavior is still not verified. Auto-layout and nearest-solid-background contrast checks on page 09 passed after fixing table height. Paper material uses frame background fills so it cannot obscure status text.

Financing, market, influence/network, audit/control, source objectives and a populated final ledger now have concrete source-aligned designs. Full filtered history/replay controls, explicit succession receipt, all save/recovery/online states, remaining card authoring, brand/art direction and production proof still require work. Other viewport frames were structurally checked; this does not claim every frame received final individual pixel review.
