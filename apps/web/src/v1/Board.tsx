import {
  CARD,
  FIRMS,
  GOOD_NAMES,
  GOODS,
  PHASES,
  PHASE_NAMES,
  type Country,
  type View,
} from "../../../../packages/game-core/src/v1";
import { CardFace, GOOD_ICON, HouseSeal, Icon } from "./primitives";
import { modeNames, type Folio } from "./types";

const COORDINATES: Record<string, [number, number]> = {
  DK: [12, 56],
  GB: [-2, 54],
  FR: [2, 47],
  DE: [10, 51],
  PL: [20, 52],
  ES: [-4, 40],
  IT: [12, 43],
  TR: [35, 39],
  EG: [30, 27],
  NG: [8, 9],
  IN: [79, 23],
  BR: [-50, -12],
  US: [-99, 39],
  JP: [138, 37],
  ZA: [25, -29],
};
function point(lon: number, lat: number) {
  const l = (lon * Math.PI) / 180,
    p = (lat * Math.PI) / 180,
    p2 = p * p,
    p4 = p2 * p2;
  const x =
      l *
      (0.8707 -
        0.131979 * p2 +
        p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
    y =
      p *
      (1.007226 +
        p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)));
  const scale = 1800 / (2 * Math.PI * 0.8707);
  return {
    left: (900 + x * scale) / 18 + "%",
    top: (480 - y * scale) / 9.6 + "%",
  };
}
const countryLabel = (c: Country) =>
  `${c.name}, stabilitet ${c.stability}, efterspørgsel ${c.demand}${c.sanctions ? ", sanktioneret" : ""}`;
