# Threat model / 2026-10-25

Assets: hidden cargo/objectives/bids, authoritative money/reservations, room admission/reconnect credentials, save integrity. Adversary controls browser code, WebSocket payloads, ordering/retries and network disconnects.

Implemented controls: strict command and protocol validation, server-owned state, seat-bound socket identity, host-only phase advancement, optimistic revisions, idempotent command IDs, max16KiB frames, origin allowlist,30-message burst/5 per second refill, heartbeats,100 loaded-room ceiling, no client secrets, server-only DATABASE_URL, parameterized SQL, token hashes in persistent records. Client analytics absent rather than collected by default.

Tests exercise forged seat, stale revision, duplicate ID, full room, reconnect bearer credential and hidden-view fields. Illegal-command fuzzing checks source immutability and invariants. Dependency audit JSON is included; rerun after lock changes.

Open risks / release blockers:

- A room code is currently the only admission barrier for vacant seats. Production needs account login, explicit private invites, expiry/revocation and recovery. Bearer tokens in sessionStorage are exposed to same-origin XSS; no untrusted HTML is rendered, but CSP/transport/security headers need hosting validation.
- Dev server permits localhost origins only and uses plaintext WS locally. Public HTTPS/WSS deployment is not authorized. No global per-IP connection limit, distributed rate limiter, room eviction or cross-process database locks exists. User-created rooms can exhaust capacity.
- Same seat can connect multiple sockets; revision checks serialize commands but takeover notification is missing.
- Only host can advance: host disconnection can stall play. No paid/auth external provider has been configured.
- PostgreSQL adapter exists but transactional crash/restart recovery has not been tested against a real database. A failed persistence write rolls back in-memory room state, but reconnect/admission failure paths need integration tests.
- Server hides seed/RNG but public setup and some deterministic initial objectives can be inferred. Future secret objective shuffling must use private RNG and a reveal-at-end replay policy. Local hot-seat requires social privacy.
- Current bot sees the complete local state object but its policy selects using its own resources/public board and ignores rival sealed amounts; test asserts offer independence. More bot information-flow tests are required before adversarial online bots.

Security testing performed here is an internal smoke test, not a penetration test or production-security approval. No secrets are committed. No outbound analytics. No public exposure was created.
