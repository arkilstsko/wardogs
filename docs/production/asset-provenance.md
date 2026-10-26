# Asset provenance — physical playtest edition

Checked 2026-10-26. These records support review; they do not establish trademark clearance, exclusive copyright or commercial release approval.

| Asset | Source / authorship | License and limits |
| --- | --- | --- |
| Map geometry | Natural Earth 1:110m admin-0 country GeoJSON, retrieved 2026-10-25 from [Natural Earth vector repository](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson); transformed into simplified SVG for the board | [Natural Earth terms](https://www.naturalearthdata.com/about/terms-of-use/) were read and state the map data is public domain, including commercial printing. Geographic/political depiction and accuracy review remain open. Local derivative: `packages/assets/src/map.json`. |
| Icons and print layouts | Original SVG paths in `packages/ui/src/Icon.tsx`, and generator `tools/export-print.ts` | No third-party icon set or recognizable politician portrait was incorporated. Project ownership and release licensing remain for the owner to approve. |
| Country / leader / company / effect text | Authored for this project from implemented experimental engine content | Real country names/geography; fictional leaders and firms. Similar-name and trademark clearance has not been performed. |
| Inter | Inter Project Authors; [license](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt) | SIL OFL 1.1. Local font and copyright/license notice under `apps/web/public/fonts/`. Preserve notices when distributing fonts. |
| Barlow Condensed | Barlow Project Authors; [license](https://raw.githubusercontent.com/google/fonts/main/ofl/barlowcondensed/OFL.txt) | SIL OFL 1.1; same bundled-license requirement. |
| Source Serif 4 | Source Serif 4 Project Authors; [license](https://raw.githubusercontent.com/google/fonts/main/ofl/sourceserif4/OFL.txt) | SIL OFL 1.1; same bundled-license requirement. |
| Digital supply illustrations | Separate session-generated artwork | See `generated-art.md`. Not used in these physical SVG exports; no exclusive rights or print approval claimed. |

Font and Natural Earth license pages were read on 2026-10-25. Print SVG text currently uses editable `Arial,sans-serif` for reliable construction; font embedding, brand typography reconciliation, Danish glyph proofing and printer text preflight remain open. No Arial font file is bundled with the print assets.

The print generator exports one SVG per distinct effect or template, with multiplicities in `card-list.csv`. It intentionally describes current baseline leader traits and contact-track limits instead of inventing card abilities. The engine's generic `CARD_CATALOG` is not evidence that every proposed card has an implemented effect.

Validation on 2026-10-26: all 58 files matching `packages/assets/print/*.svg` parsed as XML; 53 CSV card records total 281 requested card objects; the HTML contact sheet exists. Card canvases declare 69×94mm, comprising 63×88mm trim plus 3mm bleed per edge; the construction safe box is inset 5mm from trim. XML validity does not verify clipping, legibility, color separation or physical usability. No 300dpi raster or production PDF was produced: the available ImageMagick SVG delegate was missing, and the browser raster-export attempt did not complete. Do not label these assets printer-approved.
