# Dogs of War — kritisk visuel gennemgang

26.10.2026. Vurdering af den faktiske Figma-fil, ikke af et kørende spil.

**Samlet vurdering: Ikke færdig på det ønskede kommercielle kvalitetsniveau.** Grundsystemet og geografi kan bruges videre. Der er udført en konkret forbedringsrunde i filen; de resterende problemer er ikke løst af flere skygger eller flere illustrationer.

[Åbn vurderingen i Figma](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=57-2).
[Ikonprøve ved 20, 24 og 32 px](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=57-17).

## 1. Spillebord — forbedret, stadig ikke slutgodkendt

Før: dominerende flade paneler, brede liggende varefelter og kun bogstavkoder i Europa. Det lignede en browsergrænseflade med kort i midten.
Nu: stående håndkort, afdæmpede materialelag, papirkort for husene og markedet, genkendelige varesymboler, fulde europæiske landenavne og 52×44 landevalg uden ændring af geografiens vektorer.

Et centralt problem står tilbage: referencepladen viser ikke en komplet, verificeret session i gang. Modstanderes offentlige penge, gæld, prestige, efterforskning, reservationer og relevante relationer skal kunne findes uden at spilleren mister overblikket. De viste starttal skal ikke læses som en deterministisk engine-snapshot efter indkomstfasen. Der mangler også et gennemprøvet flow mellem plade, udbud, reservation og levering.

*Screenshot i den lokale review-pakke: Pladen før.*
*Screenshot i den lokale review-pakke: Pladen efter, 1440×900.*

## 2. Knapper — tydeligt forbedret

De tidligere bløde, ens skygger er erstattet med fastere kanter og en mindre skygge. Primær og sekundær handling har hver seks tilstande: standard, hover, fokus, trykket, deaktiveret og indlæsning. Grundmål 220×48; 3px hjørner. Fokus har en faktisk ydre cyan ramme; trykket tilstand er mørkere. Hover/tryk-reaktioner er konfigureret i Figma.

Dette er en visuel og strukturel kontrol. Tastatursemantik, skærmlæser, inputforsinkelse og den oplevede trykrespons i et kørende spil er ikke testet.

*Screenshot i den lokale review-pakke: Knapper før.*
*Screenshot i den lokale review-pakke: Knapper efter: primær øverst, sekundær nederst; standard, hover, fokus, trykket, deaktiveret, indlæsning fra venstre.*

## 3. Kort og SVG-ikoner — bedre fundament, ikke et pixel-perfect løfte

De abstrakte specialsymboler var ikke tydelige nok ved små størrelser. Phosphor Duotone bruges nu som et sammenhængende SVG-bibliotek: radio, køretøj, medicinsk kasse, organisation, kontrakt, uro, efterforskning og øvrige funktioner. 22 originale upstream SVG'er og MIT-licensen følger med. De tidligere egenbyggede symboler er bevaret som historik, men skal ikke bruges som det aktive funktionssæt.

Alle ikonmasters er 32×32. Et kontrolark viser dem ved 20, 24 og 32 px. Det er bedre dokumentation end at kalde vektorer automatisk pixel-perfect; faktisk browserzoom og skærmtæthed skal stadig testes.

Kortets regeltekst er hævet til 16px på 315×440-masteren, billedfeltet tilpasset, familiesymboler indsat og bagsiderne opdateret. Forsyningskortet henviser til markedets pris frem for at ligne en vare med fast købspris. Kortarkivets forhåndsvisninger er genoprettet med korrekt proportion.

Familierne er fortsat for ens i deres overordnede komposition. Et kontraktkort bør ikke have samme prioritering som et portrætkort. Uafklarede organisationer og personlige lederevner er fortsat åbne indholdspunkter.

*Screenshot i den lokale review-pakke: Kortsystem før.*
*Screenshot i den lokale review-pakke: Kortsystem efter.*
*Screenshot i den lokale review-pakke: SVG-kontrolark.*

