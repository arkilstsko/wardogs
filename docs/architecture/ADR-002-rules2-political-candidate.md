# ADR002 — Preserve legacy replays while developing political procurement

Accepted for the candidate,2026-10-26. The PR2 baseline lacked meaningful leader policies and allowed zero-resource coalition scoring. Silently changing old command resolution would make existing saves unreplayable.

Keep schema version1 and select new rule semantics using optional `rulesVersion:2`. Absence preserves old rules exactly. Setup accepts a firm permutation for controlled seat/faction screening; save replay records it. Do not infer a migration by changing old state fields. Four old full-game fixtures are compared canonically with the original engine.

Rules2 introduces political tracks and compatible leaders, actual policy triggers, contact/reputation eligibility, shared crisis tenders, independently dealt objectives and contribution/prestige corrections. New semantics are still a pre-release candidate. Changing them after external save distribution will require a further rules revision or an explicit replay migration.

Bots use public eligibility and their own resources; partner invitations rotate clockwise by round rather than choosing the first array entry. Metamorphic tests change rival cargo/objectives/sealed offers and hidden RNG without changing the tested bot decisions. A fully typed restricted observation API remains open; tests are not a general noninterference proof.

The authoritative server remains the online command boundary. Fixing private draft filtering applies to every phase and is not optional by rule version. UI inspection cannot change authenticated seat; state broadcasts preserve active editors. No new production-auth, database-recovery or public-hosting claims follow from these changes.
