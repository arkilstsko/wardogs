# Political procurement — rules2 candidate

2026-10-26. This is a playable candidate, not a rules freeze or commercial release. The browser contains the same reference in `PoliticalRulebook.tsx`. Baseline rules1 remain selectable and four complete original golden replays remain byte-identical.

## Implemented scope

The six phases, eight rounds, finite market, three-action economy, sealed public bidding, all-or-nothing delivery, bounded debt and enforcement remain. See [machine-readable action reference](action-economy-rules2.json) and strict [command schema](command.schema.json). `Game.version=1` identifies the save schema; `rulesVersion=2` opts into the political candidate. An absent rulesVersion replays rules1. Save import recreates the selected rule set and rejects any mismatch with canonical replay.

Each of fifteen real countries draws one of three country-compatible fictional leaders. The45 identities have appropriate titles, distinct illustrations and structured priorities, traits, policy, advantage, drawback, trigger, succession and event interaction. Three implemented policy archetypes are reused across countries; this does **not** mean45 independently balanced powers. Some descriptive fields, including riskTolerance and stabilityModifier, are not separate engine modifiers.

| Policy | Advantage | Cost / consequence | Trigger |
| --- | --- | --- | --- |
| Institutionalist | Preferred communications ceiling +2 | Preferred legal tender requires reputation2 | Any successful legal delivery: legitimacy+1, scrutiny−1, participants reputation+1 |
| Modernizer | Preferred armored-mobility ceiling +3 | Preferred tender logistics2; preferred delivery investigation+1 | Preferred delivery order+1/scrutiny+1; supply shock demand+1 |
| Emergency | Preferred infantry-equipment ceiling +2 | Preferred delivery investigation+1/exposure+1 | Preferred delivery demand−1; scrutiny event exposure+1 |

Countries have pressure, public order, legitimacy, scrutiny and sanctions exposure tracks, all integer0–6, in addition to stability and procurement demand. Scheduled elections in rounds3 and6 replace the incumbent if legitimacy≤2. Influence and Stabilize provide public counterplay. Transition draws another compatible leader, resets order/legitimacy/stability3, caps pressure3, adds exposure1, lowers every house relationship1 and holds sanctions until refresh. Stability0 or legitimacy0 also triggers transition. No operational political interference instructions are provided.

Stabilize spends one action/2M for pressure−2, order+1, legitimacy+1, scrutiny−1, exposure−1, stability+1 and own reputation+1. It clears sanctions only if stability≥3/exposure<5. Influence costs1M with contacts≥2, otherwise2M; it also raises legitimacy and reduces pressure. Unrest retains its3M/+2investigation/−1reputation cost and adds shared adverse track effects. It opens at most one crisis tender per country per round to **all** houses. Instability is not a private country-access privilege.

Gray tenders arise at pressure≥3 or stability≤2. Emergency governments at pressure≥4 issue black offers: contacts≥2, printed investigation3, liability5 and ceiling+4. Gray offers add2 to ceiling and investigation2. Investigation≥5 excludes legal/gray participation. Preferred-policy eligibility, logistics and payouts apply at tender creation; the incumbent’s delivery trigger applies at delivery. Black or public-order≤1 transport rolls d6 and fails on1–min(3,risk or1). Sanctions block Transport before this roll.

Each refresh includes one major3-cargo/2-logistics tender. Drafts inspect only the proposer’s private cargo; each signature checks its signer, and final signature checks all. Every participant contributes cargo or logistics; revenue and liability each total100. Total printed prestige is allocated proportionally by revenue using largest remainders, preventing duplication by adding passive names. Draft withdrawal, bounded insolvency, losing-bid escrow refunds and independent rival bidding remain. Signed betrayal, partial delivery and private negotiated tenders remain unsupported requirements, not hidden features.

Secret objectives are independently seeded rather than implied by company identity. Scoring remains the experimental original formula, including its seating-ID final tie fallback. Changing that fallback and faction starting values requires separate controlled evidence; the current screening still fails for some factions.

## Research basis and hypotheses

See [specific sourced findings](../research/PR2-REMEDIATION-MATRIX.md) and [actual rule-reading coverage](../research/PR2-FULL-RULES-REVIEW.md). Signed contributor pledges and shared public risk are design hypotheses informed by negotiation/interdependence research, not copied rule text. Political counterplay, shared crisis access, proportional prestige and separate private objectives are original implementations. Neither primary rules nor bot simulations prove that these choices are enjoyable.

## Evidence and open gates

All45 preferred-delivery policies have actual Transport command regression tests. Additional tests exercise private pledges, zero-resource rejection, elections, stabilization, crisis access, scenario reproducibility and old/new replay. Two separate10,000-game political runs retain exact source fingerprints. Rotating bot invitations removed the largest measured seat distortion. Faction failures remain, and human games remain0/30. Do not infer negotiation quality,90–120minute duration, comprehension or replayability from runtime.

The physical analogue is cards for leaders/equipment/tenders; country tracks and action discs; money; written sealed offers; named signed pledge sheets; and d6 event/disruption/enforcement tables. Browser inspection, fan/stack/flip, map zoom and replay are optional presentation conveniences. Current print exports still represent rules1 and must not be sold as rules2 production components.
