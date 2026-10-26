# WARDOGS · Forretning som sædvanlig

Spiltestudgave 1.0 for 2–5 mennesker. Den nye udgave er implementeret i dette private repository på baggrund af den eksisterende PR #2 og det færdiggjorte Figma-design. Den er ikke udgivet eller menneskeligt balancetestet.

## Spil lokalt

Brug Node 24 LTS og npm. Ingen betalt tjeneste er nødvendig.

```sh
npm ci
npm run dev
# I et andet terminalvindue, hvis I vil spille online:
npm run server
```

Åbn http://127.0.0.1:5173. Vælg **Tag plads**, 2–5 mennesker, et af fire scenarier og forskellige firmaer. Samme skærm bruger private mapper ved spillerskift. Online opretter værten et bord og deler invitationslinket; hver deltager skal bruge sin egen browserfane. Alle valgte pladser skal være besat før start.

Forhandlingsuret er vejledende. Det forsegler aldrig bud automatisk. Værten styrer det fælles onlineur; lokale genindlæsninger starter det lokale hjælpeur forfra. Selve spiltilstanden, kortene og de underskrevne aftaler gendannes fra gemningen.

Læs [den fulde danske spillebog](docs/design/wardogs-v1/RULEBOOK-DA.md). Åbn spillebog, kortarkiv, marked, aftaler og journal fra bordet. Et kort kan altid åbnes større. Bud bruger én af rundens tre handlinger. Kun den aftalte ekspeditør kan bruge sin tur på afsendelsen.

## Design og regler

[Figma · færdigt v1-bord](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=98-23) · [klikbar gennemgang](https://www.figma.com/design/xt8J8b4flEVpe1tAX36I6w/Dogs-of-War?node-id=111-7273)

- [Design-to-code-handoff med node-id'er](docs/design/wardogs-v1/HANDOFF.md)
- [Implementering, sikkerhed, verifikation og kendte grænser](docs/design/wardogs-v1/IMPLEMENTATION.md)
- [Kortkatalog: 180 hovedkort, 8 rundekort, 4 scenarier](docs/design/wardogs-v1/CARD-CATALOG.md)
- [Nye regler i forhold til v0.1](docs/design/wardogs-v1/MIGRATION.md)
- [Materialer, licenser og trykforberedelse](docs/design/wardogs-v1/PRODUCTION.md)

Reglerne i denne udgave er nyskrevne til spiltest. De er ikke tidligere historisk godkendte regler. `packages/game-core/src/v1/catalogue.json` er det fælles datagrundlag; spillebogen beskriver den menneskelige procedure. Ældre GDD'er og dokumenter om v0.1 er historik. Tidligere simulationer af v0.1 siger intet om balancen i v1.

Den eksisterende udgave er bevaret på **/legacy.html** med sin oprindelige motor, botpolitik og gemninger. V1 importerer ikke v0.1-gemninger. [Historisk README](docs/design/wardogs-v1/legacy-v0.1.md).

## Verifikation

```sh
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
npx playwright install chromium
npm run e2e
npm audit --audit-level=moderate
```

Playwright bruger sin installerede Chromium. Sæt `CHROMIUM_PATH`, hvis der skal bruges en eksisterende Chrome-installation. CI bruger Node 24 og installerer Chromium. De nye testresultater ligger i `docs/design/wardogs-v1/`.

## Online og gemninger

Serveren er autoritativ. V1 bruger WebSocket-ruten **/v1**; den gamle udgave bruger **/**. Indstil `VITE_GAME_SERVER` til en fuld ws/wss-URL med /v1, hvis klient og server kører forskellige steder. Begræns `ALLOWED_ORIGINS` til de konkrete klientadresser.

Uden `DATABASE_URL` findes bordene kun i serverens hukommelse og tabes ved genstart. Med PostgreSQL bruger v1 sin egen tabel `game_rooms_v1`; gemningen afventes før kvittering, og fejl ruller valget tilbage. Virkelig PostgreSQL-genstart er endnu ikke afprøvet i dette miljø.

En hemmelig nøgle i fanens session storage genfinder samme plads. Mister man denne nøgle, er der ingen automatisk konto-gendannelse eller værtsoverdragelse. Online er til private aftalte grupper; der er endnu ingen produktionskonti, moderation eller fordeling over flere serverprocesser.

Lokale gemninger er i IndexedDB. Eksport fra spilmenuen omfatter hele det lokale spil, også skjulte kort. Den åbne onlinejournal omfatter kun offentlige hændelser. Gemninger valideres ved fuld genafspilning af kommandoerne og et kataloghash.

Titlen er foreløbig. Ingen køb, publicering, deployment eller merging er foretaget.
