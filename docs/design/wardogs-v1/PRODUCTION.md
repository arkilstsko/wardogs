# Wardogs v1 · materialer og produktionsforberedelse

Figma er et redigerbart originaldesign og en spiltestklar visuel kilde. Der er ikke bestilt en fabrikssats eller gennemført fysisk trykprøve.

## Reelt leverede materialer

180 hovedkort i 12 familier, otte rundekort, fire scenarier, fem spillerplader, alle fem pengedenominationers to sider, husfarvede og fælles markører, seks terningesider, førstespillermærke, fragt/reservation/forsikring/aktion/status, to sider til private skærme, kuvert til forseglede bud, aftaleblok, æskelåg og æskebagside samt seks sider med fuldt regelsæt.

Inventaret er præcist i `game-v1.json.componentInventory`: blandt andet 15 fragtbrikker, 15 handlinger, 75 relationer, 50 spormarkører, 15 sanktioner, 30 reservationsklemmer, 15 forsikringsmarkører, fem kontormarkører, to D6 og 1.000 M i sedler. Gentagne fysiske eksemplarer skal fremstilles fra de tilsvarende mastere; de er ikke særskilte nye mekanikker.

## Størrelser og næste tryktrin

Hovedkortenes kanoniske master er 630×880. 63×88 mm er den tilsigtede kortstørrelse ved en aftalt 10 designenheder/mm-konvertering; dette er ikke en DPI-angivelse. Rigtige bleed-, safe-area-, hjørne- og duplexmål skal sættes efter den valgte leverandørs skabelon, typisk med særskilt bleed uden for den nuværende skæreflade.

Spillerpladerne er 1100×760 designenheder. Æskelåget er 1800×1800. Bog og aftaleblok er 1680×2376, et A4-forhold. Disse er flade designmastere, ikke stansefiler. Æskens højde, ryg, wrap, bakkekonstruktion, samlinger og paptykkelse kræver en konkret leverandør og det pakkede komponentvolumen.

Bevar tekst og symboler som vektorer. Kontroller rasterbilleder ved den endelige fysiske størrelse; de nye primære portrætter og afløserudsnit er i leverede kildestørrelser, ikke kunstigt mærket som 300 dpi. En æskeart kan kræve større original end et kort. Papir/filt er teksturer, ikke en erstatning for trykprøve på virkeligt materiale.

Før fysisk produktion: lav 1:1-prøve af kort, femmandsaftale, spilleplade, små markeringsfelter og foldeskærme; verificér læsbarhed, farveadskillelse, dobbeltsidet pasning og komponentantal. En egentlig CMYK-profil, sortopbygning, overprint og maksimalt farvedække skal afstemmes med trykkeriet.

## Rettigheder og kilder

- Geografi: [Natural Earth admin-0 50m](https://www.naturalearthdata.com/downloads/50m-cultural-vectors/50m-admin-0-countries-2/), [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/). Pinned commit og hashes i assets/geography-provenance.json.
- Projektion: Natural Earth I, rå formel fra d3-geo med ISC-meddelelse i assets/LICENSE-d3-geo.txt.
- Symboler: [Phosphor core](https://github.com/phosphor-icons/core), Duotone, MIT. Licensmeddelelsen medleveres.
- Barlow Condensed, Inter og Source Serif 4: selvhostede fonte, de konkrete OFL-meddelelser følger med i browserens public/fonts.
- Fem firmasegl: originale SVG'er. Illustrationer og teksturer: AI-genererede til dette projekt, dokumenterede prompter og kildefiler i leverancen.
- Brugerens indsendte kort er bevaret. Dets oprindelige rettighedskilde er ikke dokumenteret og må ikke få Natural Earth-licens ved navneskifte.

## Referencer og egen retning

[John Company](https://wehrlegig.com/products/john-company-second-edition): redaktionel orden og forhandlingsbord. [Pax Pamir](https://wehrlegig.com/products/pax-pamir-second-edition): materialer og ro. [Brass Birmingham](https://roxley.com/products/brass-birmingham): mørk plade og økonomiens fysiske objekter. [Dune Imperium](https://www.direwolfdigital.com/dune-imperium/): handlinger og korthierarki. [Scythe](https://store.stonemaiergames.com/products/scythe): spillerpladens rumdeling. [Arcs](https://rules.buriedgiant.com/): tydeligt symbolsprog.

[BGA's Pax Pamir-side](https://en.boardgamearena.com/gamepanel?game=paxpamir) og brugerens [Figma Community-kortskabelon](https://www.figma.com/design/r4x0uhbYQjMvuclKKhdQlL/Board-Game-Design-Template?node-id=2-399) er brugt som sammenligningspunkter. Det er designmæssige referencer, ikke en påstand om at alle deres regler er læst eller at deres grafik må kopieres. Ingen illustrationer, ikoner, korttekster eller layouts er overtaget som spilassets fra disse værker.

Produktionsteknik skal tilpasses den valgte leverandør; eksempelvis [The Game Crafter templates](https://help.thegamecrafter.com/article/39-templates) og [DPI guidance](https://help.thegamecrafter.com/article/33-dpi-dots-per-inch) beskriver netop leverandørspecifik forberedelse.

## Visuel vurdering

Bordet prioriterer genkendelige kort, løse fragtbilletter, private mapper og tydelige aftaler frem for gentagne dashboardbokse. Alle betjeningsflader har konsekvent lys, pressed/hover/focus-tilstand og læsbar udvidet tekst. Phosphor er valgt for ensartet tegning; originale segl giver spillet identitet uden 23 forskellige tilfældige ikonstile.

Navnene på handelshusene bevarer forbindelsen til det eksisterende repo. Arbejdstitlen WARDOGS er ikke fastlåst eller rettighedsgodkendt. Den danske undertitel er Forretning som sædvanlig. Humoren ligger i kontorarbejdet, papirerne og de ubehagelige aftaler. Portrætterne er bevidst illustrerede og fortsat AI-genererede; der hævdes ikke, at ingen vil genkende det.
