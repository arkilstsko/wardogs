# PR2 art bible — approval pending

Version0.1, 2026-10-26. This is a production brief and provenance contract, not a claim of finished or approved art. The supplied user text ends mid-section9; requirements beyond the supplied text are not inferred here.

## Direction and readable hierarchy

Premium geopolitical thriller with the restraint of a tactile European board game: charcoal linen, walnut table edges, parchment records, aged brass, restrained red seals. Convey negotiation, institutions, delivery promises and consequences. Avoid celebratory violence, tactical diagrams, operational illicit-trade instructions, real-politician likenesses and copyrighted entertainment identities. Real geography is allowed; people, firms and organizations remain fictional. Art cannot imply that a real country or its population has a fixed moral character.

Base palette: ink `#11171B`, charcoal `#20292E`, panel `#29343A`, walnut `#49352C`, parchment `#E7DCC5`, paper `#F4EBDD`, brass `#C5A56A`. Status colors require readable text/icon companions and tested text/background contrast. Illustrations remain secondary to card name, legal status, cost, effect, deadline and commitments. Do not bake interface text, flags, percentages, prices or status into raster artwork.

Typography follows Barlow Condensed700/800 display, Inter400–700 UI with tabular figures, Source Serif4 narrative400/600, subject to font assets/declared-weight verification. Main UI text14–16px and metadata12–14px; important7–10px labels are forbidden. Physical type requires an actual-size printer-approved proof; digital pixel thresholds do not substitute for print legibility.

Use one clear focal motif, limited background detail and a quiet text-safe region. Preserve both the full scene and documented card crop. Standard digital card baseline189×264; physical63×88mm trim,3mm bleed per edge and5mm safe inset. Keep important faces, objects and symbols within safe crop. Source images must support their intended effective300dpi print size where raster art is used. Dielines and color-managed proofing remain external gates.

## Family inventory and visual intent

Every enabled record needs a stable ID and separately stored art metadata, effect, timing, target, eligibility, cost, restrictions, resolution, visual state, EN/DA localization, accessibility description and physical print representation. An illustration alone does not make a playable card.

| Required family | Core visual grammar | Required distinction / approval focus |
| --- | --- | --- |
| Country | Editable geography cameo, restrained national locality vignette, institutional dossier | Preserve factual geographic source; one locality scene per authored record where required. Real boundaries/flags need depiction review. Stability and demand remain live UI/tokens. |
| President / Head of Government | Fictional editorial painted portrait at conversational distance, credible office context | Country/office-compatible fictional identity; distinguish faces, age presentation, hair, clothing, pose and lighting. No identifiable politician likeness or copied official portrait. |
| Government Contact | Bureaucratic liaison at a desk, hallway or reception point, face/gesture indicating a role | Contact is separate from leader and trading firm; no real agency badges, names or documents. Effects/eligibility remain explicit text. |
| Organization | Distinct fictional institutional setting, group identity/emblem, organization-specific props | Do not reuse player-house emblems as external organizations. No real military/intelligence/criminal insignia. |
| Equipment | Abstract supply categories, civilian utility context, cargo, cases, seals and inventory labels rendered without readable text | Distinguish silhouette/material/function at small size; no procurement/assembly/operation diagrams, violence spectacle or real illicit-route details. |
| Supplier | Fictional depot, workshop or distribution office, credible commercial staff | Supplier identity and supply capability need authored art; a generic Acquire icon is insufficient. |
| Contract | Signed-paper/delivery dossier with scene inset or cargo destination vignette | Public/private/legal/gray state is live data, never baked into art. Terms, escrow and payout must remain readable/editable. |
| World Event | Wide editorial scene: port policy, shipping disruption, credit environment, public scrutiny | Show shared consequences without assigning protected real-person blame; use newsroom art grammar and original compositions. |
| Political Event | Cabinet table, parliamentary corridor, public institutional transition | Mechanically distinct from World Event and Unrest; no stock riot imagery used to stand in for every political change. |
| Unrest / Conflict | Consequence-focused, distant civic disruption, closed crossings or disrupted services | Human cost and uncertainty without gore, tactical instructions or a celebratory violence aesthetic. Never imply profit is the sole consequence. |
| Investigation | Evidence ledger, audit lamp, sealed records, formal hearing | Legal process and uncertainty; no copied agency logos, procedural evasion hints or sensational victim imagery. |
| Secret Objective | Private folio, symbolic long-term ambition and distinctive motif | Art suggests theme without replacing precise scoring conditions; face-down art must not reveal objective identity. |
| Company Ability | House-specific emblem and action vignette, visually tied to its faction without relying on initials | Ability art must differ from generic house identity when distinct records require unique illustration. Avoid implying an unimplemented power. |
| Special Negotiation | Negotiating hands/table arrangement, escrow objects, explicit shared-stake motif | Signed/draft/rejected/revoked/fulfilled states use editable overlays and visible labels. No invented exclusive country access. |
| Financing / Debt | Credit ledger, bond-like record, secured reserve, restrained accounting scene | Distinguish borrowing, repayment, interest and exposure. No fake precision, real-bank marks, executable financial advice or false guarantee. |

