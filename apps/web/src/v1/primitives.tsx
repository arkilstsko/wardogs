import React, { useEffect, useRef, useState } from "react";
import {
  CARD,
  FIRMS,
  type Family,
  type Good,
} from "../../../../packages/game-core/src/v1";

export const GOOD_ICON: Record<Good, string> = {
  medical: "first-aid-kit",
  communications: "radio",
  vehicles: "truck",
  arms: "crosshair",
};
export const FAMILY_NAMES: Record<Family, string> = {
  Country: "Land",
  Leader: "Fiktiv leder",
  Organization: "Organisation",
  Supply: "Vare",
  Logistics: "Logistik",
  Contact: "Kontakt",
  Contract: "Udbud",
  WorldEvent: "Verdensbegivenhed",
  Unrest: "Uro",
  Investigation: "Efterforskning",
  Objective: "Hemmeligt mål",
  Agreement: "Aftale",
};
const FAMILY_ICON: Record<Family, string> = {
  Country: "globe-hemisphere-west",
  Leader: "user-rectangle",
  Organization: "buildings",
  Supply: "package",
  Logistics: "boat",
  Contact: "handshake",
  Contract: "scroll",
  WorldEvent: "newspaper",
  Unrest: "fire",
  Investigation: "detective",
  Objective: "target",
  Agreement: "handshake",
};
const orgIcons: Record<string, string> = {
  booking: "boat",
  insurance: "seal-check",
  audit: "detective",
  prestige: "coins",
  credit: "buildings",
  diplomacy: "handshake",
  resale: "package",
  priority: "arrow-right",
  storage: "truck",
  mediation: "scroll",
  escrow: "coins",
  contacts: "radio",
};
const eventArt: Record<string, string> = {
  "open-ports": "contract",
  "supply-shock": "supply",
  "public-scrutiny": "investigation",
  "relief-window": "unrest",
  "quiet-diplomacy": "contact",
  "credit-tightens": "organization",
  clear: "agreement",
  form: "contract",
  inspection: "investigation",
  holiday: "logistics",
  seal: "supply",
  fee: "contact",
};
const genericBack: Record<Family, string> = {
  Country: "MAGTENS GEOGRAFI",
  Leader: "FIKTIVE LEDERE",
  Organization: "KONTORERNE",
  Supply: "FORSYNINGER",
  Logistics: "PÅ VEJ",
  Contact: "FORTROLIGT",
  Contract: "OFFENTLIGT UDBUD",
  WorldEvent: "DAGENS NYHED",
  Unrest: "UROLIGE TIDER",
  Investigation: "SAGSMAPPEN",
  Objective: "FORTROLIGT",
  Agreement: "DET MED SMÅT",
};
export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      aria-hidden="true"
      focusable="false"
    >
      <use href={"/assets/v1/icons.svg#" + name} />
    </svg>
  );
}
export function HouseSeal({
  firm,
  size = 32,
}: {
  firm: number;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      className="house-seal"
      style={{
        width: size,
        height: size,
        maskImage: `url(/assets/v1/house-${FIRMS[firm].id}.svg)`,
      }}
    />
  );
}
export function BusyButton({
  children,
  onClick,
  disabled = false,
  className = "primary",
  title,
}: {
  children: React.ReactNode;
  onClick: () => Promise<unknown> | unknown;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      title={title}
      className={className}
      disabled={disabled || busy}
      aria-busy={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Afventer…" : children}
    </button>
  );
}
export function Folio({
  title,
  close,
  children,
  wide = false,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    heading.current?.focus();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);
  return (
    <dialog
      className={"folio " + (wide ? "folio-wide" : "")}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="folio-paper">
        <header>
          <h2 ref={heading} tabIndex={-1}>
            {title}
          </h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Luk opslaget"
            onClick={close}
          >
            <Icon name="x" />
          </button>
        </header>
        <div className="folio-body">{children}</div>
      </div>
    </dialog>
  );
}
export function Callout({
  title,
  children,
  danger = false,
}: {
  title: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <aside className={"paper-note " + (danger ? "danger" : "")}>
      <h3>{title}</h3>
      <div>{children}</div>
    </aside>
  );
}
export function CardFace({
  id,
  width = 315,
  back = false,
  onClick,
  label,
}: {
  id: string;
  width?: number;
  back?: boolean;
  onClick?: () => void;
  label?: string;
}) {
  const card = CARD[id];
  if (!card) throw new Error("Kortet mangler i v1-kataloget: " + id);
  const leaderBack = back && card.family === "Leader",
    hidden = back && !leaderBack;
  const title = leaderBack
    ? card.back!.title
    : hidden
      ? card.deck === "incident"
        ? "DEN SIDSTE MAPPE"
        : genericBack[card.family]
      : card.title;
  const prose = leaderBack ? card.back!.body : card.body;
  const family =
    card.family === "WorldEvent" && card.deck === "incident"
      ? "Sen hændelse"
      : FAMILY_NAMES[card.family];
  const icon =
    card.family === "Supply"
      ? GOOD_ICON[card.good!]
      : card.family === "Organization"
        ? (orgIcons[card.effect!] ?? "buildings")
        : FAMILY_ICON[card.family];
  const portrait =
    card.family === "Leader"
      ? `/art/v1/${leaderBack ? "successor-" + card.iso + ".png" : "primary-" + card.iso + "-v2.png"}`
      : null;
  const colorClass =
    "family-" +
    card.family.toLowerCase() +
    (card.deck === "incident" ? " incident" : "");
  const scene =
    card.family === "WorldEvent"
      ? eventArt[card.effect!]
      : [
            "Contact",
            "Contract",
            "Logistics",
            "Unrest",
            "Investigation",
            "Agreement",
          ].includes(card.family)
        ? card.family.toLowerCase()
        : null;
  const content = (
    <div
      className={
        "card-face " +
        colorClass +
        (hidden ? " card-back" : "") +
        (prose.length > 350 ? " dense-card" : "")
      }
      style={{ transform: `scale(${width / 630})` }}
    >
      <div className="card-family">
        {family.toUpperCase()} / {hidden ? "BAGSIDE" : "V1.0"}
      </div>
      <h3>{title}</h3>
      <p className="card-timing">
        {hidden
          ? card.deck === "incident"
            ? "Hold skjult indtil fragtfasen."
            : "Kun for den rette modtager."
          : card.family === "Leader"
            ? `${card.iso} · Fiktiv regeringsleder`
            : card.timing}
      </p>
      <div className={"card-art " + (hidden ? "card-seal" : "")}>
        {hidden ? (
          <Icon name={FAMILY_ICON[card.family]} size={190} />
        ) : portrait ? (
          <img
            src={portrait}
            alt="Original illustration af en fiktiv regeringsleder"
            loading="lazy"
          />
        ) : card.family === "Country" ? (
          <>
            <img
              src="/assets/v1/natural-earth-50m.svg"
              alt="Verdenskort med landegrænser"
              loading="lazy"
            />
            <span className="country-stamp">{card.iso}</span>
          </>
        ) : card.family === "Organization" || card.family === "Supply" ? (
          <Icon name={icon} size={210} />
        ) : scene ? (
          <img
            src={`/art/v1/card-${scene}.png`}
            alt="Original illustreret kortscene"
            loading="lazy"
          />
        ) : (
          <Icon name={icon} size={160} />
        )}
      </div>
      {hidden ? (
        <>
          <p className="back-brand">WARDOGS</p>
          <p className="card-copy">FORRETNING SOM SÆDVANLIG</p>
        </>
      ) : (
        <>
          <p className="card-copy">{prose}</p>
          {card.reward && <p className="card-reward">+{card.reward} POINT</p>}
          <p className="card-flavor">
            {leaderBack ? card.back!.flavor : card.flavor}
          </p>
        </>
      )}
      <p className="card-footer">
        {hidden
          ? "WARDOGS / SPILTESTUDGAVE 1.0"
          : "WARDOGS / " + card.collectorCode + (leaderBack ? " B" : "")}
      </p>
    </div>
  );
  const style = { width, height: (width * 880) / 630 };
  return onClick ? (
    <button
      type="button"
      className="card-holder card-button"
      style={style}
      onClick={onClick}
      aria-label={label ?? "Åbn " + title}
    >
      {content}
    </button>
  ) : (
    <div
      className="card-holder"
      style={style}
      role="img"
      aria-label={label ?? title}
    >
      {content}
    </div>
  );
}
export function Die({ value }: { value: number }) {
  const positions: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  return (
    <span className="die" role="img" aria-label={"Terningen viser " + value}>
      {Array.from({ length: 9 }, (_, i) => (
        <i
          key={i}
          className={positions[value]?.includes(i) ? "pip" : "no-pip"}
        />
      ))}
    </span>
  );
}
export function CardReader({
  id,
  initialBack = false,
}: {
  id: string;
  initialBack?: boolean;
}) {
  const [back, setBack] = useState(initialBack);
  const card = CARD[id];
  return (
    <div className="card-reading">
      <CardFace id={id} width={360} back={back} />
      <div>
        <h3>{card.title}</h3>
        <p>{card.timing}</p>
        <p>{card.body}</p>
        {card.family === "Leader" && (
          <>
            <button type="button" onClick={() => setBack(!back)}>
              {back ? "Se den første leder" : "Se afløseren"}
            </button>
            <p>
              Dette læser den anden side. Det vender ikke landets aktive leder i
              spillet.
            </p>
          </>
        )}
        {card.back && (
          <p>
            <strong>Afløser: {card.back.title}.</strong> {card.back.body}
          </p>
        )}
        <p className="flavor">{card.flavor}</p>
        <p className="muted">
          {card.collectorCode} · {FAMILY_NAMES[card.family]}
        </p>
      </div>
    </div>
  );
}
