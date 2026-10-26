import { useState } from "react";
import {
  CARD,
  CARDS,
  GOOD_NAMES,
  GOODS,
  inventory,
  modeFee,
  modeLogistics,
  type Agreement,
  type Mode,
  type Pledge,
  type Terms,
  type Trade,
  type TradeSide,
  type View,
} from "../../../../packages/game-core/src/v1";
import { BusyButton, Callout, CardFace, Icon } from "./primitives";
import {
  canAct,
  canPlayContact,
  freeGoods,
  freeMoney,
  modeNames,
  privatePlayer,
  type Folio,
  type Send,
} from "./types";
interface Props {
  view: View;
  seat: string;
  send: Send;
  open: (f: Folio) => void;
}
const number = (text: string) =>
  Number.isFinite(Number(text)) ? Number(text) : 0;
const zeroPledge = (id: string): Pledge => ({
  player: id,
  quantity: 0,
  logistics: 0,
  freight: 0,
  insurance: 0,
  revenue: 0,
  liability: 0,
});
function ownTemporary(view: View, seat: string) {
  return view.bids
    .filter((b) => ["sealed", "awarded", "transit"].includes(b.status))
    .reduce(
      (n, b) =>
        n +
        (b.details?.pledges.filter(
          (p) => p.player === seat && p.contact === "contact-capacity",
        ).length ?? 0),
      0,
    );
}
function ModePicker({
  mode,
  setMode,
  insured,
  setInsured,
  priority,
  setPriority,
  allowGray,
  allowPriority,
}: {
  mode: Mode;
  setMode: (v: Mode) => void;
  insured: boolean;
  setInsured: (v: boolean) => void;
  priority: boolean;
  setPriority: (v: boolean) => void;
  allowGray: boolean;
  allowPriority: boolean;
}) {
  return (
    <fieldset className="shipping-choices">
      <legend>Fragtvalg</legend>
      <div>
        {(["standard", "express", "gray"] as Mode[])
          .filter((m) => allowGray || m !== "gray")
          .map((m) => (
            <label key={m} className={mode === m ? "selected" : ""}>
              <input
                type="radio"
                name="freight-mode"
                checked={mode === m}
                onChange={() => {
                  setMode(m);
                  if (m === "gray") setInsured(false);
                  if (m !== "express") setPriority(false);
                }}
              />
              <strong>{modeNames[m]}</strong>
              <span>
                {m === "express"
                  ? "3 M · 2 log"
                  : m === "gray"
                    ? "1 M · 1 log · EF +2"
                    : "1 M · 1 log"}
              </span>
              <small>
                {m === "standard"
                  ? "Næste rundes fragtfase"
                  : m === "express"
                    ? "Denne rundes fragtfase"
                    : "Denne runde · D6 1–2 fejler"}
              </small>
            </label>
          ))}
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={insured}
          disabled={mode === "gray"}
          onChange={(e) => setInsured(e.target.checked)}
        />
        Forsikring +1 M / kun tab ved Brudt forsegling
      </label>
      {allowPriority && mode === "express" && (
        <label className="check-label">
          <input
            type="checkbox"
            checked={priority}
            onChange={(e) => setPriority(e.target.checked)}
          />
          Reservér Eksprescentralen / kun 1 logistik
        </label>
      )}
    </fieldset>
  );
}
export function TenderBook({
  id,
  view,
  seat,
  send,
  open,
}: Props & { id: string }) {
  const t = view.tenders.find((t) => t.id === id)!,
    me = privatePlayer(view, seat),
    [offer, setOffer] = useState(t.payout),
    [mode, setMode] = useState<Mode>(
      view.round === view.maxRounds ? "express" : "standard",
    ),
    [insured, setInsured] = useState(false),
    [priority, setPriority] = useState(false),
    [contact, setContact] = useState<"" | "contact-call" | "contact-capacity">(
      "",
    ),
    [editor, setEditor] = useState(false),
    [stamp, setStamp] = useState(false);
  const winner = view.bids.find((b) => b.id === t.winner)?.details;
  const active = canAct(view, seat),
    canNegotiate =
      view.phase === "negotiation" &&
      !view.ready.includes(seat) &&
      !view.pending &&
      !view.resolving;
  const contacts = me.contactsHand.filter(
    (id) =>
      ["contact-call", "contact-capacity"].includes(id) &&
      canPlayContact(view, me, id),
  );
  const extra = contact === "contact-capacity" ? 1 : 0;
  const temp = ownTemporary(view, seat),
    logistics = modeLogistics({ mode, priority }),
    escrow =
      me.organizations.includes("org-escrow") &&
      me.used["org-escrow"] !== view.round
        ? 0
        : 1;
  const canSolo =
    canNegotiate &&
    me.actions > 0 &&
    me.investigation < 5 &&
    freeGoods(view, me, t.good) >= t.quantity &&
    me.logistics + temp + extra <= 3 &&
    me.logistics + temp + extra - me.reservedLogistics >= logistics &&
    freeMoney(me) >= modeFee(mode) + (insured ? 1 : 0) + escrow &&
    Math.min(
      3,
      (me.relationships[t.country] ?? 0) + (contact === "contact-call" ? 1 : 0),
    ) >= t.relationship &&
    (!contact || contacts.includes(contact)) &&
    offer >= 1 &&
    offer <= t.payout;
  const priorityAvailable =
    me.organizations.includes("org-priority") &&
    me.used["org-priority"] !== view.round &&
    !view.bids.some(
      (b) =>
        b.details?.proposer === seat &&
        b.details.priority &&
        ["sealed", "awarded", "transit"].includes(b.status),
    );
  if (editor)
    return (
      <AgreementEditor
        {...{ view, seat, send, open }}
        tenderId={id}
        kind={t.status === "awarded" ? "amend" : "propose"}
        cancel={() => setEditor(false)}
      />
    );
  return (
    <div className="tender-book">
      <CardFace
        id={t.card}
        width={315}
        onClick={() => open({ card: t.card })}
      />
      <div>
        <h3>
          {view.countries.find((c) => c.id === t.country)!.name} / {t.quantity}{" "}
          {GOOD_NAMES[t.good].toLowerCase()}
        </h3>
        <dl className="ruled-facts">
          <div>
            <dt>Offentligt loft</dt>
            <dd>{t.payout} M</dd>
          </div>
          <div>
            <dt>Frist</dt>
            <dd>Runde {t.deadline}</dd>
          </div>
          <div>
            <dt>Effektiv relation</dt>
            <dd>Mindst {t.relationship}</dd>
          </div>
          <div>
            <dt>Fælles prestige ved succes</dt>
            <dd>{t.quantity + 1}</dd>
          </div>
        </dl>
        {t.status === "open" ? (
          <>
            <p>
              Dit bud er den samlede kundebetaling ved succes. Laveste beløb
              vinder; derefter relation, ekspeditørens omdømme og initiativ.
              Ingen fordel ved at klikke først.
            </p>
            <label>
              Ønsket betaling / 1–{t.payout} M
              <input
                aria-label="Ønsket betaling"
                type="number"
                min={1}
                max={t.payout}
                step={1}
                value={offer}
                onChange={(e) => setOffer(number(e.target.value))}
              />
            </label>
            <ModePicker
              {...{ mode, setMode, insured, setInsured, priority, setPriority }}
              allowGray={view.scenario !== "intro"}
              allowPriority={priorityAvailable}
            />
            {contacts.length > 0 && (
              <label>
                Dit kontaktbilag
                <select
                  value={contact}
                  onChange={(e) => setContact(e.target.value as typeof contact)}
                >
                  <option value="">Intet bilag</option>
                  {contacts.map((id) => (
                    <option key={id} value={id}>
                      {CARD[id].title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <Callout title="Dit samlede tilsagn">
              <p>
                {t.quantity} frie varer · {logistics} logistik ·{" "}
                {modeFee(mode) + (insured ? 1 : 0)} M reserveret fragtbudget ·{" "}
                {escrow} M betalt deponering · én handling.
              </p>
              <p>
                Du har {freeGoods(view, me, t.good)} matchende varer,{" "}
                {me.logistics + temp - me.reservedLogistics} fri logistik og{" "}
                {freeMoney(me)} M fri. Rabatter på fragt og forsikring frigiver
                budget ved ekspedition.
              </p>
            </Callout>
            {!canSolo && (
              <p className="muted">
                Et solobud kræver alle egne ressourcer, landets adgang og en
                åben forhandling. Du kan undersøge muligheden for et konsortium
                i stedet.
              </p>
            )}
            <div className="form-actions">
              <BusyButton
                disabled={!canSolo}
                onClick={async () => {
                  if (
                    await send({
                      type: "bid",
                      tender: id,
                      offer,
                      mode,
                      insured,
                      priority,
                      ...(contact ? { contact } : {}),
                    })
                  )
                    open(null);
                }}
              >
                Indsend mit solobud
              </BusyButton>
              <button
                type="button"
                className="secondary"
                disabled={!canNegotiate}
                onClick={() => setEditor(true)}
              >
                Dan konsortium / 2–5 huse
              </button>
            </div>
          </>
        ) : winner ? (
          <>
            <h3>
              {t.status === "awarded"
                ? "Tildelt / klar til ekspedition"
                : t.status === "transit"
                  ? "Lasten er undervejs"
                  : t.status === "delivered"
                    ? "Leveret og afregnet"
                    : "Kontrakten er afsluttet"}
            </h3>
            <p>
              Ekspeditør:{" "}
              {view.players.find((p) => p.id === winner.proposer)!.name}.
              Betaling {winner.offer} M. {modeNames[winner.mode]};{" "}
              {winner.insured ? "forsikret" : "uden forsikring"}.{" "}
              {winner.arrival ? "Ankomst runde " + winner.arrival + "." : ""}{" "}
              {winner.graceUsed
                ? "Den ene eksterne fristforlængelse er brugt."
                : ""}
            </p>
            <TermsTable {...{ view }} terms={winner} />
            {t.status === "awarded" && (
              <>
                <p>
                  Last og logistik er reserveret. Kun ekspeditøren bruger én
                  handling for at sende. Standard må ikke sendes i sidste runde.
                </p>
                {canPlayContact(view, me, "contact-stamp") &&
                  winner.proposer === seat && (
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={stamp}
                        onChange={(e) => setStamp(e.target.checked)}
                      />
                      Spil Manden med stemplet på min egen fragtbetaling
                    </label>
                  )}
                <div className="form-actions">
                  <BusyButton
                    disabled={
                      !active ||
                      winner.proposer !== seat ||
                      (winner.mode === "standard" &&
                        view.round === view.maxRounds) ||
                      (winner.mode !== "gray" &&
                        view.countries.find((c) => c.id === t.country)!
                          .sanctions)
                    }
                    onClick={() =>
                      send({
                        type: "transport",
                        tender: id,
                        ...(stamp ? { contact: "contact-stamp" as const } : {}),
                      })
                    }
                  >
                    Ekspedér lasten
                  </BusyButton>
                  <button
                    type="button"
                    className="secondary"
                    disabled={
                      view.phase !== "actions" ||
                      !!view.pending ||
                      !winner.pledges.some((p) => p.player === seat)
                    }
                    onClick={() => setEditor(true)}
                  >
                    Foreslå en fælles ændring
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <p>Ingen vinder er registreret på dette udbud.</p>
        )}
      </div>
    </div>
  );
}
export function TermsTable({
  view,
  terms,
  accepted,
}: {
  view: View;
  terms: Terms;
  accepted?: string[];
}) {
  return (
    <div className="table-scroll">
      <table className="terms-table">
        <thead>
          <tr>
            <th>Hus</th>
            <th>Last</th>
            <th>Log</th>
            <th>Fragt M</th>
            <th>Fors. M</th>
            <th>Indtægt %</th>
            <th>Ansvar %</th>
            {accepted && <th>Underskrift</th>}
          </tr>
        </thead>
        <tbody>
          {terms.pledges.map((p) => (
            <tr key={p.player}>
              <th>{view.players.find((x) => x.id === p.player)?.name}</th>
              <td>{p.quantity}</td>
              <td>{p.logistics}</td>
              <td>{p.freight}</td>
              <td>{p.insurance}</td>
              <td>{p.revenue}</td>
              <td>{p.liability}</td>
              {accepted && (
                <td>
                  {accepted.includes(p.player) ? "Underskrevet" : "Afventer"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function AgreementEditor({
  view,
  seat,
  send,
  open,
  tenderId,
  kind,
  existing,
  cancel,
}: Props & {
  tenderId: string;
  kind: "propose" | "amend" | "revise";
  existing?: Agreement;
  cancel: () => void;
}) {
  const t = view.tenders.find((t) => t.id === tenderId)!,
    winning = view.bids.find((b) => b.id === t.winner)?.details;
  const initial = existing ?? (kind === "amend" ? winning : undefined);
  const me = privatePlayer(view, seat),
    partner = view.players.find((p) => p.id !== seat)!;
  const initialRows = () => {
    if (initial) return initial.pledges.map((p) => ({ ...p }));
    const own = Math.min(freeGoods(view, me, t.good), t.quantity),
      other = t.quantity - own;
    return [
      {
        ...zeroPledge(seat),
        quantity: own,
        logistics: 1,
        freight: other ? 1 : 0,
        revenue: 50,
        liability: 50,
      },
      {
        ...zeroPledge(partner.id),
        quantity: other,
        freight: other ? 0 : 1,
        revenue: 50,
        liability: 50,
      },
    ];
  };
  const [rows, setRows] = useState<Pledge[]>(initialRows),
    [proposer, setProposer] = useState(initial?.proposer ?? seat),
    [offer, setOffer] = useState(initial?.offer ?? t.payout),
    [mode, setMode] = useState<Mode>(initial?.mode ?? "standard"),
    [insured, setInsured] = useState(initial?.insured ?? false),
    [priority, setPriority] = useState(initial?.priority ?? false);
  const sum = (
    key: keyof Pick<
      Pledge,
      | "quantity"
      | "logistics"
      | "freight"
      | "insurance"
      | "revenue"
      | "liability"
    >,
  ) => rows.reduce((n, p) => n + p[key], 0);
  const valid =
    rows.length >= (kind === "propose" ? 2 : 1) &&
    rows.some((p) => p.player === proposer) &&
    sum("quantity") === t.quantity &&
    sum("logistics") === modeLogistics({ mode, priority }) &&
    sum("freight") === modeFee(mode) &&
    sum("insurance") === (insured ? 1 : 0) &&
    sum("revenue") === 100 &&
    sum("liability") === 100 &&
    rows.every(
      (p) => p.quantity > 0 || p.logistics > 0 || p.freight + p.insurance > 0,
    ) &&
    offer >= 1 &&
    offer <= t.payout;
  const change = (id: string, key: keyof Pledge, value: number) =>
    setRows((rows) =>
      rows.map((p) => (p.player === id ? { ...p, [key]: value } : p)),
    );
  const shippingOwner = view.players.find((p) => p.id === proposer)!;
  return (
    <form
      className="agreement-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        const fields = { offer, mode, insured, priority, pledges: rows };
        const ok =
          kind === "revise"
            ? await send({ type: "revise", agreement: existing!.id, ...fields })
            : kind === "amend"
              ? await send({ type: "amend", tender: t.id, proposer, ...fields })
              : await send({ type: "propose", tender: t.id, ...fields });
        if (ok) open("agreements");
      }}
    >
      <h3>
        {kind === "propose"
          ? "Bind en aftale sammen"
          : kind === "amend"
            ? "Fælles ændring før ekspedition"
            : "Ret kladden / alle skal underskrive igen"}
      </h3>
      <p>
        {view.countries.find((c) => c.id === t.country)!.name} · {t.quantity}{" "}
        {GOOD_NAMES[t.good].toLowerCase()} · frist R{t.deadline}. En kladde
        reserverer intet. Den sidste underskrift validerer alle ressourcer
        samlet.
      </p>
      <div className="configuration-line">
        <label>
          Samlet kundebetaling
          <input
            aria-label="Konsortiets betaling"
            type="number"
            min={1}
            max={t.payout}
            value={offer}
            disabled={kind === "amend" || existing?.kind === "amendment"}
            onChange={(e) => setOffer(number(e.target.value))}
          />
        </label>
        <label>
          Ekspeditør
          <select
            value={proposer}
            disabled={kind !== "amend"}
            onChange={(e) => {
              setProposer(e.target.value);
              if (!rows.some((p) => p.player === e.target.value))
                setRows([...rows, zeroPledge(e.target.value)]);
            }}
          >
            {view.players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <ModePicker
        {...{ mode, setMode, insured, setInsured, priority, setPriority }}
        allowGray={view.scenario !== "intro"}
        allowPriority={
          shippingOwner.organizations.includes("org-priority") &&
          shippingOwner.used["org-priority"] !== view.round
        }
      />
      <div className="table-scroll">
        <table className="pledge-editor">
          <thead>
            <tr>
              <th>Med</th>
              <th>Hus</th>
              <th>Last</th>
              <th>Log</th>
              <th>Fragt M</th>
              <th>Fors. M</th>
              <th>Indtægt %</th>
              <th>Ansvar %</th>
            </tr>
          </thead>
          <tbody>
            {view.players.map((p) => {
              const row = rows.find((x) => x.player === p.id);
              return (
                <tr key={p.id}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={"Medtag " + p.name}
                      checked={!!row}
                      disabled={kind === "propose" && p.id === seat}
                      onChange={(e) =>
                        setRows(
                          e.target.checked
                            ? [...rows, zeroPledge(p.id)]
                            : rows.filter((x) => x.player !== p.id),
                        )
                      }
                    />
                  </td>
                  <th>
                    {p.name}
                    <small>
                      {p.inventoryCount} varer i alt ·{" "}
                      {p.logistics - p.reservedLogistics} fri log ·{" "}
                      {freeMoney(p)} M fri
                    </small>
                  </th>
                  {(
                    [
                      "quantity",
                      "logistics",
                      "freight",
                      "insurance",
                      "revenue",
                      "liability",
                    ] as const
                  ).map((key, i) => (
                    <td key={key}>
                      <input
                        aria-label={
                          p.name +
                          " / " +
                          [
                            "last",
                            "logistik",
                            "fragtbetaling",
                            "forsikringsbetaling",
                            "indtægtsandel",
                            "ansvarsandel",
                          ][i]
                        }
                        type="number"
                        min={0}
                        max={
                          i >= 4
                            ? 100
                            : key === "quantity"
                              ? 2
                              : key === "insurance"
                                ? 1
                                : 3
                        }
                        disabled={!row}
                        value={row?.[key] ?? 0}
                        onChange={(e) =>
                          change(p.id, key, number(e.target.value))
                        }
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>SUM / KRAV</td>
              <td>
                {sum("quantity")}/{t.quantity}
              </td>
              <td>
                {sum("logistics")}/{modeLogistics({ mode, priority })}
              </td>
              <td>
                {sum("freight")}/{modeFee(mode)}
              </td>
              <td>
                {sum("insurance")}/{insured ? 1 : 0}
              </td>
              <td>{sum("revenue")}/100</td>
              <td>{sum("liability")}/100</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {kind !== "amend" &&
        existing?.kind !== "amendment" &&
        rows.some((p) => p.player === seat) && (
          <label>
            Dit eget kontaktbilag
            <select
              value={rows.find((p) => p.player === seat)?.contact ?? ""}
              onChange={(e) =>
                setRows(
                  rows.map((p) =>
                    p.player === seat
                      ? {
                          ...p,
                          contact: (e.target.value ||
                            undefined) as Pledge["contact"],
                        }
                      : p,
                  ),
                )
              }
            >
              <option value="">Intet bilag</option>
              {me.contactsHand
                .filter(
                  (id) =>
                    ["contact-call", "contact-capacity"].includes(id) &&
                    canPlayContact(view, me, id),
                )
                .map((id) => (
                  <option key={id} value={id}>
                    {CARD[id].title}
                  </option>
                ))}
            </select>
          </label>
        )}
      <Callout title="Det, underskrifterne betyder">
        <p>
          Hver part lover last, nødvendig logistik eller mindst 1 M fragt/gyldig
          forsikring. Begge andelskolonner skal give 100 %. Rabatter kan frigive
          budget ved ekspedition; kun faktisk betalte penge tæller til
          personlige mål.
        </p>
        <p>
          Kontraktens {t.quantity + 1} prestige deles én gang efter
          indtægtsandelene. Bod 3 M deles efter ansvar. Andre huse ser kun dit
          samlede lager; du skal forhandle om deres konkrete varer.
        </p>
      </Callout>
      {!valid && (
        <p role="status" className="form-error">
          Fordelingen skal dække alle krav, have begge kolonner på 100 % og give
          alle et reelt bidrag.
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="secondary" onClick={cancel}>
          Tilbage
        </button>
        <button type="submit" className="primary" disabled={!valid}>
          {kind === "revise"
            ? "Gem nyt udkast og underskriv"
            : "Opret udkast og underskriv"}
        </button>
      </div>
    </form>
  );
}
export function Agreements({ view, seat, send, open }: Props) {
  const [edit, setEdit] = useState<Agreement | null>(null);
  if (edit)
    return (
      <AgreementEditor
        {...{ view, seat, send, open }}
        tenderId={edit.tender}
        kind="revise"
        existing={edit}
        cancel={() => setEdit(null)}
      />
    );
  const drafts = view.agreements.filter((a) => a.required.includes(seat));
  return (
    <>
      <p>
        Kladder binder intet. Indsendte underskrifter binder alle bidrag. En
        ændring erstatter tidligere samtykke; efter ekspedition er aftalen låst,
        bortset fra sanktionernes nødvalg.
      </p>
      {drafts.map((a) => (
        <section className="agreement-page" key={a.id}>
          <h3>
            {a.kind === "amendment" ? "Ændringsforslag" : "Konsortium"} /{" "}
            {view.tenders.find((t) => t.id === a.tender)?.card} /{" "}
            {a.status === "draft"
              ? "Afventer underskrifter"
              : a.status === "signed"
                ? "Underskrevet"
                : "Trukket tilbage"}
          </h3>
          <p>
            {a.offer} M · {modeNames[a.mode]} ·{" "}
            {a.insured ? "Forsikret" : "Uforsikret"} · ekspeditør{" "}
            {view.players.find((p) => p.id === a.proposer)!.name}
          </p>
          <TermsTable {...{ view }} terms={a} accepted={a.accepted} />
          {a.status === "draft" && (
            <>
              <div className="form-actions">
                <BusyButton
                  disabled={
                    a.accepted.includes(seat) ||
                    (a.kind === "bid" &&
                      (view.phase !== "negotiation" ||
                        view.ready.includes(seat))) ||
                    (a.kind === "amendment" && view.phase !== "actions") ||
                    !!view.pending
                  }
                  onClick={() => send({ type: "accept", agreement: a.id })}
                >
                  Underskriv aftalen
                </BusyButton>
                <BusyButton
                  className="secondary"
                  disabled={!!view.pending}
                  onClick={() => send({ type: "withdraw", agreement: a.id })}
                >
                  Træk mig fra kladden
                </BusyButton>
                {a.author === seat && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setEdit(a)}
                  >
                    Ret kladden
                  </button>
                )}
              </div>
              {a.kind === "bid" && a.pledges.some((p) => p.player === seat) && (
                <label>
                  Mit kontaktbilag / ændring nulstiller underskrifter
                  <select
                    value={
                      a.pledges.find((p) => p.player === seat)?.contact ?? ""
                    }
                    onChange={(e) =>
                      void send({
                        type: "attach-contact",
                        agreement: a.id,
                        contact: (e.target.value || null) as
                          | "contact-call"
                          | "contact-capacity"
                          | null,
                      })
                    }
                  >
                    <option value="">Intet bilag</option>
                    {privatePlayer(view, seat)
                      .contactsHand.filter(
                        (id) =>
                          ["contact-call", "contact-capacity"].includes(id) &&
                          canPlayContact(view, privatePlayer(view, seat), id),
                      )
                      .map((id) => (
                        <option key={id} value={id}>
                          {CARD[id].title}
                        </option>
                      ))}
                  </select>
                </label>
              )}
            </>
          )}
        </section>
      ))}
      {!drafts.length && (
        <Callout title="Ingen aftale i din mappe">
          <p>
            Åbn et offentligt udbud og vælg Dan konsortium. Du kan inddrage 2–5
            huse ved at fordele last, logistik, betaling og ansvar.
          </p>
        </Callout>
      )}
      <h3>Vundne kontrakter og fragt</h3>
      <div className="contract-links">
        {view.tenders
          .filter((t) =>
            ["awarded", "transit", "delivered", "failed"].includes(t.status),
          )
          .map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => open({ tender: t.id })}
            >
              <Icon name="boat" />
              {view.countries.find((c) => c.id === t.country)?.name} ·{" "}
              {t.quantity} {GOOD_NAMES[t.good]} ·{" "}
              {t.status === "awarded"
                ? "Afventer ekspedition"
                : t.status === "transit"
                  ? "Undervejs"
                  : t.status === "delivered"
                    ? "Leveret"
                    : "Mislykket"}{" "}
              · R{t.deadline}
            </button>
          ))}
      </div>
    </>
  );
}
const emptySide = (): TradeSide => ({
  goods: inventory(),
  cash: 0,
  contacts: [],
  discard: [],
});
export function Trades({ view, seat, send }: Omit<Props, "open">) {
  const me = privatePlayer(view, seat),
    [partner, setPartner] = useState(
      view.players.find((p) => p.id !== seat)!.id,
    ),
    [give, setGive] = useState<TradeSide>(emptySide),
    [receive, setReceive] = useState<TradeSide>(emptySide),
    [discard, setDiscard] = useState<Record<string, string[]>>({});
  const available =
    view.phase === "negotiation" && !view.ready.includes(seat) && !view.pending;
  const sideEditor = (
    side: TradeSide,
    set: (s: TradeSide) => void,
    own: boolean,
  ) => (
    <fieldset>
      <legend>{own ? "Jeg giver" : "Jeg beder om"}</legend>
      {GOODS.map((g) => (
        <label key={g}>
          {GOOD_NAMES[g]}
          <input
            type="number"
            min={0}
            max={own ? freeGoods(view, me, g) : 12}
            value={side.goods[g]}
            onChange={(e) =>
              set({
                ...side,
                goods: { ...side.goods, [g]: number(e.target.value) },
              })
            }
          />
        </label>
      ))}
      <label>
        Kontanter M
        <input
          type="number"
          min={0}
          max={own ? freeMoney(me) : 100}
          value={side.cash}
          onChange={(e) => set({ ...side, cash: number(e.target.value) })}
        />
      </label>
      <details>
        <summary>Navngivne kontaktkort</summary>
        {(own
          ? me.contactsHand
          : CARDS.filter((c) => c.family === "Contact").map((c) => c.id)
        ).map((id) => (
          <label key={id} className="check-label">
            <input
              type="checkbox"
              checked={side.contacts.includes(id)}
              onChange={(e) =>
                set({
                  ...side,
                  contacts: e.target.checked
                    ? [...side.contacts, id]
                    : side.contacts.filter((x) => x !== id),
                })
              }
            />
            {CARD[id].title}
          </label>
        ))}
      </details>
    </fieldset>
  );
  const afterOwn = [
    ...me.contactsHand.filter((id) => !give.contacts.includes(id)),
    ...receive.contacts,
  ];
  const cap = me.contacts + (me.organizations.includes("org-contacts") ? 1 : 0);
  const value = (s: TradeSide) =>
    s.cash + s.contacts.length + GOODS.reduce((n, g) => n + s.goods[g], 0);
  return (
    <>
      <p>
        Frie varer, kontakter og kontanter kan byttes nu. Penge må ikke gives
        gratis; handlen skal omfatte en nuværende vare eller kontakt. Point,
        gæld, mål og organisationer kan ikke overføres.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await send({ type: "trade", partner, give, receive });
        }}
      >
        <label>
          Modpart
          <select value={partner} onChange={(e) => setPartner(e.target.value)}>
            {view.players
              .filter((p) => p.id !== seat)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </label>
        <div className="trade-editor">
          {sideEditor(give, setGive, true)}
          {sideEditor(receive, setReceive, false)}
        </div>
        {afterOwn.length > cap && (
          <fieldset>
            <legend>
              Efter byttet skal du kassere {afterOwn.length - cap} kontaktkort
            </legend>
            {afterOwn.map((id) => (
              <label key={id} className="check-label">
                <input
                  type="checkbox"
                  checked={give.discard.includes(id)}
                  onChange={(e) =>
                    setGive({
                      ...give,
                      discard: e.target.checked
                        ? [...give.discard, id]
                        : give.discard.filter((x) => x !== id),
                    })
                  }
                />
                {CARD[id].title}
              </label>
            ))}
          </fieldset>
        )}
        <button
          type="submit"
          className="primary"
          disabled={!available || value(give) === 0 || value(receive) === 0}
        >
          Foreslå det private bytte
        </button>
      </form>
      <h3>Byttetilbud i din mappe</h3>
      {view.trades.map((t) => {
        const target = t.partner === seat;
        const ownGive = target ? t.receive : t.give,
          ownGet = target ? t.give : t.receive;
        const after = [
          ...me.contactsHand.filter((id) => !ownGive.contacts.includes(id)),
          ...ownGet.contacts,
        ];
        return (
          <section className="trade-offer" key={t.id}>
            <h4>
              {view.players.find((p) => p.id === t.proposer)!.name} ↔{" "}
              {view.players.find((p) => p.id === t.partner)!.name}
            </h4>
            <p>{tradeText(t, view)}</p>
            <p>
              Status:{" "}
              {t.status === "draft"
                ? "Åben"
                : t.status === "accepted"
                  ? "Gennemført"
                  : "Trukket tilbage"}
            </p>
            {t.status === "draft" && target && after.length > cap && (
              <fieldset>
                <legend>Vælg {after.length - cap} kort til afkast</legend>
                {after.map((id) => (
                  <label className="check-label" key={id}>
                    <input
                      type="checkbox"
                      checked={(discard[t.id] ?? []).includes(id)}
                      onChange={(e) =>
                        setDiscard({
                          ...discard,
                          [t.id]: e.target.checked
                            ? [...(discard[t.id] ?? []), id]
                            : (discard[t.id] ?? []).filter((x) => x !== id),
                        })
                      }
                    />
                    {CARD[id].title}
                  </label>
                ))}
              </fieldset>
            )}
            {t.status === "draft" && (
              <div className="form-actions">
                {target && (
                  <BusyButton
                    disabled={!available}
                    onClick={() =>
                      send({
                        type: "accept-trade",
                        trade: t.id,
                        discard: discard[t.id] ?? [],
                      })
                    }
                  >
                    Godkend og gennemfør byttet
                  </BusyButton>
                )}
                <BusyButton
                  className="secondary"
                  disabled={!available}
                  onClick={() => send({ type: "withdraw-trade", trade: t.id })}
                >
                  Træk byttet tilbage
                </BusyButton>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
function tradeText(t: Trade, view: View) {
  const side = (s: TradeSide) =>
    [
      ...GOODS.filter((g) => s.goods[g] > 0).map(
        (g) => s.goods[g] + " " + GOOD_NAMES[g].toLowerCase(),
      ),
      ...(s.cash ? [s.cash + " M"] : []),
      ...s.contacts.map((id) => CARD[id].title),
    ].join(", ");
  return `${view.players.find((p) => p.id === t.proposer)!.name} giver ${side(t.give)}. ${view.players.find((p) => p.id === t.partner)!.name} giver ${side(t.receive)}.`;
}