Legacy Logistics survives as a reusable equipment-capability subtype or preserved capability component; consumable cargo must remain distinguishable. Alliance/Agreement survives as the signed-agreement subtype within Special Negotiation, with enforceable party shares and signatures intact. A naming migration cannot silently delete those mechanics.

## Political art bible

Paint institutions as contingent systems: government chambers, negotiation rooms and succession transitions, with architecture and furnishings compatible with the fictional role/location. Leaders are fictional and named consistently in records. Show differing civic contexts without caricature, propaganda claims or treating real national identity as a danger indicator. Political Event, World Event and Unrest need distinct scene briefs tied to their authored effects. Leadership succession requires new character identity/art and a recorded compatible-country pool; changing a name over one generic silhouette does not meet unique portrait coverage.

Review for plausible office title, respectful depiction, unintentional real-person similarity, duplicate face/pose, national stereotypes, readability and direct effect relevance. Final geopolitical/sensitivity review remains pending.

## Equipment art bible

Use materials and scale that read as physical cargo: cloth wrapping, timber cases, anodized housings, pallet edges, utility wheels, medical cases. Equipment categories should be distinguishable in silhouette and value without status colors. Existing digital categories are medical cargo, communications and civilian utility vehicles. This is a factual inventory of current art scope, not a declaration that future equipment families are authored.

Supply illustrations may show abstract fictional trade goods in ordinary handling/storage. Do not depict step-by-step weapon use, illicit sourcing, evasion or route planning. No catalog plates copied from real manufacturers. Each approved art record needs original-source provenance, a clean full scene, a safe card crop and a useful accessibility description. Repeated copies of the same card may share art; distinct authored records must have explicit uniqueness decisions rather than accidental shared backgrounds.

## Organization art bible

Fictional player houses and outside organizations have separate identity namespaces. Emblems use original geometry, legible silhouettes and meaningful institutional motifs. Maintain one master identity per organization plus justified small-size/monochrome adaptations. Do not use a letter-only monogram as the final identity. Avoid corporate, governmental, military and entertainment-brand imitation. Environmental scenes establish purpose through original furnishings, people and material detail rather than copied logos or readable confidential documents.

Five new source emblem concepts exist under `packages/assets/brands`: Meridian compass/route; Northstar port beacon; Vesper exchange/hourglass; Atlas linked arches/consortium; Redwood tree/warehouse. Each has64-viewBox master and24-viewBox asset. These are authored, XML-validated, unapproved assets. No art-direction, 24px visual, trademark or commercial approval is claimed. `CompanyMark.tsx` is an optional image wrapper; no main UI integration is implied.

## Location art bible

Anchor scenes with plausible coastlines, urban grain, light, materials and contemporary civilian infrastructure. Geography derives only from the recorded Natural Earth source unless another source passes provenance review. Illustration can be evocative rather than a precise real-site reconstruction, but must not claim documentary truth. Do not place fictional illicit operations at a named real facility or imply real citizens are participants. Preserve crop space for country names and accessible map targets. Any recognizable landmark/photo reference needs explicit source/right review and an approved transformation record.

## Office art bible

Offices express role through a small controlled prop vocabulary: ledger, dispatch tray, shaded desk lamp, blank folder, restrained wall map, seating arrangement. A government head's office, liaison desk, supplier depot and house negotiation room must differ in composition. Avoid repeated government seals, real political photographs and generated gibberish text. Keep visible documents blank or abstract; all meaningful text belongs in editable UI. Offices must remain usable as portrait backgrounds at the intended crop, without a high-contrast lamp or prop competing with the face.

## Finance art bible

