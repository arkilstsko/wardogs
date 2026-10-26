# ADR001 — deterministic command authority (accepted for experimental build)

The browser and server use the same pure engine. Strict discriminated Zod commands carry id/player/type plus typed operands. execute clones current mutable state, copies immutable history arrays, validates legality, resolves atomic effects, appends command and event-log entries, then checks invariants. Seeded integer LCG draws determine world events/tenders/enforcement. Canonical object-key serialization makes replay comparisons inspectable.

Version1 state stores initial seed, human starting faction, seats and accepted command history. JSON import reconstructs initial state and replays; arbitrary injected cash/state fails canonical equality. Unknown versions require explicit migration. There is intentionally no invented migration for nonexistent prior schemas.

Server joins issue random256-bit bearer credentials and store SHA256 hashes. Client never submits state. Socket identity overrides no command: mismatch is rejected. Host advances shared phases. Expected revision rejects races; duplicate command IDs are idempotent. Server filters rival cargo/objectives and negotiation amounts; hides RNG, seed and replay commands until an explicit future replay policy. PostgreSQL adapter persists validated state and hashed seat identities; memory fallback is marked nonpersistent.

Current reducer copies histories without deep-copying old immutable entries; callers must treat all returned state as immutable. This reduces simulation cost while preserving pure engine behavior. Tests compare full replay and rejected-input immutability.

Open: distributed queue/locking for multiple server processes, a separate secret shuffle-seed lifecycle, account/invite auth, admission control, expiring rooms, PostgreSQL failure/restart integration, host succession, content schema authorship, richer event-specific audit metadata and production observability. Do not deploy the development server as a commercial online service.
