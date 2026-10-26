import { useState } from "react";
import {
  CATALOGUE,
  FIRMS,
  GOOD_NAMES,
  GOODS,
  type Configuration,
  type Scenario,
  type View,
} from "../../../../packages/game-core/src/v1";
import { WorldMap } from "./Board";
import { BusyButton, Callout, CardFace, HouseSeal, Icon } from "./primitives";
import type { Folio, Send } from "./types";

export function Cover({
  start,
  load,
  open,
}: {
  start: () => void;
  load: () => Promise<unknown>;
  open: (f: Folio) => void;
}) {
  const previous = sessionStorage.getItem("wardogs:v1:last-room");
  return (
    <main className="cover">
      <WorldMap cover countries={[]} />
      <div className="cover-copy">
        <h1>WARDOGS</h1>
        <p className="cover-subtitle">FORRETNING SOM SÆDVANLIG</p>
        <p className="cover-promise">
          Et spil om handel, aftaler
          <br />
          og den sidste underskrift.
        </p>
        <p className="cover-counts">
          2–5 MENNESKER · FIRE SCENARIER
          <br />
          192 KORT · FEM HANDELSHUSE
        </p>
        <div className="cover-actions">
          <button type="button" className="primary" onClick={start}>
            Tag plads
          </button>
          <BusyButton className="secondary" onClick={load}>
            Fortsæt gemt spil
          </BusyButton>
        </div>
        <nav aria-label="Spillets materialer">
          <button
            type="button"
            className="text-button"
            onClick={() => open("rules")}
          >
            Læs spillebogen
          </button>
          <button
            type="button"
            className="text-button"
            onClick={() => open("catalogue")}
          >
            Se kortene
          </button>
          <a href="/legacy.html">Åbn v0.1</a>
          {previous && (
            <a href={"/?join=" + encodeURIComponent(previous)}>
              Genoptag onlinebord {previous}
            </a>
          )}
        </nav>
      </div>
      <div className="cover-cards" aria-hidden="true">
        <div>
          <CardFace id="leader-NG" width={310} back />
        </div>
        <div>
          <CardFace id="incident-clear" width={280} back />
        </div>
      </div>
      <footer>
        SPILTESTUDGAVE 1.0 · ORIGINALE FIKTIVE PERSONER · RIGTIGE LANDE
      </footer>
    </main>
  );
}
export type PlayMode = "local" | "create" | "join";
export function ConfigurationForm({
  start,
  back,
  error,
}: {
  start: (
    config: Omit<Configuration, "seed">,
    mode: PlayMode,
    room: string,
  ) => Promise<void>;
  back: () => void;
  error: string;
}) {
  const joinCode = new URLSearchParams(location.search).get("join");
  const [count, setCount] = useState(3),
    [scenario, setScenario] = useState<Scenario>("standard"),
    [firms, setFirms] = useState([0, 1, 2]),
    [mode, setMode] = useState<PlayMode>(joinCode ? "join" : "local"),
    [room, setRoom] = useState(
      joinCode ?? "WD-" + crypto.randomUUID().slice(0, 8),
    ),
    [noTimer, setNoTimer] = useState(false),
    [busy, setBusy] = useState(false);
  const changeCount = (n: number) => {
    setCount(n);
    setFirms((old) => {
      const next = old.slice(0, n);
      for (let i = 0; next.length < n; i++) if (!next.includes(i)) next.push(i);
      return next;
    });
  };
  return (
    <main className="configuration">
      <header>
        <button type="button" className="wordmark" onClick={back}>
          WARDOGS
        </button>
        <h1>Vælg den første sending</h1>
        <p>Vælg scenarie og fordel firmaerne, før I åbner de private mapper.</p>
      </header>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await start(
              {
                count,
                scenario,
                firms,
                timerMinutes: noTimer
                  ? null
                  : count === 2
                    ? 3
                    : count === 3
                      ? 4
                      : 5,
              },
              mode,
              room,
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset>
          <legend>Hvordan sidder I ved bordet?</legend>
          <div className="mode-options">
            {[
              [
                "local",
                "Samme skærm",
                "Giv skærmen videre bag en privat mappe.",
              ],
              [
                "create",
                "Vært for et onlinebord",
                "Opret 2–5 menneskelige pladser på den tilsluttede spilserver.",
              ],
              [
                "join",
                "Tag plads online",
                "Brug værtens bordkode eller din eksisterende plads.",
              ],
            ].map(([id, title, copy]) => (
              <label key={id}>
                <input
                  type="radio"
                  name="play-mode"
                  value={id}
                  checked={mode === id}
                  onChange={() => setMode(id as PlayMode)}
                />
                <strong>{title}</strong>
                <span>{copy}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {mode !== "local" && (
          <label>
            Bordkode
            <input
              aria-label="Bordkode"
              required
              pattern="[a-zA-Z0-9-]{3,32}"
              minLength={3}
              maxLength={32}
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </label>
        )}
        {mode !== "join" && (
          <>
            <div className="configuration-line">
              <label>
                Mennesker ved bordet
                <select
                  aria-label="Antal spillere"
                  value={count}
                  onChange={(e) => changeCount(Number(e.target.value))}
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} spillere
                    </option>
                  ))}
                </select>
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={noTimer}
                  onChange={(e) => setNoTimer(e.target.checked)}
                />
                Vi spiller uden forhandlingsur
              </label>
            </div>
            <fieldset>
              <legend>Scenariet</legend>
              <div className="scenario-options">
                {CATALOGUE.scenarios.map((s) => (
                  <label
                    key={s.id}
                    className={scenario === s.id ? "selected" : ""}
                  >
                    <input
                      type="radio"
                      name="scenario"
                      checked={scenario === s.id}
                      onChange={() => setScenario(s.id as Scenario)}
                    />
                    <strong>{s.title}</strong>
                    <span>{s.rounds} runder</span>
                    <p>
                      {s.id === "intro"
                        ? "Seks lande og de vigtigste systemer. Alle firmaer har samme starttal."
                        : s.id === "standard"
                          ? "Alle kort, lande, kontakter og overraskelser."
                          : s.id === "freight"
                            ? "Dyrere varer, kendt forsinkelse og korte frister."
                            : "Politiske skift sætter relationerne under pres."}
                    </p>
                    <details>
                      <summary>Scenarieregler</summary>
                      <ul>
                        {s.rules.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </details>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Fordel handelshusene</legend>
              <div className="firm-allocation">
                {firms.map((firm, i) => (
                  <label key={i}>
                    <HouseSeal firm={firm} size={44} />
                    <span>Plads {i + 1}</span>
                    <select
                      aria-label={"Firma til plads " + (i + 1)}
                      value={firm}
                      onChange={(e) =>
                        setFirms((old) =>
                          old.map((v, j) =>
                            j === i ? Number(e.target.value) : v,
                          ),
                        )
                      }
                    >
                      {FIRMS.map((f, index) => (
                        <option
                          key={f.id}
                          value={index}
                          disabled={index !== firm && firms.includes(index)}
                        >
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <small>
                      {scenario === "intro"
                        ? "Almindelige starttal"
                        : FIRMS[firm].advantage}
                    </small>
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        )}
        {mode === "join" && (
          <Callout title="Din egen plads">
            <p>
              Mapper og mål tilhører kun dit handelshus. Bevar denne fane for at
              genforbinde samme plads. Værten vælger antal spillere, firmaer og
              scenarie.
            </p>
          </Callout>
        )}
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={back}>
            Tilbage
          </button>
          <button type="submit" className="primary" disabled={busy}>
            {busy
              ? "Forbinder…"
              : mode === "join"
                ? "Tag plads ved bordet"
                : mode === "create"
                  ? "Opret privat bord"
                  : "Fordel startkortene"}
          </button>
        </div>
      </form>
      <p className="release-note">
        Varigheden og balancen er endnu ikke målt med menneskelige spiltests.
      </p>
    </main>
  );
}
export function TableSetup({
  view,
  seat,
  revealed,
  reveal,
  switchSeat,
  send,
  host,
  occupied,
}: {
  view: View;
  seat: string;
  revealed: boolean;
  reveal: () => void;
  switchSeat?: (id: string) => void;
  send: Send;
  host: boolean;
  occupied: string[];
}) {
  const me = view.players.find((p) => p.id === seat)!;
  const active = view.setup.order[view.setup.cursor],
    done = view.setup.cursor === view.setup.order.length;
  const ready =
    done &&
    view.players.every((p) => p.objectiveChosen && p.initialRelationChosen) &&
    occupied.length === view.players.length;
  return (
    <main className="setup-table">
      <header>
        <p className="wordmark">WARDOGS</p>
        <h1>Åbn dit handelshus</h1>
        <p>
          {CATALOGUE.scenarios.find((s) => s.id === view.scenario)!.title} ·{" "}
          {view.maxRounds} runder · {view.players.length} mennesker
        </p>
      </header>
      <div className="setup-layout">
        <aside className="setup-seats">
          {view.players.map((p) => (
            <div key={p.id} className={p.id === seat ? "current-seat" : ""}>
              <HouseSeal firm={p.firm} size={36} />
              <strong>{p.name}</strong>
              <span>
                {occupied.includes(p.id)
                  ? "Har taget plads"
                  : "Venter på spilleren"}
              </span>
              <small>
                {p.objectiveChosen ? "Mål valgt" : "Mål mangler"} ·{" "}
                {p.inventoryCount}/2 varer
              </small>
              {switchSeat && p.id !== seat && (
                <button type="button" onClick={() => switchSeat(p.id)}>
                  Giv skærmen
                </button>
              )}
            </div>
          ))}
        </aside>
        <section className="setup-folio">
          <h2>{me.name}</h2>
          <p>
            {view.scenario === "intro"
              ? "Alle firmaer starter ens i introduktionen."
              : FIRMS[me.firm].advantage}
          </p>
          {!revealed ? (
            <button type="button" className="privacy-card" onClick={reveal}>
              <Icon name="book-open" size={44} />
              <strong>Jeg er {me.name}</strong>
              <span>Åbn min private mappe</span>
            </button>
          ) : (
            <>
              {!me.objectiveChosen && (
                <section>
                  <h3>Vælg ét hemmeligt mål</h3>
                  <div className="objective-choice">
                    {me.objectiveChoices?.map((id) => (
                      <div key={id}>
                        <CardFace id={id} width={315} />
                        <BusyButton
                          onClick={() =>
                            send({ type: "choose-objective", card: id })
                          }
                        >
                          Vælg dette mål
                        </BusyButton>
                      </div>
                    ))}
                  </div>
                  <p>Det andet mål går tilbage i æsken uden afsløring.</p>
                </section>
              )}
              {!me.initialRelationChosen && (
                <section>
                  <h3>Northstars første forbindelse</h3>
                  <p>Vælg ét aktivt land med relation 1.</p>
                  <div className="country-choices">
                    {view.countries.map((c) => (
                      <BusyButton
                        key={c.id}
                        className="secondary"
                        onClick={() =>
                          send({ type: "choose-relation", country: c.id })
                        }
                      >
                        {c.name}
                      </BusyButton>
                    ))}
                  </div>
                </section>
              )}
              {me.objectiveChosen && me.initialRelationChosen && (
                <section>
                  <h3>
                    {done
                      ? "Startvarerne er fordelt"
                      : active === seat
                        ? "Vælg din startvare"
                        : view.players.find((p) => p.id === active)?.name +
                          " vælger nu"}
                  </h3>
                  <p>
                    Tag én vare med uret og derefter én mod uret. Alle slutter
                    med to varer. En vare kan vælges, så længe den findes i den
                    fysiske pulje.
                  </p>
                  {!done && active === seat ? (
                    <div className="starting-goods">
                      {GOODS.map((g) => (
                        <div key={g}>
                          <CardFace id={`supply-${g}-01`} width={142} />
                          <BusyButton
                            disabled={!view.reserve || view.reserve[g] === 0}
                            onClick={() =>
                              send({ type: "draft-good", good: g })
                            }
                          >
                            Tag {GOOD_NAMES[g].toLowerCase()}
                          </BusyButton>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !done &&
                    switchSeat && (
                      <button
                        type="button"
                        className="primary"
                        onClick={() => switchSeat(active)}
                      >
                        Giv skærmen til næste hus
                      </button>
                    )
                  )}
                </section>
              )}
            </>
          )}
          <div className="setup-progress">
            <span>
              {view.setup.cursor} / {view.players.length * 2} startvarer fordelt
            </span>
            <BusyButton
              disabled={!host || !ready}
              onClick={() => send({ type: "advance" })}
            >
              {host ? "Begynd runde 1" : "Værten starter første runde"}
            </BusyButton>
          </div>
        </section>
      </div>
    </main>
  );
}