export function WorldMap({
  countries,
  open,
  cover = false,
}: {
  countries: Country[];
  open?: (id: string) => void;
  cover?: boolean;
}) {
  return (
    <div className={"world-map " + (cover ? "cover-map" : "")}>
      <img
        src="/assets/v1/natural-earth-50m.svg"
        alt={cover ? "" : "Verdenskort med virkelige landegrænser"}
      />
      {open &&
        countries
          .filter(
            (c) =>
              !["DK", "GB", "FR", "DE", "PL", "ES", "IT", "TR"].includes(c.id),
          )
          .map((c) => (
            <button
              type="button"
              key={c.id}
              className={"country-marker " + (c.sanctions ? "sanctioned" : "")}
              style={point(...COORDINATES[c.id])}
              aria-label={countryLabel(c)}
              onClick={() => open(c.id)}
            >
              {c.id}
              {c.sanctions && <span aria-hidden="true"> !</span>}
            </button>
          ))}
    </div>
  );
}
interface Props {
  view: View;
  seat: string;
  privateOpen: boolean;
  unlock: () => void;
  switchSeat?: (id: string) => void;
  open: (folio: Folio) => void;
  primary: () => void;
  primaryLabel: string;
  primaryDisabled: boolean;
  busy: boolean;
  status?: string;
}
export function Board({
  view,
  seat,
  privateOpen,
  unlock,
  switchSeat,
  open,
  primary,
  primaryLabel,
  primaryDisabled,
  busy,
  status,
}: Props) {
  const me = view.players.find((p) => p.id === seat)!;
  const tenders = view.tenders.filter((t) => t.status === "open");
  const shipments = view.tenders.filter(
    (t) => t.status === "transit" || t.status === "awarded",
  );
  const event = view.worldCard ?? "event-open-ports",
    incident = view.incidentCard ?? "incident-clear";
  return (
    <main className="table" aria-label="Wardogs spillebord">
      <header className="table-header">
        <button
          type="button"
          className="wordmark"
          onClick={() => open("menu")}
          aria-label="Åbn spilmenu"
        >
          WARDOGS
        </button>
        <div className="round-caption">
          <strong>
            RUNDE {String(view.round).padStart(2, "0")} /{" "}
            {String(view.maxRounds).padStart(2, "0")} ·{" "}
            {view.phase === "setup"
              ? "OPSÆTNING"
              : PHASE_NAMES[view.phase].toUpperCase()}
          </strong>
          <span>
            {FIRMS[view.players[view.first].firm].name} har initiativet
            {status && status !== "Forbundet" ? " · " + status : ""}
          </span>
        </div>
        {switchSeat && (
          <label className="header-seat">
            Din plads
            <select
              aria-label="Vælg lokal spiller"
              value={seat}
              onChange={(e) => switchSeat(e.target.value)}
            >
              {view.players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <nav className="table-tools" aria-label="Spilmenu">
          <button
            type="button"
            className="icon-button"
            title="Spillebog"
            onClick={() => open("rules")}
          >
            <Icon name="book-open" />
            <span className="sr-only">Spillebog</span>
          </button>
          <button
            type="button"
            className="icon-button"
            title="Bordets journal"
            onClick={() => open("ledger")}
          >
            <Icon name="scroll" />
            <span className="sr-only">Bordets journal</span>
          </button>
          <button
            type="button"
            className="primary"
            disabled={primaryDisabled || busy}
            onClick={primary}
          >
            {busy ? "Afventer…" : primaryLabel}
          </button>
        </nav>
      </header>
      <nav className="phase-track" aria-label="Rundens faser">
        {PHASES.map((p, i) => (
          <button
            type="button"
            key={p}
            aria-current={view.phase === p ? "step" : undefined}
            onClick={() => open("rules")}
          >
            {String(i + 1).padStart(2, "0")} {PHASE_NAMES[p].toUpperCase()}
          </button>
        ))}
      </nav>
      <div className="table-body">
        <aside className="house-rail" aria-label="Offentlige handelshuse">
          <p className="rail-caption">HANDELSHUSENE / {view.players.length}</p>
          {view.players.map((p) => (
            <div
              className={
                "house-slip " +
                (p.id === view.players[view.first].id ? "initiative" : "")
              }
              key={p.id}
            >
              <button
                type="button"
                className="house-name"
                onClick={() => open({ player: p.id })}
              >
                <HouseSeal firm={p.firm} size={22} />
                <strong>{p.name}</strong>
              </button>
              <p>
                {p.cash} M · Gæld {p.debt} · Prest {p.prestige}
              </p>
              <p>
                EF {p.investigation} · Varer {p.inventoryCount} · Kort{" "}
                {p.contactCount}
              </p>
              <p>
                Log {p.logistics} ({p.reservedLogistics} bundet) · Omd{" "}
                {p.reputation}
              </p>
              <div
                className="action-beads"
                aria-label={`${p.actions} handlinger tilbage`}
              >
                {[0, 1, 2].map((i) => (
                  <i key={i} className={i < p.actions ? "available" : "used"} />
                ))}
                {p.id === view.players[view.first].id && <span>FØRST</span>}
                {view.ready.includes(p.id) && <span>FORSEGLET</span>}
              </div>
            </div>
          ))}
        </aside>
        <section
          className="central-board"
          aria-label="Verdenskort, fragt og udbud"
        >
          <div className="map-board">
            <h1>MAGTENS GEOGRAFI</h1>
            <WorldMap
              countries={view.countries}
              open={(id) => open({ country: id })}
            />
            <div className="europe-strip">
              {view.countries
                .filter((c) =>
                  ["DK", "GB", "FR", "DE", "PL", "ES", "IT", "TR"].includes(
                    c.id,
                  ),
                )
                .map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    aria-label={countryLabel(c)}
                    onClick={() => open({ country: c.id })}
                  >
                    {c.name}
                    {c.sanctions ? " !" : ""}
                  </button>
                ))}
            </div>
          </div>
          <section className="shipping-track" aria-label="Last undervejs">
            <div className="rail-heading">
              <h2>PÅ VEJ / FRISTER</h2>
              <button type="button" onClick={() => open("agreements")}>
                Aftalerne <Icon name="arrow-right" size={16} />
              </button>
            </div>
            <div className="shipment-rail">
              {shipments.map((t) => {
                const b = view.bids.find((b) => b.id === t.winner)?.details;
                return (
                  <button
                    type="button"
                    className="shipment-ticket"
                    key={t.id}
                    onClick={() => open({ tender: t.id })}
                  >
                    <Icon name="boat" size={26} />
                    <span>
                      <strong>
                        {b
                          ? FIRMS[
                              view.players.find((p) => p.id === b.proposer)!
                                .firm
                            ].id.toUpperCase()
                          : ""}{" "}
                        / {view.countries.find((c) => c.id === t.country)?.name}
                      </strong>
                      <small>
                        {t.quantity} {GOOD_NAMES[t.good].toLowerCase()} · Frist
                        R{t.deadline}
                      </small>
                      <small>
                        {t.status === "awarded"
                          ? "Tildelt / afventer ekspedition"
                          : `${b ? modeNames[b.mode] : ""} · Ankomst R${b?.arrival}`}
                        {b?.graceUsed ? " · Frist forlænget én gang" : ""}
                      </small>
                    </span>
                  </button>
                );
              })}
              {!shipments.length && (
                <p className="quiet-slot">
                  Ingen last er undervejs. Vundne udbud og bundet logistik vil
                  ligge her.
                </p>
              )}
            </div>
          </section>
          <section className="tender-track" aria-label="Offentlige udbud">
            <div className="rail-heading">
              <h2>
                OFFENTLIGE UDBUD / {tenders.length}
                {view.scenario !== "intro"
                  ? " · SORTMARKED / " + (view.blackMarket ? 1 : 0)
                  : ""}
              </h2>
              <button type="button" onClick={() => open("catalogue")}>
                Kortarkivet
              </button>
            </div>
            <div
              className="tender-rail"
              style={{
                gridTemplateColumns: `repeat(${Math.max(1, tenders.length + (view.scenario === "intro" ? 0 : 1))},minmax(0,1fr))`,
              }}
            >
              {tenders.map((t) => (
                <button
                  type="button"
                  className="tender-ticket"
                  key={t.id}
                  onClick={() => open({ tender: t.id })}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    open({ tender: t.id });
                  }}
                  aria-label={`${view.countries.find((c) => c.id === t.country)?.name}, ${t.quantity} ${GOOD_NAMES[t.good]}, loft ${t.payout} millioner, frist runde ${t.deadline}`}
                >
                  <strong>
                    {view.countries.find((c) => c.id === t.country)?.name}
                  </strong>
                  <small>
                    {t.quantity} {GOOD_NAMES[t.good].toLowerCase()}
                  </small>
                  <b>
                    Loft {t.payout} M · R{t.deadline}
                  </b>
                  <small className={t.relationship ? "danger-text" : ""}>
                    {t.relationship ? "Kræver rel " + t.relationship : "Rel 0"}{" "}
                    · {t.legal === "gray" ? "Gråt" : "Lovligt"}
                  </small>
                </button>
              ))}
              {view.scenario !== "intro" && (
                <button
                  type="button"
                  className="black-ticket"
                  onClick={() => open("market")}
                >
                  <strong>SORTMARKED</strong>
                  {view.blackMarket ? (
                    <>
                      <small>
                        1 {GOOD_NAMES[view.blackMarket.good].toLowerCase()}
                      </small>
                      <b>
                        {Math.max(1, view.prices[view.blackMarket.good] - 1)} M
                        · EF +1
                      </b>
                      <small>Køb i handlinger</small>
                    </>
                  ) : (
                    <small>Intet åbent tilbud</small>
                  )}
                </button>
              )}
              {!tenders.length && view.scenario === "intro" && (
                <p className="quiet-slot">
                  Nye udbud åbnes i forhandlingsfasen.
                </p>
              )}
            </div>
          </section>
        </section>
        <aside className="news-rail" aria-label="Nyheder og markeder">
          <section>
            <p className="rail-caption">NYHEDEN / DEN SIDSTE MAPPE</p>
            <div className="news-cards">
              <CardFace
                id={event}
                width={146}
                back={!view.worldCard}
                onClick={() =>
                  view.worldCard ? open({ card: event }) : open("timing")
                }
                label={
                  view.worldCard
                    ? "Læs " + CARD[event].title
                    : "Læs om morgennyhederne"
                }
              />
              {view.scenario !== "intro" && (
                <CardFace
                  id={incident}
                  width={104}
                  back={!view.incidentCard}
                  onClick={() =>
                    view.incidentCard
                      ? open({ card: incident })
                      : open("timing")
                  }
                  label={
                    view.incidentCard
                      ? "Læs " + CARD[incident].title
                      : "Den sene hændelse er stadig skjult"
                  }
                />
              )}
            </div>
          </section>
          <section className="market-slip" aria-label="Varemarked">
            {GOODS.map((g) => (
              <button
                type="button"
                className="market-line"
                key={g}
                onClick={() => open("market")}
              >
                <Icon name={GOOD_ICON[g]} size={24} />
                <span>
                  {GOOD_NAMES[g]}
                  <small>{view.stock[g]} på markedet</small>
                </span>
                <strong>{view.prices[g]} M</strong>
              </button>
            ))}
          </section>
          {view.scenario !== "intro" && (
            <section className="organization-market">
              <p className="rail-caption">ORGANISATIONER / 3 M + ÉN HANDLING</p>
              <div>
                {view.organizationRow.map((id) => (
                  <CardFace
                    key={id}
                    id={id}
                    width={84}
                    onClick={() => open("market")}
                  />
                ))}
                {!view.organizationRow.length && (
                  <p className="quiet-slot">Alle organisationer er købt.</p>
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
      <footer className="private-mat">
        <section className="private-summary">
          <p className="rail-caption">DIT HANDELSHUS / PRIVAT</p>
          <h2>{me.name}</h2>
          <p>
            {me.cash} M · Gæld {me.debt} · Prestige {me.prestige}
          </p>
          <p>
            Logistik {me.logistics} · {me.reservedLogistics} bundet
          </p>
          <p>
            <span className="inline-beads" aria-hidden="true">
              {"● ".repeat(me.actions)}
            </span>
            {me.actions} fælles handlinger
          </p>
          <p>
            Lager {me.inventoryCount}/{me.storage} · Efterforskning{" "}
            {me.investigation}
          </p>
        </section>
        <div className="private-hand" aria-label="Din private hånd">
          {privateOpen && me.inventory && me.contactsHand ? (
            <>
              {GOODS.flatMap((g) =>
                Array.from({ length: me.inventory![g] }, (_, i) => (
                  <div
                    className="hand-unit"
                    key={g + i}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", g);
                    }}
                  >
                    <CardFace
                      id={`supply-${g}-01`}
                      width={96}
                      onClick={() => open({ card: `supply-${g}-01` })}
                    />
                  </div>
                )),
              )}
              {me.contactsHand.map((id) => (
                <CardFace
                  key={id}
                  id={id}
                  width={96}
                  onClick={() => open({ card: id })}
                />
              ))}
              {me.objective && (
                <CardFace
                  id={me.objective}
                  width={96}
                  back
                  onClick={() => open({ card: me.objective! })}
                  label="Åbn dit hemmelige mål"
                />
              )}
            </>
          ) : (
            <button type="button" className="privacy-card" onClick={unlock}>
              <Icon name="book-open" size={36} />
              <strong>Åbn din mappe</strong>
              <span>Kun {me.name} må se denne hånd.</span>
            </button>
          )}
        </div>
        <section className="freight-reference">
          <h3>TRE MÅDER AT SENDE PÅ</h3>
          <p>Standard · 1 M · 1 log · næste runde</p>
          <p>Ekspres · 3 M · 2 log · denne runde</p>
          {view.scenario !== "intro" && (
            <p>Grå · 1 M · 1 log · denne runde · EF +2</p>
          )}
          <p>Forsikring +1 M · kun lovlig fragt</p>
        </section>
        <section className="private-controls">
          <h3>
            {view.pending
              ? "BORDET AFVENTER ET SVAR"
              : view.phase === "negotiation"
                ? "FORHANDLING"
                : "DIT NÆSTE TRÆK"}
          </h3>
          <p>
            {view.pending
              ? `${view.players.find((p) => p.id === view.pending!.player)?.name} har et åbent valg.`
              : "Varer, logistik og budget bindes først ved det underskrevne bud."}
          </p>
          <button
            type="button"
            onClick={() => (privateOpen ? open("private") : unlock())}
          >
            <Icon name="book-open" />
            Åbn min spillebog
          </button>
        </section>
      </footer>
    </main>
  );
}