Use visibly fictional ledgers, escrow trays, reserve chips, marked-but-unreadable envelopes and balanced geometries. Integer money units, debt caps, liability/revenue shares and interest live in data/UI. Do not render decorative numeric amounts that contradict the engine. Payment is conditional on delivery in the current rules; the scene must not imply guaranteed upfront revenue. Financing art and overlays need distinct draft/committed/settled/default states with text/icon explanations and contrast-tested values.

## News art bible

World bulletins use original editorial scenes, restrained paper framing and a hierarchy compatible with live event title/effect. No copied newspaper mastheads, wire-service photographs, logos or fabricated claims presented as real reporting. News framing must remain visibly part of the fictional tabletop. Type is editable EN/DA; avoid readable generated article text in the image. Six current event effects do not imply a complete long-term event deck. Each enabled event must have its own effect-linked brief and approved asset record.

## Covert art bible

Convey uncertainty with lighting, partially closed folders, ambiguous silhouettes and an empty chair; do not make secrecy itself heroic or imply operational expertise. No real covert organization insignia, surveillance blueprint, sanctions-evasion procedure or unrest instructions. Investigation and covert-reputation consequences require visible game labels independent of color or image ambiguity. Hidden card backs must not expose objective/role through unique visible crops or file-name-derived accessible labels.

## Portrait production status

Five original sheets now exist and have been visually inspected, with45 individually mapped fictional leader cells. `portrait-manifest.json` maps every leader ID to its distinct cell; `portrait-provenance.json` records source hashes. The browser uses these cells in the country dossier and gallery. Generated/visually inspected is not owner approval, likeness clearance, exclusive copyright or print approval. Figma portrait import remains blocked by the environment proxy403 at mcp.figma.com.

Portrait review must check face/pose duplication within and between sheets, recognizable-politician resemblance, fictional-name/office/country compatibility, skin/hair/clothing variety without stereotypes, generation artifacts, hands/eyes when visible, lighting consistency, safe crop and readable character identification. Record rejection/revision reasons and the approver. Generation success is not approval.

## Provenance and approval contract

Every asset manifest entry records: stable asset/card ID; family/subtype; creator/tool and date; source path/hash; original source URL/version/license where applicable; prompt and reference-image IDs if generated; reference rights status; full-scene dimensions; crop rectangle; EN/DA alt description; intended browser/Figma/print mappings; effective print resolution; transformation history; and named approval status/date. Rights scope and exclusivity claims must be stated only from evidence.

Required workflow statuses: **planned → generated/authored → inventoried → technical review → art-direction review → rights/similarity review → approved for named use**. Rejected/superseded assets remain traceable and must not ship accidentally. Approval for one use does not imply approval for every use. The owner or designated human art/rights reviewer supplies approvals; no such approval has been recorded in this task.

Current status ledger:

| Asset group | Evidence | Actual status |
| --- | --- | --- |
| Five company emblems /10 SVG files | Original vector source, accessible title/desc,64/24 viewBoxes, XML parse and SHA256 manifest | Authored/inventoried; visual/24px/identity/rights approval pending. |
| Existing supply triptych | PNG plus `generated-art.md`; digital CSS crop | Generated and previously browser-used; unique-record expansion, Figma/print parity and final rights/art approval pending. |
| Portrait sheets | Five original files,45 mapped cells, all sheets visually inspected and browser loading smoke-tested | Browser integrated; owner/rights/print review pending. Figma image upload blocked. |
| Existing map, fonts, print construction files | `asset-provenance.md`, OFL notices, Natural Earth terms, XML evidence | Provenance recorded; exact-source hashes/versioning and applicable production reviews remain open. |
| Other15-family scene/art inventory | Audit identifies missing coverage | Planned/unfulfilled until stable records and individually reviewed assets exist. |

## Acceptance evidence before final integration

Inspect marks at24px and64px, monochrome, dark/light surroundings and high zoom; confirm distinctions survive without initials. Render each card family at normal and zoom size in EN/DA, with important text meeting PR2 thresholds and no clipped face, cost or terms. Verify status by text/icon, not art alone. Check every manifest path/hash, rights notice and card/effect mapping. Read back Figma vector/text/editable layers after integration; a raster portrait is permissible as art but cannot replace editable card structure. Produce actual-size print/duplex/dieline proofs. Log approvals and remaining defects; no release or manufacturing readiness may be inferred from this bible.
