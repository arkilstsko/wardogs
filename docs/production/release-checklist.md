# Release gate ledger — NOT RELEASE READY

Date2026-10-25. Counts/results in adjacent machine-readable evidence and final milestone note supersede prose when checks rerun.

| Gate | State | Evidence / what closes it |
|---|---|---|
| Private authorized GitHub target | Verified | arkilstsko/wardogs; existing repo, owner/admin access |
| Tool/account audit | Verified | GitHub and Figma connected; no cloud credentials configured |
| Primary rules + reputable reviews9 games | Partial | docs/research/matrix.md distinguishes accessed and unavailable sources |
| GDD + current rulebook + command schemas | Delivered, provisional | docs/game-design; engine source and generated JSON |
| Full deterministic8-round engine | Tested | unit/property/replay tests; automated UI full-game test |
| All proposed card effects and unique leadership decks | OPEN | metadata/templates do not imply executable authored cards |
| 10k screening games | Completed twice, FAIL balance | initial seat skew89.24% in2p; revised2p59.8%; revised3–5p still severe skew |
| Skill-controlled varied-policy/faction balance | OPEN | current heuristic does not propose coalitions or exercise unrest; partial seat/faction confounding |
| Human playtests | BLOCKED / 0 of30 | Need consented participants and real90–120min sessions; ≥10 two-player, ≥10 four/five-player, ≥5 novice sessions (categories may overlap) |
| Blind rules, fun, clarity, replayability | BLOCKED | actual observed human evidence; do not substitute bots |
| Editable Figma foundations/cards/table | Delivered | actual source file and node ledger; vector/text/instances, not raster |
| All Figma screens/states/responsive parity | OPEN | secondary screen frames are editable specifications, not polished final designs |
| Local/hot-seat/bots/tutorial/saves | Playable, smoke-tested | e2e evidence; exhaustive UX testing still open |
| Danish/English complete localization | OPEN | main labels translated; much prose/error text still English |
| Authoritative online, privacy, reconnect | Local smoke verified when online-results.json reports success | development3-seat rooms; UI integration and protocol tested |
| PostgreSQL restart recovery | BLOCKED | no database credential/service configured; adapter unverified |
| Production identity/admission/disconnect policy | OPEN | threat-model.md |
| Browser matrix Chrome/Firefox/Edge/Safari | OPEN | Chromium automated only; no unsupported browser claims |
| Keyboard/screen-reader/WCAG-AA | Partial | country keyboard/modal smoke; full audit and small-caption fixes required |
| Performance budgets | Partial | CPU reducer/save measurements only; representative laptop/fps/zoom matrix open |
| Security/dependency checks | Partial | audit JSON; room auth tests; full threat-model closure needed |
| Physical card/mat/board assets | Playtest materials | generated assets and BOM; not printer-approved |
| 300dpi/bleed/safe proof after dielines | BLOCKED | printer dielines, CMYK proof, actual dimensions validation |
| China factory quotes500/1000/2000/3000/5000 | NOT REQUESTED | need factory contacts, specification and authorized outreach; no invented quotes |
| Tabletop setup and physical bookkeeping | NOT TESTED | real table session |
| IP/rights/trademark/legal review | OPEN | working title; independent content provenance, no clearance claim |
| Public deployment or spending | NOT AUTHORIZED / NOT DONE | explicit approval required before external release |

## Human protocol

Recruit diverse skill levels/access needs through user-authorized channels; do not contact people automatically. Obtain consent separately for research participation, recording and telemetry. Collect anonymous sessionID, player count, experience, scenario/seed, rule questions, phase/action timestamps, negotiation outcomes, fun/clarity ratings and accessibility issues. Permit deletion/withdrawal. Avoid personal/sensitive political data. Store recordings only with explicit retention/access agreement. Run full games, not just tutorials; report dropouts and incomplete sessions. Iterate after observed problems; repeat blind tests on changed rules.

## Next bounded decisions

The remaining practical blockers are a real tester pool/schedule, a PostgreSQL service (local or user-approved hosted), final authored content scope, and printer/factory contacts plus permission to send an RFQ. No public hosting approval is needed to keep working locally. No test result authorizes commercial release by itself.
