# Wardogs v1 · implementering og verifikation

## Leveret funktionalitet

En ny regelsystemgren i `packages/game-core/src/v1` er isoleret fra den eksisterende prototype. Den dækker 2–5 menneskelige spillere, fire scenarier, 6/8 runder, fire varetyper med præcis 12 enheder hver, 12 kortfamilier, 12 mål, 12 kontakter, 12 organisationer og de 30 lederidentiteter.

Udbud har et frosset betalingsloft og deadline. Bud bruger en fælles handling. Reservationer gælder samtidig for alle indsendte bud. Sidste konsortiesignatur udføres atomisk; fejl har ingen delvirkning. Penge, prestige og ansvar bruger største-rest-fordeling med aftalens rækkefølge ved lighed. Kontrakter afregnes højst én gang.

Standard rejser til næste runde, ekspres ankommer i samme runde, og grå passage har ét reelt D6-slag med den aktive kontrolgrænse. Forsikring gælder navngivet varetabsårsag. Eksterne forsinkelser giver højst én fristforlængelse og aldrig en ekstra slutrunde. Sanktioneret ankomst kan vente eller omlægges ved alle parters samtykke. Lederskifte påvirker relationer og åbner ikke straks grænsen igen.

Alle 12 kontaktvinduer og organisationseffekter er implementeret. Reaktionsvinduer baseres på offentligt håndantal, ikke kortidentitet, så ventetid ikke afslører, hvilket kort en anden ejer. En rabat kan gøre en ellers gyldig parts faktisk betalte bidrag 0: underskriften og den aftalte fordeling gælder stadig, men det giver ikke personlig leveranceprogression.

## Klient og adgang

V1-klienten er `apps/web/src/v1`. `main.tsx` åbner den nye udgave; `legacy.html` åbner den gamle klient og motor. Begge indgår i produktionsbygget. V1 har menneskelige spillere; der er ikke annonceret nye v1-bots.

Lokalt skjuler skærmskift de tidligere kort før den næste visning. Gemninger tilhører IndexedDB-databasen wardogs-v1. Import genafspiller hele kommandojournalen og afviser fremmede versioner, kataloghash eller ændrede tilstande.

Online kører autoritativt gennem `apps/server/src/v1-rooms.ts` og `v1-sockets.ts`. Hver plads har en 256-bit nøgle, kun hash gemmes på serveren. En klient kan kun styre sin egen plads. Værten fører fælles faser videre. Andre hænder, mål, fremtidige bunkeordener, tilfældighedsseed og servernøgler indgår ikke i den offentlige projektion. Det er ikke alene en skjult CSS-visning.

Tilfældighed bruger HMAC-SHA256 med serverens hemmelige 256-bit seed og en deterministisk tæller. Afvisningssampling undgår modulo-bias. Det giver genafspillelige forløb uden at gøre fremtidige kort og terninger beregnelige fra et offentligt lille seed.

Kommandoer valideres med strikte skemaer. Forældede revisioner afvises. Samme id/payload er idempotent, mens samme id med nyt indhold afvises. En mistet første tilmeldingskvittering genbruger klientens allerede gemte claim-token. V1 har en separat kø pr. bord, Origin-kontrol, beskedgrænse, ratebegrænsning og heartbeat.

## Timer og vedvarende data

Uret er vejledende og forsegler intet. Online holder serveren det fælles ur og gemmer pause/fortsættelse sammen med bordet. Selve spillereglerne afhænger ikke af urets millisekunder. Det lokale hjælpeur starter forfra ved genindlæsning.

PostgreSQL-adapteren bruger en separat v1-tabel. Gemning afventes før ACK; fejl gendanner den tidligere tilstand og eksponerer ikke databasefejl til spilleren. Den reelle WebSocket-grænse er testet med en simuleret lagerfejl. En virkelig PostgreSQL-server og genstart har ikke været til rådighed her, så dette er fortsat en afgrænset ubekræftet del.

## Verificeret 26. oktober 2026

- **149 automatiske tests bestået i 7 filer**, heraf 64 bevarede tests for den gamle udgave. V1 omfatter opsætning ved 2/3/4/5, alle scenarier til slut, genafspilning, kort, mål, reservationer, fem parter, forsikring, forsinkelse, omlægning, ændringer, private projektioner og faktiske WebSocket-forbindelser.
- **6 Playwright-forløb bestået**: to for den gamle klient og fire for v1, inklusive en fuld introduktionskamp gennem UI og fem uafhængige online-browserpladser med genforbindelse.
- Typecheck, lint, formatering og produktionsbuild bestået. Produktionsbuildet indeholder både ny og gammel indgang.
- Katalogets uafhængige regnevalidering består **29 kontroller og 12.000 isolerede egenskabstilfælde**. Dette er ikke 12.000 spillede kampe.
- Ingen kendte npm-sårbarheder ved den afsluttende audit. Resultaterne gælder den fastlåste dependencyfil på kontroldatoen.
- 1920×1080 og 1440×900: ingen vandret dokumentoverløb, organisationskort over privatpladen og firmabrikker inden for deres pladser. 390 px: brugbar rullende indretning, ingen vandret dokumentoverløb.
- Alle 180 hovedkort har plads til deres tekst i den kanoniske kortflade. Alle større opslag har rigtig tekst og kan betjenes med tastatur/Escape.

Maskinresultater: `core-test-results.json`, `e2e-results.json`, `validation-report.json`, `figma-qa.json`. Browserbilleder ligger i `previews/`.

## Hvad der ikke er bevist

Ingen menneskelig spiltest, målt spilvarighed eller balanceattest. Ingen fysisk trykprøve, CMYK-preflight eller fabriksgodkendelse. Ingen produktionskonti, nøglebaseret konto-gendannelse, værtsoverdragelse eller vandret serverskalering. Ingen offentlig deployment.

Figma-illustrationer er AI-genererede. Brugerens oprindelige verdenskorts licens er uafklaret; den sporbart licenserede Natural Earth-variant er leveret og bruges i browseren. Den foreløbige titel er ikke rettighedsgodkendt.

## Oplysninger til vedligeholderen

Gemningsversion er 2 og ruleset er wardogs-1.0. Kataloghash beskytter dataudgaven; ved fremtidige semantiske regelændringer skal regler/udgave og kompatibilitet behandles eksplicit. Kataloghash alene beskriver ikke alle mulige fremtidige kodeændringer.

Konsortiefragt reserverer hele grundbudgettet ved underskrift og frigiver rabatten ved ekspedition. Præcis den nødvendige logistik må tildeles. Eksprescentralens reducerede logistik kan kun reserveres til én uafsluttet ordre ad gangen. Ved enstemmigt skift af ekspeditør returneres den oprindelige betalte deponering til sin oprindelige betaler. Disse fortolkninger er synlige i UI og testene; de udgør ikke en påstand om tidligere godkendelse.

Den private server er beregnet til én proces og aftalte grupper. Bevar fanens session storage. Sletning af den private nøgle frigiver ikke automatisk en plads. Brug wss, konkrete Origin-værdier og vedvarende database før en senere godkendt internetudrulning.
