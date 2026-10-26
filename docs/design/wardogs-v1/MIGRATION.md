# Fra v0.1 til Wardogs v1.0

Baseline er PR #2, branch feat/playable-tabletop, commit 520a03ada667e93d9ead585e719a001f48a99449. Brugerens efterfølgende tilladelse omfatter også implementering i spilkoden.

V1 ligger som en separat motor og klient. Den eksisterende v0.1-motor, bots og gamle gemninger er bevaret, og klienten kan åbnes på /legacy.html. Der udføres ikke en skjult eller tabsfuld konvertering af gamle gemninger.

| Område | Ny udgave |
|---|---|
| Spillets varighed | 8 runder, eller 6 i introduktion/Fragtkrisen |
| Varer | Medicinsk, kommunikation, køretøjer, våbenmateriel; præcis 12 enheder pr. type |
| Indkomst | 2 M; gæld vedligeholdes, ledig logistik koster ikke |
| Handlinger | 3 fælles pr. runde; bud og ekspedition bruger hver én |
| Udbud | N+2; frosset loft og frist; deterministiske ligheder |
| Prestige | Én pulje på mængde+1; deles efter aftalen |
| Konsortium | 2–5 reelle parter, atomisk sidste signatur og enstemmige ændringer |
| Fragt | Standard/ekspres/grå med faktiske ankomstrunder |
| Forsikring | 1 M; navngivet tab erstattes til den reelle vareejer |
| Drama | Morgennyheder, skjult sen hændelse, lederskifte, sanktioner og kontrol |
| Kort | 180 hovedkort i 12 familier, 8 runder, 4 scenarier |
| Score | gulv((kasse+varer−gæld)/3)+prestige+relationer+mål−2×EF−4×sanering+scenarie |
| Online | 2–5 menneskepladser, separat v1-protokol og private projektioner |

Reglerne er nyskrevne til spiltest. De er ikke præsenteret som tidligere godkendte spilmekanikker. Den fulde ordlyd er RULEBOOK-DA.md; det maskinlæsbare katalog er game-v1.json. Ved tvivl undersøges regler, test og sidste bekræftede spiltilstand sammen.

De gamle Figma-sider og den oprindelige Stitch-grafik er bevaret. Nye v1-sider 10–14 er aktiv designkilde. Ældre specifikationer med øjeblikkelig levering, andre varepuljer eller gammel scoring skal ikke implementeres i v1.

Regnevalidering og softwaretests beviser implementerede egenskaber. De dokumenterer ikke menneskelig spilbalance eller en godkendt fysisk produktion.
