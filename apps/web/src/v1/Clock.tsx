import { useEffect, useState } from "react";
import type { View } from "../../../../packages/game-core/src/v1";
import type { OnlineState } from "./connection";

// Advisory clock: reaching zero never submits bids or consumes an action.
export function NegotiationClock({
  view,
  online,
  control,
}: {
  view: View;
  online: OnlineState | null;
  control: (action: "pause" | "resume" | "reset") => void;
}) {
  const [local, setLocal] = useState({
      round: 0,
      remainingMs: 0,
      runningSince: null as number | null,
    }),
    [now, setNow] = useState(Date.now),
    [offset, setOffset] = useState(0);
  useEffect(() => {
    if (online) setOffset(online.serverNow - Date.now());
  }, [online]);
  useEffect(() => {
    if (!online && view.phase === "negotiation" && view.timerMinutes !== null)
      setLocal((c) =>
        c.round === view.round
          ? c
          : {
              round: view.round,
              remainingMs: view.timerMinutes! * 60000,
              runningSince: Date.now(),
            },
      );
  }, [online, view.phase, view.round, view.timerMinutes]);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  if (view.timerMinutes === null || view.phase !== "negotiation") return null;
  const clock = online?.clock ?? local;
  const sealed = view.ready.length === view.players.length;
  const ms = Math.max(
    0,
    clock.remainingMs -
      (clock.runningSince === null
        ? 0
        : now + (online ? offset : 0) - clock.runningSince),
  );
  const seconds = Math.ceil(ms / 1000),
    host = !online || online.player === "p0";
  const change = (action: "pause" | "resume" | "reset") => {
    if (online) {
      control(action);
      return;
    }
    setLocal((c) =>
      action === "reset"
        ? { ...c, remainingMs: view.timerMinutes! * 60000, runningSince: null }
        : action === "pause"
          ? { ...c, remainingMs: ms, runningSince: null }
          : { ...c, runningSince: Date.now() },
    );
  };
  return (
    <div className="negotiation-clock">
      <strong role="timer" aria-label="Forhandlingstid">
        {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
      </strong>
      <span>
        {sealed
          ? "Alle bud er forseglede"
          : seconds === 0
            ? "Tiden er gået / afslut aftalerne"
            : clock.runningSince === null
              ? "Uret er sat på pause"
              : "Fælles forhandlingsur"}
        <small>Uret forsegler ingen bud automatisk.</small>
      </span>
      {host && !sealed && (
        <>
          <button
            type="button"
            onClick={() =>
              change(clock.runningSince === null ? "resume" : "pause")
            }
          >
            {clock.runningSince === null ? "Start uret" : "Pause"}
          </button>
          <button type="button" onClick={() => change("reset")}>
            Nulstil
          </button>
        </>
      )}
    </div>
  );
}
