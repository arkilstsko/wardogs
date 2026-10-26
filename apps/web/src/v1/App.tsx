import { NegotiationClock } from "./Clock";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  CARD,
  createGame,
  execute,
  exportGame,
  importGame,
  viewFor,
  type Game,
  type View,
} from "../../../../packages/game-core/src/v1";
import { Board } from "./Board";
import { Connection, type OnlineState } from "./connection";
import {
  Actions,
  Catalogue,
  CountryBook,
  Ledger,
  Manual,
  Market,
  PrivateBook,
  PublicHouse,
  Reaction,
  Results,
} from "./Operations";
import { Agreements, TenderBook, Trades } from "./TradeFolio";
import {
  BusyButton,
  Callout,
  CardFace,
  CardReader,
  Folio,
  Icon,
} from "./primitives";
import { ConfigurationForm, Cover, TableSetup, type PlayMode } from "./Setup";
import { download, loadLocal, randomSeed, saveLocal } from "./storage";
import { canAct, type Choice, type Folio as FolioType } from "./types";

type Screen = "cover" | "configuration" | "table";
function titleOf(f: FolioType) {
  if (!f) return "";
  if (typeof f === "object") {
    if ("country" in f) return "Landebogen";
    if ("tender" in f) return "Udbud og fragt";
    if ("card" in f) return CARD[f.card]?.title ?? "Kort";
    return "Handelshuset";
  }
  return {
    menu: "Spilmenu",
    rules: "Spillebogen",
    market: "Marked og organisationer",
    actions: "Din tur ved bordet",
    agreements: "Aftalemappen",
    trade: "Handel over bordet",
    catalogue: "Hele kortkataloget",
    ledger: "Bordets journal",
    scores: "Det sidste regnskab",
    reaction: "Et åbent valg",
    private: "Din private spillebog",
    timing: "Nyheden og den sidste mappe",
    seal: "Forsegl din forhandling",
  }[f];
}
export function App() {
  const [screen, setScreen] = useState<Screen>(() =>
    new URLSearchParams(location.search).has("join")
      ? "configuration"
      : "cover",
  );
  const [local, setLocal] = useState<Game | null>(null),
    localRef = useRef<Game | null>(null);
  const [online, setOnline] = useState<OnlineState | null>(null),
    onlineRef = useRef<OnlineState | null>(null),
    connection = useRef<Connection | null>(null);
  const [seat, setSeat] = useState("p0"),
    seatRef = useRef("p0");
  const [revealed, setRevealed] = useState(false),
    revealedRef = useRef(false);
  const [folio, setFolio] = useState<FolioType>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [status, setStatus] = useState(""),
    [busy, setBusy] = useState(false),
    [room, setRoom] = useState(""),
    [saved, setSaved] = useState(false);
  const file = useRef<HTMLInputElement>(null),
    startDone = useRef<(() => void) | null>(null),
    pendingKey = useRef("");
  const view = online?.view ?? (local ? viewFor(local, seat) : null);
  const viewRef = useRef<View | null>(view);
  viewRef.current = view;
  const hide = () => {
    revealedRef.current = false;
    setRevealed(false);
  };
  const switchSeat = (id: string) => {
    if (onlineRef.current) return;
    hide();
    setFolio(null);
    seatRef.current = id;
    setSeat(id);
  };
  const open = useCallback((f: FolioType) => {
    setFolio(f);
  }, []);
  const followState = (next: Game) => {
    localRef.current = next;
    setLocal(next);
    setSaved(false);
    setScreen("table");
    const target =
      next.pending?.player ??
      (next.phase === "setup"
        ? next.setup.order[next.setup.cursor]
        : next.phase === "actions" && next.players.some((p) => p.actions > 0)
          ? next.players[next.active].id
          : null);
    if (target && target !== seatRef.current) {
      hide();
      setFolio(null);
      seatRef.current = target;
      setSeat(target);
    }
    if (next.finished) {
      revealedRef.current = true;
      setRevealed(true);
      setFolio("scores");
    }
  };
  const send = useCallback(async (choice: Choice) => {
    if (!revealedRef.current) {
      setError(
        "Åbn først din private mappe, så det rigtige hus foretager valget.",
      );
      return false;
    }
    setError("");
    setBusy(true);
    try {
      if (connection.current && onlineRef.current)
        return await connection.current.send(choice);
      if (!localRef.current) throw new Error("Åbn et spil først.");
      const next = execute(localRef.current, {
        ...choice,
        id: crypto.randomUUID(),
        player: seatRef.current,
      });
      followState(next);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Valget blev afvist.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (!local) return;
    let current = true;
    void saveLocal(local)
      .then(() => {
        if (current) setSaved(true);
      })
      .catch(() => {
        if (current) {
          setSaved(false);
          setError(
            "Browseren kunne ikke gemme spillet. Hent en JSON-gemning fra spilmenuen, før du lukker.",
          );
        }
      });
    return () => {
      current = false;
    };
  }, [local]);
  useEffect(
    () => () => {
      connection.current?.close();
      startDone.current?.();
    },
    [],
  );
  useEffect(() => {
    if (!view?.pending) {
      pendingKey.current = "";
      setFolio((current) => (current === "reaction" ? null : current));
      return;
    }
    const key =
      view.round + ":" + view.phase + ":" + JSON.stringify(view.pending);
    if (key !== pendingKey.current) {
      pendingKey.current = key;
      if (view.pending.player === seat && revealed) setFolio("reaction");
    }
  }, [view, seat, revealed]);
  const unlock = () => {
    revealedRef.current = true;
    setRevealed(true);
    if (viewRef.current?.pending?.player === seatRef.current)
      setFolio("reaction");
  };
  const leave = () => {
    connection.current?.close();
    connection.current = null;
    onlineRef.current = null;
    setOnline(null);
    setFolio(null);
    setScreen("cover");
    hide();
    startDone.current?.();
    startDone.current = null;
  };
  const load = async () => {
    setError("");
    try {
      const game = await loadLocal();
      connection.current?.close();
      connection.current = null;
      onlineRef.current = null;
      setOnline(null);
      seatRef.current = game.players[game.active]?.id ?? "p0";
      setSeat(seatRef.current);
      hide();
      followState(game);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gemningen kunne ikke åbnes.");
    }
  };
  const start = async (
    config: Parameters<typeof createGame>[0],
    mode: PlayMode,
    code: string,
  ) => {
    setError("");
    setNotice("");
    setFolio(null);
    connection.current?.close();
    connection.current = null;
    onlineRef.current = null;
    setOnline(null);
    if (mode === "local") {
      history.replaceState(null, "", location.pathname);
      const game = createGame({ ...config, seed: randomSeed() });
      seatRef.current = game.players[game.active].id;
      setSeat(seatRef.current);
      hide();
      followState(game);
      return;
    }
    localRef.current = null;
    setLocal(null);
    setRoom(code);
    hide();
    await new Promise<void>((resolve) => {
      startDone.current = resolve;
      const options =
        mode === "create"
          ? {
              count: config?.count ?? 3,
              scenario: config?.scenario ?? "standard",
              firms: config?.firms ?? [0, 1, 2],
              timerMinutes: config?.timerMinutes ?? null,
            }
          : null;
      try {
        const conn = new Connection(
          code,
          options,
          (state) => {
            const first = !onlineRef.current;
            onlineRef.current = state;
            setOnline(state);
            seatRef.current = state.player;
            setSeat(state.player);
            setScreen("table");
            if (first) {
              hide();
              sessionStorage.setItem("wardogs:v1:last-room", code);
              history.replaceState(
                null,
                "",
                location.pathname + "?join=" + encodeURIComponent(code),
              );
            }
            if (state.view.finished) {
              setRevealed(true);
              revealedRef.current = true;
              setFolio("scores");
            }
            resolve();
          },
          (text) => {
            setError(text);
            resolve();
          },
          setStatus,
        );
        connection.current = conn;
        conn.connect();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Forbindelsen kunne ikke åbnes.",
        );
        resolve();
      }
    });
    startDone.current = null;
  };
  const primary = () => {
    if (!view) return;
    if (view.finished) {
      setFolio("scores");
      return;
    }
    if (view.pending) {
      if (!revealed && view.pending.player === seat) unlock();
      else setFolio("reaction");
      return;
    }
    if (view.phase === "actions" && view.players.some((p) => p.actions > 0)) {
      setFolio("actions");
      return;
    }
    if (view.phase === "negotiation" && !view.ready.includes(seat)) {
      if (
        view.agreements.some(
          (a) => a.status === "draft" && a.required.includes(seat),
        )
      ) {
        setFolio("seal");
        return;
      }
      void send({ type: "ready" });
      return;
    }
    void send({ type: "advance" });
  };
  let label = "Fortsæt",
    disabled = false;
  if (view) {
    const host = !online || seat === "p0";
    if (view.finished) label = "Åbn slutregnskabet";
    else if (view.pending) {
      label =
        view.pending.player === seat
          ? "Besvar dit åbne valg"
          : "Afventer " +
            view.players.find((p) => p.id === view.pending!.player)!.name;
      disabled = false;
    } else if (view.phase === "world") {
      label = "Begynd verdensfasen";
      disabled = !host;
    } else if (view.phase === "income") {
      label = "Udbetal indkomst";
      disabled = !host;
    } else if (view.phase === "negotiation") {
      const all = view.players.every((p) => view.ready.includes(p.id));
      label = !view.ready.includes(seat)
        ? "Forsegl mine bud"
        : all
          ? "Afgør udbuddene"
          : "Afventer øvrige huse";
      disabled = view.ready.includes(seat) && (!all || !host);
    } else if (view.phase === "actions") {
      const remaining = view.players.some((p) => p.actions > 0);
      label = remaining
        ? canAct(view, seat)
          ? "Vælg min handling"
          : "Andet hus har tur"
        : "Åbn fragtfasen";
      disabled = remaining ? !canAct(view, seat) : !host;
    } else if (view.phase === "delivery") {
      label = "Afslør den sidste mappe";
      disabled = !host;
    } else if (view.phase === "scoring") {
      label =
        view.round === view.maxRounds ? "Gør slutregnskabet op" : "Næste runde";
      disabled = !host;
    }
    if (online && status !== "Forbundet") disabled = true;
  }
  const props = view ? { view, seat, send, open } : null;
  const menu = (
    <>
      <p>
        Regeludgave 1.0 / spiltestudgave.{" "}
        {online
          ? `Onlinebord ${room}.`
          : saved
            ? "Den seneste lokale tilstand er gemt i browseren."
            : "Lokal gemning er endnu ikke bekræftet."}
      </p>
      {online && (
        <>
          <label>
            Invitationslink
            <input
              readOnly
              value={`${location.origin}/?join=${encodeURIComponent(room)}`}
            />
          </label>
          <BusyButton
            className="secondary"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(
                  `${location.origin}/?join=${encodeURIComponent(room)}`,
                );
                setNotice("Invitationslinket er kopieret.");
              } catch {
                setError("Markér og kopiér invitationslinket fra feltet.");
              }
            }}
          >
            Kopiér invitationslink
          </BusyButton>
          <p>
            {online.persistence === "postgres"
              ? "Bordet gemmes på spilserveren. Din plads genfindes med denne fanes private nøgle."
              : "Bordet findes i den åbne spilserver og overlever ikke en servergenstart. Bevar værten og dine faner åbne."}
          </p>
          <BusyButton
            className="secondary"
            onClick={() => connection.current?.reconnect()}
          >
            Genforbind min plads
          </BusyButton>
        </>
      )}
      <div className="menu-grid">
        <button type="button" onClick={() => setFolio("rules")}>
          Spillebog
        </button>
        <button type="button" onClick={() => setFolio("catalogue")}>
          Kortarkiv / alle 12 familier
        </button>
        {view && (
          <>
            <button type="button" onClick={() => setFolio("ledger")}>
              Bordets journal
            </button>
            <button type="button" onClick={() => setFolio("scores")}>
              Mit regnskab
            </button>
            <button type="button" onClick={() => setFolio("trade")}>
              Bytte varer og kontakter
            </button>
            <button type="button" onClick={() => setFolio("agreements")}>
              Aftaler og fragt
            </button>
          </>
        )}
        {local && (
          <>
            <BusyButton
              className="secondary"
              onClick={async () => {
                try {
                  await saveLocal(local);
                  setSaved(true);
                  setNotice("Spillet er gemt.");
                } catch {
                  setError("Gemningen mislykkedes. Hent JSON-filen i stedet.");
                }
              }}
            >
              Gem lokalt nu
            </BusyButton>
            <button
              type="button"
              onClick={() =>
                download("wardogs-v1-save.json", exportGame(local))
              }
            >
              Hent fuld gemning / alle skjulte kort
            </button>
          </>
        )}
        {online && view && (
          <button
            type="button"
            onClick={() =>
              download(
                "wardogs-open-ledger.json",
                JSON.stringify(
                  {
                    format: "wardogs-open-ledger",
                    ruleset: view.ruleset,
                    round: view.round,
                    log: view.log,
                  },
                  null,
                  2,
                ),
              )
            }
          >
            Hent den åbne journal
          </button>
        )}
        <BusyButton className="secondary" onClick={load}>
          Åbn lokal gemning
        </BusyButton>
        <button type="button" onClick={() => file.current?.click()}>
          Importér v1-gemning til lokalt spil
        </button>
        <a href="/legacy.html">Åbn den gamle v0.1-udgave</a>
        <button type="button" onClick={leave}>
          Tilbage til forsiden
        </button>
      </div>
      <p>
        Fiktive personer og organisationer. Naturgeografi: Natural Earth,
        offentlig ejendom. Symboler: Phosphor Duotone, MIT. Originale
        illustrationer er AI-genererede. Balance og varighed er endnu ikke målt
        med mennesker.
      </p>
    </>
  );
  const content = () => {
    if (!folio) return null;
    if (folio === "menu") return menu;
    if (folio === "rules") return <Manual />;
    if (folio === "catalogue") return <Catalogue open={open} />;
    if (typeof folio === "object" && "card" in folio)
      return (
        <CardReader key={folio.card} id={folio.card} initialBack={folio.back} />
      );
    if (!props || !view) return <p>Åbn et bord for at se denne mappe.</p>;
    const privateRequest =
      [
        "market",
        "actions",
        "private",
        "agreements",
        "trade",
        "scores",
        "seal",
      ].includes(String(folio)) ||
      (typeof folio === "object" && "tender" in folio) ||
      (folio === "reaction" && view.pending?.player === seat);
    if (privateRequest && !revealed && !view.finished)
      return (
        <button type="button" className="privacy-card" onClick={unlock}>
          <Icon name="book-open" size={44} />
          <strong>
            Jeg er {view.players.find((p) => p.id === seat)!.name}
          </strong>
          <span>Åbn min private mappe</span>
        </button>
      );
    if (folio === "market") return <Market {...props} />;
    if (folio === "actions") return <Actions {...props} />;
    if (folio === "private")
      return revealed ? (
        <PrivateBook {...props} />
      ) : (
        <button type="button" className="primary" onClick={unlock}>
          Åbn min private mappe
        </button>
      );
    if (folio === "agreements") return <Agreements {...props} />;
    if (folio === "trade") return <Trades {...props} />;
    if (folio === "ledger") return <Ledger view={view} />;
    if (folio === "scores") return <Results view={view} seat={seat} />;
    if (folio === "reaction")
      return view.pending ? (
        revealed || view.pending.player !== seat ? (
          <Reaction key={pendingKey.current} {...props} />
        ) : (
          <button type="button" className="primary" onClick={unlock}>
            Åbn min mappe og svar
          </button>
        )
      ) : (
        <p>Valget er allerede afregnet. Bordet kan fortsætte.</p>
      );
    if (folio === "seal")
      return (
        <>
          <Callout title="Du står stadig på åbne kladder">
            <p>
              Forsegling lukker din forhandling. De åbne kladder kan derefter
              ikke blive til nye bindende bud med dig som part. Allerede
              indsendte bud bliver stående.
            </p>
          </Callout>
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setFolio("agreements")}
            >
              Tilbage til aftalerne
            </button>
            <BusyButton
              onClick={async () => {
                if (await send({ type: "ready" })) setFolio(null);
              }}
            >
              Forsegl uden de åbne kladder
            </BusyButton>
          </div>
        </>
      );
    if (folio === "timing")
      return (
        <div className="card-reading">
          <CardFace id="incident-clear" width={315} back />
          <div>
            <h3>To bunker. To tidspunkter.</h3>
            <p>
              Morgennyheden bliver kendt i verdensfasen. Den sene hændelse
              afsløres først i fragtfasen, efter rundens bud og handlinger.
            </p>
            <p>
              Du kender de seks mulige sene hændelser og det åbne afkast, men
              ikke rækkefølgen i den skjulte bunke.
            </p>
            <p>
              Introduktionen bruger kun morgennyheder. Fragtkrisen har den
              kendte Formular 47B i runde 3.
            </p>
          </div>
        </div>
      );
    if (typeof folio === "object") {
      if ("country" in folio)
        return (
          <CountryBook key={folio.country} id={folio.country} {...props} />
        );
      if ("tender" in folio)
        return <TenderBook key={folio.tender} id={folio.tender} {...props} />;
      return <PublicHouse id={folio.player} view={view} />;
    }
    return null;
  };
  return (
    <>
      <input
        className="sr-only"
        ref={file}
        type="file"
        accept="application/json,.json"
        aria-label="Importér gemt v1-spil"
        onChange={async (e) => {
          const selected = e.target.files?.[0];
          if (!selected) return;
          try {
            if (selected.size > 10_000_000)
              throw new Error("Gemningen er større end 10 MB.");
            const game = importGame(await selected.text());
            connection.current?.close();
            connection.current = null;
            onlineRef.current = null;
            setOnline(null);
            hide();
            setFolio(null);
            seatRef.current = game.players[game.active]?.id ?? "p0";
            setSeat(seatRef.current);
            followState(game);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Gemningen kunne ikke åbnes.",
            );
          } finally {
            e.target.value = "";
          }
        }}
      />
      {screen === "cover" && (
        <Cover
          start={() => {
            setError("");
            setScreen("configuration");
          }}
          load={load}
          open={open}
        />
      )}
      {screen === "configuration" && (
        <ConfigurationForm start={start} back={leave} error={error} />
      )}
      {screen === "table" &&
        view &&
        (view.phase === "setup" ? (
          <TableSetup
            {...{ view, seat, send, revealed }}
            reveal={unlock}
            switchSeat={online ? undefined : switchSeat}
            host={!online || seat === "p0"}
            occupied={online?.occupied ?? view.players.map((p) => p.id)}
          />
        ) : (
          <Board
            {...{ view, seat, busy, status, open }}
            privateOpen={revealed}
            unlock={unlock}
            switchSeat={online ? undefined : switchSeat}
            primary={primary}
            primaryLabel={label}
            primaryDisabled={disabled}
          />
        ))}
      {screen === "table" && view && (
        <NegotiationClock
          view={view}
          online={online}
          control={(a) => connection.current?.controlTimer(a)}
        />
      )}
      {screen === "table" && online && status !== "Forbundet" && (
        <div className="connection-banner" role="status">
          {status}
          <button type="button" onClick={() => connection.current?.reconnect()}>
            Genforbind
          </button>
        </div>
      )}
      {folio && (
        <Folio
          title={titleOf(folio)}
          close={() => setFolio(null)}
          wide={
            ["rules", "catalogue", "agreements", "trade", "scores"].includes(
              String(folio),
            ) || typeof folio === "object"
          }
        >
          {content()}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
        </Folio>
      )}
      {error && !folio && screen !== "configuration" && (
        <div className="toast error-toast" role="alert">
          <span>{error}</span>
          <button
            type="button"
            aria-label="Luk beskeden"
            onClick={() => setError("")}
          >
            <Icon name="x" />
          </button>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>
          <button
            type="button"
            aria-label="Luk beskeden"
            onClick={() => setNotice("")}
          >
            <Icon name="x" />
          </button>
        </div>
      )}
    </>
  );
}
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal">
        <h1>Bordet er sat på pause.</h1>
        <p>
          Genindlæs siden og åbn den senest bekræftede gemning. En ugyldig
          visning overskriver ikke automatisk din gemte fil.
        </p>
        <button type="button" onClick={() => location.reload()}>
          Genindlæs siden
        </button>
        <a href="/legacy.html">Åbn v0.1</a>
      </main>
    ) : (
      this.props.children
    );
  }
}