Community-referencen [2:399](https://www.figma.com/design/r4x0uhbYQjMvuclKKhdQlL/Board-Game-Design-Template?node-id=2-399) er undersøgt. Den viser brugbar adskillelse af titel, værdi, billede og effekt samt genbrugelige komponenter. Den er en skabelon, ikke i sig selv et kvalitetsbevis for vores slutprodukt.

## 4. Illustrationer og navne — kræver en ny redaktionel runde

**Ja, den nuværende billedserie har et tydeligt genereret præg.** Det kan ses i gentagen hånd-ved-hage-positur, skrivebord, gardiner, lys og kameravinkel. Billedernes oprindelse er også kendt: de blev genereret i den forrige runde. Mere detalje er ikke løsningen; mere bevidst variation og en fælles verden er.

Havnescener, vokssegl og historiske luksusrum peger mod en anden periode end de moderne politiske roller. Min anbefaling er en nutidig geopolitisk thriller med arkivpræg: varierede miljøer, færre luksusklichéer og mere tydelig industriel sammenhæng. Det er en visuel anbefaling, ikke en ændring af reglerne. Billedserien er ikke nytegnet i denne runde.

| Navn | Vurdering |
|---|---|
| Meridian & Co. | Det stærkeste arbejdsnavn; enkelt og troværdigt, men mangler endnu sin egen firmaidentitet. |
| Northstar Union | Generisk og mindre tydeligt som handelshus. |
| Vesper Exchange | Lyder som et stemningsnavn til finans/tech; har mest præg af generisk genereret branding. |
| Atlas Cooperative | For generisk; “Cooperative” lover desuden en identitet, der ikke er tydeligt forklaret i spillet. |
| Redwood Trading | Troværdigt, men kunne tilhøre næsten ethvert handelsspil. |
| Astrid Vester / Hana Mizuno m.fl. | Plausible fiktive personnavne. Billedregien er et større problem end disse navne. |
| Dogs of War / Merchants of War | Begge er arbejdstitler. “Merchants of War” beskriver handel og aftaler tydeligere. Ingen vurdering af navnenes tilgængelighed er foretaget. |

Ingen firma-ID'er eller gameplay-navne er ændret i spilkoden.

*Screenshot i den lokale review-pakke: Den aktuelle portrætserie.*

## 5. Konsortium — læsbart dokument, delvist valideret oplevelse

Den konkrete femparts-aftale viser indtægt, ansvar, bidrag og underskrifter forståeligt. Tabellen er passende som kontraktdokument. De sekundære knapper er nu adskilt fra fokus-stilen.

Der mangler stadig en afprøvet helhed med redigering, fejl ved sidste underskrift, forsegling, tabt bud, reservation og faktisk afregning. Screenshots kan ikke bevise, at disse handlinger fungerer.

*Screenshot i den lokale review-pakke: Femparts-aftalen ved auditstart.*

## Hvad de kommercielle referencer lærer os

De officielle billeder fra [John Company](https://wehrlegig.com/products/john-company-second-edition) viser klar forskel på trykt information, brikker og fysisk materialitet. [Brass Birmingham](https://roxley.com/products/brass-birmingham) viser illustrerede kort med en genkendelig, kontrolleret ramme. Min designmæssige konklusion er, at vi skal have færre ens paneler og mere bevidst hierarki; brun baggrund og guldkant alene gør ikke oplevelsen eksklusiv.

Deres grafik er ikke kopieret eller inkluderet i assetpakken.

## Verifikation og bevisgrænse

- Referenceformater 1920×1080 og 1440×900 er gengivet og visuelt undersøgt.
- Ingen målte primær-/tværakse-overløb på de berørte sider efter rettelser, med 1px tolerance.
- Materialelagenes koordinater og udstrækning er kontrolleret; de ligger inden for deres forældre.
- 22 ikonmasters er præcis 32×32; kontrolark ved 20/24/32 px er visuelt undersøgt.
- Skriftfamilier kontrolleret: Barlow Condensed, Inter og Source Serif 4.
- 125 komponenter, 308 instanser, 15 farvevariabler og 4 målvariabler i den opdaterede fil. Mængden er ikke et kvalitetsmål.
- Ingen spilkode ændret, ingen publicering, køb eller merge.
- Det oprindelige samtaleværktøj gav kun et begrænset tekstudtræk og ikke alle gamle vedhæftninger. Denne vurdering bygger på den tilgængelige faktiske fil, de aktuelle screenshots og det tidligere læste repo-grundlag.
- Der er ikke gennemført et kørende spil, brugertest, fuld tilgængelighedstest eller trykprøve.

Prioritet før endelig implementering: sammenhængende art direction → gennemarbejdet session i gang og offentligt overblik → kortfamiliernes særskilte hierarki → hele forhandlings-/leveringsflowet → endelig navne- og illustrationsredaktion.
