# Wardogs v1 · konkret Figma-to-code-handoff

26. oktober 2026. Faktiske designs i brugerens eksisterende Figma-fil **xt8J8b4flEVpe1tAX36I6w**. Der er også implementeret en ny spiltestudgave i koden efter brugerens udtrykkelige tilladelse. Denne handoff erstatter de tidligere v0.1-visuelle specifikationer som aktiv retning.

## Åbn disse noder først

| Formål | Node-id | Format |
|---|---|---|
| Hovedbord | 98:23 | 1920×1080 |
| Hovedbord | 98:807 | 1440×900 |
| Forside | 109:330 / 109:766 | begge størrelser |
| Klikbar situationsoversigt | 111:7273 / 111:8228 | begge størrelser |
| Aftale på hovedbordet | 112:368 / 112:1222 | begge størrelser |
| Privat kortlæser | 112:2076 / 112:2883 | begge størrelser |
| Spillerplader | 103:58, 103:132, 103:206, 103:280, 103:354 | 1100×760 |
| Æskelåg | 103:429 | 1800×1800 |
| Aftaleblok | 103:881 | 1680×2376 |
| Samlet fysisk inventar | 103:1093 | 2820×1600 |
| Regelbog 01–06 | 116:217, 116:262, 116:300, 116:330, 116:373, 116:404 | 1680×2376 |
| Natural Earth som native vektorer | 114:3 | 242 landegeometrier |
| Kortets geografiske sammenligning | 115:2 | kilde og bevaret brugerkort |

Direkte linkmønster: https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=98-23

`figma-manifest-v1.json` indeholder de returnerede id'er for alle 42 situationsvisninger, samtlige kortmastere, bagsider, scenarier, runder, penge, brikker, skærme, æske og bog. Brug id'erne; antag ikke id'er ud fra rækkefølgen.

## De fem aktive sider

10: `89:2` hovedbord og forsider. 11: `89:3` kortkatalog. 12: `89:4` bog, scenarier, rundekort og fysisk inventar. 13: `89:5` tilstande og klikbar gennemgang. 14: `114:2` verificeret geografisk alternativ. De oprindelige sider og Stitch-grafikken er bevaret som historik; brugerens eget korrekte kort er bevaret på `1:2`.

De nye sider indeholder **228 native komponenter**, herunder 155 hovedkortmastere, et separat crosshair-symbol, fem firmasegl og 67 fysiske/referencekomponenter. Der er 12 hovedkortfamilier, 180 hovedkort og 195 forside-/bagsideprøver inklusive de 15 lederbagsider. Kontraktfamilien er delt i to variantsæt for at holde sættene håndterbare. Forsider, bagsider og tal er tekst/vektorer; illustrationer og materialer er bitmap-fills.

Der er **21 forskellige situationer i to størrelser**, 42 frames: opsætning, udbud, aftale, underskrift, fragt, transit, hændelse, sanktion, lederskifte, sort marked, privat læser, forsikring, grå kontrol, genforbindelse, versionsfejl, slutscore, handlinger, tomt marked, aftalekonflikt, land og verden. Figma-prototypen navigerer mellem disse; den simulerer ikke motoren. Browserkoden beregner den virkelige tilstand.

## Visuelt system

Filt #193137, blæk #101E22, papir #EEE3C9, guld #C7A66B og brunt spillertræ #392B25. Barlow Condensed Bold til titler, Inter til tal og betjening, Source Serif 4 til korttekst og regelbog. Hele paletten og trinene findes i `design-tokens-base.json`; browserens tilsvarende variable ligger i `apps/web/src/style.css`.

Kanoniske hovedkort er 630×880. Rigtige tekstlag bevarer titel, timing, effekt, citat og samlernummer. Browseren skalerer den samme kortflade og åbner en læser med fuld regeltekst. Små bordkort er objekter, der skal kunne genkendes; afgørende tekst kan læses i opslaget.

23 Phosphor Duotone-symboler følger én fælles 256-grid og MIT-licens. Firmaseglene er fem originale SVG-mærker. Brug eksisterende symboler til genkendelige funktioner, egne segl til identitet. Der er ikke improviseret et forskelligt AI-ikon for hvert felt.

30 fiktive lederportrætter har særskilte situationer og kompositioner. Alle aktive billeder er AI-genererede, ikke stockfotos eller kopierede illustrationer fra referencespillene. Filt og papir bruges som materiale; ingen tekst er brændt ind i illustrationerne.

## Geografi

Hoveddesignet bevarer brugerens 200 landefigurer. Kilden og licensen til netop det indsendte kort er ikke dokumenteret. Siden 14 indeholder derfor et separat, sporbart Natural Earth 50m-alternativ med 242 native geometrier, alle 15 aktive lande og ingen målte datolinjespring. Browseren bruger dette alternativ.

Kildecommit `9380cca83db5f9aef52d5e762765100745f84b27`. Se `assets/geography-provenance.json`. Der er ikke påstået Natural Earth-rettigheder til brugerens original. Originalen må ikke slettes som led i implementeringen.

## Implementeringsrækkefølge og nuværende levering

1. **Fælles regler og data:** det separate `packages/game-core/src/v1/` er implementeret. Faste varepuljer, mål, scenarier, korttiming, endelige runder og slutscore er beregnede.
2. **Binding af aftaler:** udkast, underskrifter, én samlet sidste validering, reservationer, delt prestige/bod, tabende bud, ændringer og reelt bidrag er implementeret.
3. **Bord og private mapper:** forside, opsætning, faser, kort, landebog, marked, bytte, journal, læser og resultat er implementeret.
4. **Fragt og drama:** standard/ekspres/grå, forsikring, forsinkelse, lederskifte, sanktioner, enstemmig omlægning og efterforskning er implementeret.
5. **Online:** autoritative 2–5 pladser, skjulte projektioner, låst pladsnøgle, sekventielle ændringer, kvittering/genforsøg, fælles hjælpeur og genforbindelse er implementeret og lokalt browserprøvet.
6. **Videre releasearbejde:** menneskelige spiltests, virkelig databasegenstart, trykprøve og eventuel produktionsdrift er tilbage. Det er ikke et redesign- eller kodeplaceholderarbejde.

Den gamle motor og klient er bevaret på /legacy.html. Der er ikke ændret i dens regler eller genbrugt dens gamle simulationsresultater som dokumentation for v1.

## QA og grænser

Figma: 0 målte auto-layout-overløb og 0 målte tekstkontrastfejl på de fem nye sider. Den sidste korrekte korttekst blev genkontrolleret på side 11. Denne kontrol vurderer solide farvepar og layoutmål; den er ikke en fuld certificering af skærmlæseradgang eller fysisk tryk.

Browser: målrettet kontrol ved 1920×1080, 1440×900 samt 390 px. Alle 180 hovedkort passer inden for kortfladen, private kort fjernes fra DOM'en ved lokalt skift, organisationsrækken ligger over spillerpladen, og fem selvstændige onlinepladser er prøvet. Se IMPLEMENTATION.md for resultater og resterende releasegrænser.
