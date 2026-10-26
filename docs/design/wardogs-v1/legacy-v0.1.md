# Merchants of War — experimental tabletop build

**Working browser game; not a commercial release candidate. Working title, trademark clearance pending.**

A tactile negotiation game for 2–5 fictional trading houses, using real countries, abstract cargo and fictional leadership. No operational illicit-trade or unrest instructions. Every current core mechanic has a physical token/card/die analogue.

## Run locally

Node 24+, npm 11+. No paid services required.

```sh
npm ci
npm run dev
# second terminal: authoritative online server, optional
npm run server
```

Open http://localhost:5173. Choose Solo or Local hot-seat, a house, 2–5 players and seed. The table is playable through all eight rounds. `Auto move` advances one legal local command for QA/demo. It is disabled online. Use the phase prompt to continue shared phases; submit bids in Negotiation and Transport awarded contracts in Player Actions.

Online: enter any local table → Settings → Online lobby. Use the same 3–32 character room code in three browser tabs/windows. The first connection is host; every connected house commands only its own seat. Reconnect uses an opaque credential in session storage. Default server accepts localhost/127.0.0.1 port5173 origins. This is an undeployed development server. Configure DATABASE_URL for the included PostgreSQL adapter; actual restart recovery is not yet verified.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run e2e
npm run simulate -- 10000
node --import tsx tools/verify-online.ts
```

Playwright uses system Chromium locally, or its installed browser when CI=true. See [release evidence](docs/production/release-checklist.md), [rules](docs/game-design/rulebook.md), [GDD](docs/game-design/GDD-v1.md), [research](docs/research/matrix.md), and [threat model](docs/architecture/threat-model.md).

## Editable design

[Figma source](https://www.figma.com/design/jdcFObTuyqXIPMH2ZDf6z4). Eleven named pages; source-linked variables, 12 card families with front/back/print variants, original vector icons and a semantic desktop table. Secondary screens are editable specifications, not fully polished per-screen responsive/state designs. See `docs/production/figma-ledger.json` for actual returned IDs.

## Important release limitations

- **Balance screening fails.** Both 10,000-game results are retained. Rotating negotiation order improves two-player seat skew but does not resolve faction/seat confounding or dominant-policy concerns. No human playtests have occurred.
- Leader succession works; unique country-compatible personality decks, private tenders, leader draft, all proposed deck effects and art are not fully authored.
- Three-seat online play works locally; room admission needs production accounts/invites, expiry, distributed workers, host-disconnect policy and verified PostgreSQL recovery. No public deployment.
- Danish core labels exist; narrative/validation strings are not completely localized. Some compact card captions remain small. No WCAG-AA or screen-reader certification is claimed.
- Current Figma and print assets are editable playtest materials. Factory quotes, printer dielines, physical setup testing and 300dpi/CMYK preflight remain open.
- This repository is private. Commercial rights, trademark and content review remain release gates. Do not publish source or deploy publicly without approval.

## Structure

`apps/web`: React/Vite tabletop, accessible alternative controls, local IndexedDB saves.
`apps/server`: authoritative WebSocket commands, filtered views, token-based seat identity, rate/origin/payload validation, optional PostgreSQL.
`packages/game-core`: pure seeded engine, strict command schemas, invariants, canonical replay/save verification.
`packages/bots`: rule-constrained heuristic policy, no LLM.
`packages/ui`, `packages/shared`, `packages/assets`: icons, tokens, localization, geography.
`tools`: simulation, online verification, print and Figma source generators.

Source is provided in this private repository for the user's project. Third-party font licenses are retained; Natural Earth is public domain. No open-source license grant is implied for original project content.

## Standalone browser artifact

`node tools/export-standalone.mjs` after `npm run build` writes `/workspace/Merchants-of-War-play.html`: one HTML file with the engine, React, geography, fonts and supply illustrations embedded. The self-contained HTML is served locally for Chromium verification. Direct `file://` launch is blocked by the managed browser policy and is not verified. It needs no public deployment for local/solo play. Browser file-origin save behavior and online connections differ from localhost; use `npm run dev` for full local server behavior.
