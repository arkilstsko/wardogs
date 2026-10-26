import { ReferenceCards } from "./ReferenceCards";
import React, { useState } from "react";
import {
  CARD,
  CARDS,
  FIRMS,
  GOOD_NAMES,
  GOODS,
  PHASE_NAMES,
  objectiveBonus,
  scoreBreakdown,
  standings,
  type Family,
  type PublicPlayer,
  type View,
} from "../../../../packages/game-core/src/v1";
import manual from "../../../../docs/design/wardogs-v1/RULEBOOK-DA.md?raw";
import {
  BusyButton,
  Callout,
  CardFace,
  Die,
  FAMILY_NAMES,
  GOOD_ICON,
  HouseSeal,
  Icon,
} from "./primitives";
import {
  canAct,
  canPlayContact,
  freeGoods,
  freeMoney,
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
export function Market({ view, seat, send, open }: Props) {
  const p = privatePlayer(view, seat),
    active = canAct(view, seat),
    space = p.inventoryCount < p.storage;
  return (
    <>
      <p>
        Ét køb eller salg bruger én handling. Prisen flytter sig med én; en vare
        flyttes i den endelige pulje på 12. Dit lager er {p.inventoryCount}/
        {p.storage}, og du har {freeMoney(p)} M fri.
      </p>
      {!active && (
        <Callout title="Vent på din tur">
          Du kan undersøge markedet nu. Handler udføres i din egen
          handlingsfase.
        </Callout>
      )}
      <div className="market-book">
        {GOODS.map((g) => (
          <div key={g}>
            <Icon name={GOOD_ICON[g]} size={42} />
            <div>
              <h3>{GOOD_NAMES[g]}</h3>
              <p>
                {view.stock[g]} på markedet · {freeGoods(view, p, g)} af dine
                varer er fri
              </p>
            </div>
            <strong>{view.prices[g]} M</strong>
            <BusyButton
              disabled={
                !active ||
                !space ||
                view.stock[g] === 0 ||
                freeMoney(p) < view.prices[g]
              }
              onClick={() => send({ type: "acquire", good: g })}
            >
              Køb én
            </BusyButton>
            <BusyButton
              className="secondary"
              disabled={!active || freeGoods(view, p, g) === 0}
              onClick={() => send({ type: "sell", good: g })}
            >
              Sælg ·{" "}
              {Math.max(0, view.prices[g] - 1) +
                (p.organizations.includes("org-resale") &&
                p.used["org-resale"] !== view.round
                  ? 1
                  : 0)}{" "}
              M
            </BusyButton>
          </div>
        ))}
      </div>
      {view.scenario !== "intro" && (
        <section className="black-market-book">
          <h3>Det sorte tilbud</h3>
          {view.blackMarket ? (
            <>
              <p>
                Én {GOOD_NAMES[view.blackMarket.good].toLowerCase()} for{" "}
                {Math.max(1, view.prices[view.blackMarket.good] - 1)} M. Én
                handling og efterforskning +1. Varen kom fra fabriksreserven;
                markedsprisen ændres ikke.
              </p>
              <BusyButton
                disabled={
                  !active ||
                  !space ||
                  freeMoney(p) <
                    Math.max(1, view.prices[view.blackMarket.good] - 1)
                }
                onClick={() => send({ type: "black-buy" })}
              >
                Køb det sorte tilbud
              </BusyButton>
            </>
          ) : (
            <p>
              Tilbuddet er solgt, eller reserven kunne ikke levere en vare. Der
              er intet nyt tilbud i denne runde.
            </p>
          )}
        </section>
      )}
      {view.scenario !== "intro" && (
        <section>
          <h3>Organisationer / højst to pr. handelshus</h3>
          <div className="organization-book">
            {view.organizationRow.map((id) => (
              <div key={id}>
                <CardFace
                  id={id}
                  width={280}
                  onClick={() => open({ card: id })}
                />
                <BusyButton
                  disabled={
                    !active || p.organizations.length >= 2 || freeMoney(p) < 3
                  }
                  onClick={() => send({ type: "organization", card: id })}
                >
                  Køb for 3 M + én handling
                </BusyButton>
              </div>
            ))}
          </div>
          {!view.organizationRow.length && (
            <p>
              Organisationsmarkedet er udsolgt. Købte organisationer kommer ikke
              tilbage i bunken.
            </p>
          )}
        </section>
      )}
    </>
  );
}
export function Actions({ view, seat, send }: Props) {
  const p = privatePlayer(view, seat),
    active = canAct(view, seat);
  const [key, setKey] = useState(false);
  const temporary = view.bids
    .filter((b) => ["sealed", "awarded", "transit"].includes(b.status))
    .reduce(
      (n, b) =>
        n +
        (b.details?.pledges.filter(
          (x) => x.player === seat && x.contact === "contact-capacity",
        ).length ?? 0),
      0,
    );
  return (
    <>
      <p>
        {active ? "Det er din tur." : "Vent på din tur."} Du har {p.actions} af
        rundens tre fælles handlinger tilbage. Et indsendt bud har allerede
        brugt sin handling.
      </p>
      <div className="action-book">
        <Callout title="Kontorarbejde / +2 M">
          <p>Én gang pr. runde. Almindelig indtjening, ingen gæld.</p>
          <BusyButton
            disabled={!active || p.used.office === view.round}
            onClick={() => send({ type: "office" })}
          >
            Arbejd på kontoret
          </BusyButton>
        </Callout>
        <Callout title="Udvid logistik / 2 M">
          <p>
            Kapacitet {p.logistics} og {temporary} midlertidig. Det samlede loft
            er 3.
          </p>
          {canPlayContact(view, p, "contact-key") && (
            <label className="check-label">
              <input
                type="checkbox"
                checked={key}
                onChange={(e) => setKey(e.target.checked)}
              />
              Spil En anden nøglering: betal 1 M
            </label>
          )}
          <BusyButton
            disabled={
              !active ||
              p.logistics + temporary >= 3 ||
              freeMoney(p) < (key ? 1 : 2)
            }
            onClick={() =>
              send({
                type: "network",
                upgrade: "logistics",
                ...(key ? { contact: "contact-key" as const } : {}),
              })
            }
          >
            Udvid logistikken
          </BusyButton>
        </Callout>
        <Callout title="Revision / efterforskning −2">
          <p>
            Pris{" "}
            {p.organizations.includes("org-audit") &&
            p.used["org-audit"] !== view.round
              ? 0
              : 1}{" "}
            M. Efterforskning er nu {p.investigation}.
          </p>
          <BusyButton
            disabled={
              !active ||
              p.investigation === 0 ||
              freeMoney(p) <
                (p.organizations.includes("org-audit") &&
                p.used["org-audit"] !== view.round
                  ? 0
                  : 1)
            }
            onClick={() => send({ type: "audit" })}
          >
            Gennemfør revision
          </BusyButton>
        </Callout>
        <Callout title="Lån / +3 M">
          <p>
            Gæld {p.debt}/9. Gælden koster vedligeholdelse og trækkes fra
            formuen ved slutningen.
          </p>
          <BusyButton
            disabled={!active || p.debt > 6}
            onClick={() => send({ type: "refinance", repay: false })}
          >
            Lån 3 M
          </BusyButton>
        </Callout>
        <Callout title="Afdrag / betal 3 M">
          <p>
            Reducér gælden med 3. Afdrag registreres til målet Tilbage på egne
            ben.
          </p>
          <BusyButton
            disabled={!active || p.debt < 3 || freeMoney(p) < 3}
            onClick={() => send({ type: "refinance", repay: true })}
          >
            Afdrag 3 M
          </BusyButton>
        </Callout>
        {view.scenario !== "intro" && (
          <>
            <Callout title="Udvid kontakter / 2 M">
              <p>
                Kontaktspor {p.contacts}/3. Forøg sporet og træk ét kort, hvis
                bunken kan levere.
              </p>
              <BusyButton
                disabled={!active || p.contacts >= 3 || freeMoney(p) < 2}
                onClick={() => send({ type: "network", upgrade: "contacts" })}
              >
                Udvid kontakterne
              </BusyButton>
            </Callout>
            <Callout title="Hent kontakt / 1 M">
              <p>
                Træk ét kontaktkort uden at øge sporet. Håndgrænsen er{" "}
                {p.contacts +
                  (p.organizations.includes("org-contacts") ? 1 : 0)}
                .
              </p>
              <BusyButton
                disabled={
                  !active ||
                  freeMoney(p) < 1 ||
                  p.contactCount >=
                    p.contacts +
                      (p.organizations.includes("org-contacts") ? 1 : 0) ||
                  view.deckCounts.contacts + view.discardedContacts.length === 0
                }
                onClick={() => send({ type: "draw-contact" })}
              >
                Hent en kontakt
              </BusyButton>
            </Callout>
          </>
        )}
        <Callout title="Sanering / én gang pr. spil" danger>
          <p>
            Gæld mindst 6 og kasse under 3. Gæld −3 og kasse +6 M. Permanent −4
            slutpoint; tæller ikke som afdrag.
          </p>
          <BusyButton
            disabled={!active || p.restructured || p.debt < 6 || p.cash >= 3}
            onClick={() => send({ type: "restructure" })}
          >
            Sanér med −4 slutpoint
          </BusyButton>
        </Callout>
        <Callout title="Pas / brug én handling">
          <p>
            Ingen betaling og ingen anden virkning. Andre huse fortsætter i
            turorden.
          </p>
          <BusyButton
            className="secondary"
            disabled={!active}
            onClick={() => send({ type: "pass" })}
          >
            Pas én handling
          </BusyButton>
        </Callout>
      </div>
    </>
  );
}
export function CountryBook({
  id,
  view,
  seat,
  send,
  open,
}: Props & { id: string }) {
  const c = view.countries.find((c) => c.id === id)!;
  const p = privatePlayer(view, seat),
    active = canAct(view, seat),
    discount =
      p.organizations.includes("org-diplomacy") &&
      p.used["org-diplomacy"] !== view.round;
  return (
    <div className="country-book">
      <CardFace
        id={"leader-" + id}
        width={315}
        back={c.leader === 1}
        onClick={() => open({ card: "leader-" + id, back: c.leader === 1 })}
      />
      <div>
        <h3>{c.name}</h3>
        <p>
          Region: {c.region}. Holdning:{" "}
          {c.stance === "open"
            ? "Åben"
            : c.stance === "guarded"
              ? "Reserveret"
              : "Neutral"}
          .
        </p>
        <dl className="ruled-facts">
          <div>
            <dt>Stabilitet</dt>
            <dd>{c.stability}/6</dd>
          </div>
          <div>
            <dt>Efterspørgsel</dt>
            <dd>{c.demand}/6</dd>
          </div>
          <div>
            <dt>Din relation</dt>
            <dd>{p.relationships[id] ?? 0}/3</dd>
          </div>
          <div>
            <dt>Landets adgang</dt>
            <dd>{c.sanctions ? "Sanktioneret" : "Åbent"}</dd>
          </div>
        </dl>
        {c.sanctions && (
          <Callout title="Sanktioner gælder stadig" danger>
            <p>
              Lovlig ekspedition er blokeret. Ældre sanktioner ophæves i en
              verdensfase, hvis stabiliteten er mindst 2. Indflydelse fjerner
              ikke flaget med det samme.
            </p>
          </Callout>
        )}
        <div className="form-actions">
          <BusyButton
            disabled={
              !active ||
              (p.relationships[id] ?? 0) >= 3 ||
              freeMoney(p) < (discount ? 1 : 2)
            }
            onClick={() => send({ type: "influence", country: id })}
          >
            Indflydelse · {discount ? 1 : 2} M
          </BusyButton>
          <BusyButton
            className="secondary"
            disabled={!active || freeMoney(p) < 3}
            onClick={() => send({ type: "unrest", country: id })}
          >
            Politisk pres · 3 M
          </BusyButton>
        </div>
        <p>
          Pres giver stabilitet −2, efterspørgsel +1, din efterforskning +2 og
          dit omdømme −1. Ved stabilitet 0 skifter lederen, stabiliteten bliver
          3, alle relationer falder én, og sanktioner gælder resten af runden.
        </p>
        <h3>Husenes relationer</h3>
        <ul className="plain-list">
          {view.players.map((p) => (
            <li key={p.id}>
              {p.name}: {p.relationships[id] ?? 0}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
const PROGRESS: Record<string, (p: PublicPlayer) => string> = {
  "objective-legitimate": (p) =>
    `${p.deliveries.filter((d) => d.legal).length}/3 lovlige leverancer · EF ${p.investigation}`,
  "objective-diplomat": (p) =>
    `${Object.values(p.relationships).filter((n) => n >= 2).length}/3 lande med relation mindst 2`,
  "objective-consortium": (p) =>
    `${p.deliveries.filter((d) => d.consortium).length}/2 konsortieleverancer`,
  "objective-exporter": (p) =>
    `${new Set(p.deliveries.map((d) => d.country)).size}/3 destinationer`,
  "objective-tonnage": (p) =>
    `${p.deliveries.reduce((n, d) => n + d.ownCargo, 0)}/4 egne vareenheder`,
  "objective-regions": (p) =>
    `${new Set(p.deliveries.map((d) => d.region)).size}/2 handelsregioner`,
  "objective-ledger": (p) =>
    `${p.deliveries.length} leverancer · kasse ${p.cash}/18 M · gæld ${p.debt}`,
  "objective-repay": (p) => `${p.repaid}/6 M afdraget · gæld ${p.debt}`,
  "objective-broker": (p) =>
    `${p.deliveries.filter((d) => d.ownCargo === 0 && (d.logistics > 0 || d.cashPaid > 0)).length}/2 fragter med dit bidrag uden egne varer`,
  "objective-home": (p) =>
    p.deliveries.some((d) => (p.relationships[d.country] ?? 0) === 3)
      ? "Levering og relation 3 i samme land"
      : "Kræver levering og relation 3 i samme land",
  "objective-gray": (p) =>
    `${p.deliveries.some((d) => d.legal) ? 1 : 0}/1 lovlig · ${p.deliveries.some((d) => !d.legal) ? 1 : 0}/1 grå · EF ${p.investigation}/1`,
  "objective-mixed": (p) =>
    `${GOODS.filter((g) => p.deliveries.some((d) => d.good === g && d.ownCargo > 0)).length}/4 varetyper selv leveret`,
};
export function PrivateBook({ view, seat, send, open }: Props) {
  const p = privatePlayer(view, seat);
  return (
    <>
      <h3>{p.name} / din private mappe</h3>
      {p.objective ? (
        <div className="private-goal">
          <CardFace
            id={p.objective}
            width={315}
            onClick={() => open({ card: p.objective! })}
          />
          <div>
            <h3>{CARD[p.objective].title}</h3>
            <p>{CARD[p.objective].body}</p>
            <p>
              <strong>{PROGRESS[p.objective](p)}</strong>
            </p>
            <p>
              {objectiveBonus({ ...p, objective: p.objective })
                ? `Kravet er opfyldt nu: +${CARD[p.objective].reward} point, hvis det stadig gælder ved slutningen.`
                : "Ingen delbonus. Kravet bedømmes efter sidste rundes frister og kontrol."}
            </p>
          </div>
        </div>
      ) : (
        <p>Introduktionen bruger ikke hemmelige mål.</p>
      )}
      <h3>Dine kontakter / højst ét kort pr. fase</h3>
      <div className="private-contacts">
        {p.contactsHand.map((id) => (
          <div key={id}>
            <CardFace id={id} width={280} onClick={() => open({ card: id })} />
            {((id === "contact-chain" && view.phase === "world") ||
              (id === "contact-lunch" && view.phase === "income")) &&
              !view.resolving && (
                <BusyButton
                  disabled={!canPlayContact(view, p, id)}
                  onClick={() => send({ type: "contact", card: id })}
                >
                  Spil {CARD[id].title}
                </BusyButton>
              )}
            <p>{CARD[id].timing}</p>
          </div>
        ))}
      </div>
      {!p.contactsHand.length && (
        <p>
          Din kontakthånd er tom. Hent et kort i handlinger, eller vent på
          verdensfasens normale opfyldning.
        </p>
      )}
      <h3>Organisationer</h3>
      <div className="private-contacts">
        {p.organizations.map((id) => (
          <CardFace
            key={id}
            id={id}
            width={280}
            onClick={() => open({ card: id })}
          />
        ))}
      </div>
      {!p.organizations.length && <p>Du ejer endnu ingen organisationer.</p>}
    </>
  );
}
export function Reaction({ view, seat, send }: Omit<Props, "open">) {
  const pending = view.pending!;
  const me = privatePlayer(view, seat),
    owner = view.players.find((p) => p.id === pending.player)!;
  const [payments, setPayments] = useState<Record<string, number>>({
    [pending.player]: 2,
  });
  if (pending.kind === "sanction") {
    const t = view.tenders.find((t) => t.id === pending.tender)!,
      b = view.bids.find((b) => b.id === t.winner)!.details!,
      party = b.pledges.some((p) => p.player === seat);
    return (
      <>
        <h3>Ordren står. Grænsen er lukket.</h3>
        <p>
          {view.countries.find((c) => c.id === t.country)?.name} er
          sanktioneret. Kontrakten har frist i runde {t.deadline}. Vent uden
          fristforlængelse eller aftal en grå omlægning.
        </p>
        <Callout title="Grå omlægning / samlet 2 M" danger>
          <p>
            Alle deltagere skal samtykke. Hver får efterforskning +2;
            forsikringen bortfalder uden refusion. Ét fælles gråt slag afgør
            fragten.
          </p>
        </Callout>
        {pending.proposal ? (
          <>
            <table>
              <thead>
                <tr>
                  <th>Hus</th>
                  <th>Betaler</th>
                  <th>Samtykke</th>
                </tr>
              </thead>
              <tbody>
                {b.pledges.map((x) => (
                  <tr key={x.player}>
                    <td>{view.players.find((p) => p.id === x.player)!.name}</td>
                    <td>
                      {pending.proposal!.payments.find(
                        (p) => p.player === x.player,
                      )?.amount ?? 0}{" "}
                      M
                    </td>
                    <td>
                      {pending.proposal!.accepted.includes(x.player)
                        ? "Godkendt"
                        : "Afventer"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {party && (
              <div className="form-actions">
                <BusyButton
                  disabled={pending.proposal.accepted.includes(seat)}
                  onClick={() => send({ type: "reroute", choice: "accept" })}
                >
                  Samtyk til omlægningen
                </BusyButton>
                <BusyButton
                  className="secondary"
                  onClick={() => send({ type: "reroute", choice: "wait" })}
                >
                  Lad lasten vente
                </BusyButton>
              </div>
            )}
          </>
        ) : seat === b.proposer ? (
          <>
            <div className="reroute-payments">
              {b.pledges.map((x) => (
                <label key={x.player}>
                  {view.players.find((p) => p.id === x.player)!.name}
                  <input
                    aria-label={
                      "Omlægningsbetaling " +
                      view.players.find((p) => p.id === x.player)!.name
                    }
                    type="number"
                    min={0}
                    max={2}
                    value={payments[x.player] ?? 0}
                    onChange={(e) =>
                      setPayments({
                        ...payments,
                        [x.player]: Number(e.target.value),
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="form-actions">
              <BusyButton
                disabled={
                  Object.values(payments).reduce((n, v) => n + v, 0) !== 2
                }
                onClick={() =>
                  send({
                    type: "reroute",
                    choice: "propose",
                    payments: b.pledges.map((x) => ({
                      player: x.player,
                      amount: payments[x.player] ?? 0,
                    })),
                  })
                }
              >
                Foreslå grå omlægning
              </BusyButton>
              <BusyButton
                className="secondary"
                onClick={() => send({ type: "reroute", choice: "wait" })}
              >
                Lad lasten vente
              </BusyButton>
            </div>
          </>
        ) : (
          <p>
            Ekspeditøren vælger først. Du skal selv samtykke, før en omlægning
            kan gennemføres.
          </p>
        )}
      </>
    );
  }
  if (seat !== pending.player)
    return (
      <Callout title={"Afventer " + owner.name}>
        <p>
          Det er dette hus, der har et åbent valg. Kortene i dets hånd er
          private.
        </p>
      </Callout>
    );
  if (pending.kind === "chain")
    return (
      <>
        <h3>Telefonkæden / behold højst ét</h3>
        <div className="private-contacts">
          {pending.cards.map((id) => (
            <div key={id}>
              <CardFace id={id} width={280} />
              <BusyButton
                onClick={() => send({ type: "choose-chain", card: id })}
              >
                Behold dette kort
              </BusyButton>
            </div>
          ))}
        </div>
        <BusyButton
          className="secondary"
          onClick={() => send({ type: "choose-chain", card: null })}
        >
          Kassér de trukne kort
        </BusyButton>
      </>
    );
  const titles = {
    world: "Før morgennyheden",
    loss: pending.kind === "loss" ? pending.reason : "Betaling",
    "before-enforcement": "Før din efterforskningskontrol",
    enforcement: "Dit efterforskningsslag",
    delay: "En ekstern forsinkelse",
    coffee: "Efter jeres konsortielevering",
    tie: "Et sidste bilag før budligheden afgøres",
  };
  const expected: Record<string, string> = {
    world: "contact-chain",
    loss: "contact-paid",
    "before-enforcement": "contact-record",
    enforcement: "contact-reroll",
    delay: "contact-paragraph",
    coffee: "contact-coffee",
    tie: "contact-tie",
  };
  const choices = [
    expected[pending.kind],
    ...(pending.kind === "loss" && pending.category === "maintenance"
      ? ["contact-lunch"]
      : []),
  ].filter((id) => canPlayContact(view, me, id));
  return (
    <>
      <h3>{titles[pending.kind]}</h3>
      {pending.kind === "loss" && (
        <p>
          Du skal afregne {pending.amount} M. Frie kontanter betales først; en
          rest går til gæld og derefter prestige. Bundet fragtbudget røres ikke.
        </p>
      )}
      {pending.kind === "before-enforcement" && (
        <p>
          Din efterforskning er {me.investigation}. D6 højst sporet udløser
          konfiskation af en fri vare, 2 M og ét omdømme.
        </p>
      )}
      {pending.kind === "enforcement" && (
        <div className="roll-result">
          <Die value={pending.roll} />
          <p>
            Slag {pending.roll} mod efterforskning {me.investigation}.{" "}
            {pending.roll <= me.investigation
              ? "Kontrollen rammer."
              : "Kontrollen passerer."}
          </p>
        </div>
      )}
      {pending.kind === "delay" && (
        <p>
          Én standardfragt forsinkes. Højst én fristforlængelse pr. kontrakt; i
          sidste runde erstattes forsinkelsen af 1 M.
        </p>
      )}
      {pending.kind === "world" && (
        <p>
          Du kan bruge et kontaktkort i det trykte verdensvindue, før
          morgennyheden bliver kendt.
        </p>
      )}
      {pending.kind === "coffee" && (
        <p>Du har bidraget meningsfuldt til en vellykket konsortielevering.</p>
      )}
      {pending.kind === "tie" && (
        <p>
          Dit bud er blandt de billigste med højest effektiv relation. Bilaget
          kan give +1 effektivt omdømme i denne lighed.
        </p>
      )}
      <div className="reaction-cards">
        {choices.map((id) => (
          <div key={id}>
            <CardFace id={id} width={250} />
            <BusyButton
              onClick={() =>
                send({
                  type: "reaction",
                  use: true,
                  ...(pending.kind === "loss"
                    ? { card: id as "contact-paid" | "contact-lunch" }
                    : {}),
                })
              }
            >
              Spil {CARD[id].title}
            </BusyButton>
          </div>
        ))}
      </div>
      {!choices.length && (
        <p>
          Ingen kontakt i din hånd kan bruges i dette vindue. Du kan fortsætte
          uden kort.
        </p>
      )}
      <BusyButton
        className="secondary"
        onClick={() => send({ type: "reaction", use: false })}
      >
        {pending.kind === "before-enforcement"
          ? "Slå kontrollens D6"
          : pending.kind === "enforcement"
            ? "Brug dette slag"
            : "Fortsæt uden kontakt"}
      </BusyButton>
    </>
  );
}
function inline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((x, i) =>
      x.startsWith("**") ? <strong key={i}>{x.slice(2, -2)}</strong> : x,
    );
}
export function Manual() {
  return (
    <article className="manual">
      {manual
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          if (/^#+ /.test(block)) {
            const title = block.replace(/^#+ /, "");
            return block.startsWith("###") ? (
              <h4 key={i}>{title}</h4>
            ) : (
              <h3 key={i}>{title}</h3>
            );
          }
          if (block.startsWith("|")) {
            const rows = block
              .split("\n")
              .filter((s) => !/^\|[\s|:-]+$/.test(s))
              .map((s) =>
                s
                  .replace(/^\||\|$/g, "")
                  .split("|")
                  .map((s) => s.trim()),
              );
            return (
              <div className="table-scroll" key={i}>
                <table>
                  <thead>
                    <tr>
                      {rows[0].map((s, j) => (
                        <th key={j}>{inline(s)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(1).map((r, j) => (
                      <tr key={j}>
                        {r.map((s, k) => (
                          <td key={k}>{inline(s)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
          if (/^\d+\. /.test(block))
            return (
              <ol key={i}>
                {block.split("\n").map((s, j) => (
                  <li key={j}>{inline(s.replace(/^\d+\. /, ""))}</li>
                ))}
              </ol>
            );
          if (block.startsWith("- "))
            return (
              <ul key={i}>
                {block.split("\n").map((s, j) => (
                  <li key={j}>{inline(s.replace(/^- /, ""))}</li>
                ))}
              </ul>
            );
          return <p key={i}>{inline(block.replace(/\n/g, " "))}</p>;
        })}
    </article>
  );
}
export function Catalogue({ open }: { open: (f: Folio) => void }) {
  const [family, setFamily] = useState<Family | "">(""),
    [search, setSearch] = useState("");
  const cards = CARDS.filter(
    (c) =>
      (!family || c.family === family) &&
      `${c.title} ${c.body} ${c.collectorCode}`
        .toLocaleLowerCase("da")
        .includes(search.toLocaleLowerCase("da")),
  );
  return (
    <>
      <div className="catalogue-controls">
        <label>
          Kortfamilie
          <select
            value={family}
            onChange={(e) => setFamily(e.target.value as Family | "")}
          >
            <option value="">Alle 12 familier</option>
            {Object.entries(FAMILY_NAMES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Find et kort
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Titel, nummer eller regeltekst"
          />
        </label>
      </div>
      <p>
        {cards.length} af 180 hovedkort. Vareeksemplarer og spillerreferencer
        gentages med vilje. Hertil kommer otte rundekort og fire scenariekort.
      </p>
      <div className="catalogue-grid">
        {cards.map((c) => (
          <CardFace
            key={c.id}
            id={c.id}
            width={236}
            onClick={() => open({ card: c.id })}
          />
        ))}
      </div>
      {!cards.length && (
        <p>
          Ingen kort matcher søgningen. Prøv et andet ord eller en anden
          familie.
        </p>
      )}
      <ReferenceCards />
    </>
  );
}
export function Ledger({ view }: { view: View }) {
  return (
    <ol className="journal">
      {view.log
        .slice()
        .reverse()
        .map((l) => (
          <li key={l.seq}>
            <span>
              R{l.round} ·{" "}
              {l.phase === "setup" ? "Opsætning" : PHASE_NAMES[l.phase]}
            </span>
            <p>{l.text}</p>
            {l.roll && <Die value={l.roll} />}
          </li>
        ))}
    </ol>
  );
}
export function PublicHouse({ id, view }: { id: string; view: View }) {
  const p = view.players.find((p) => p.id === id)!;
  return (
    <>
      <div className="house-book-heading">
        <HouseSeal firm={p.firm} size={72} />
        <div>
          <h3>{p.name}</h3>
          <p>{FIRMS[p.firm].motto}</p>
        </div>
      </div>
      <dl className="ruled-facts">
        <div>
          <dt>Kasse / fri</dt>
          <dd>
            {p.cash} / {freeMoney(p)} M
          </dd>
        </div>
        <div>
          <dt>Gæld</dt>
          <dd>{p.debt}/9</dd>
        </div>
        <div>
          <dt>Prestige</dt>
          <dd>{p.prestige}</dd>
        </div>
        <div>
          <dt>Efterforskning</dt>
          <dd>{p.investigation}/6</dd>
        </div>
        <div>
          <dt>Logistik / bundet</dt>
          <dd>
            {p.logistics} / {p.reservedLogistics}
          </dd>
        </div>
        <div>
          <dt>Omdømme</dt>
          <dd>{p.reputation}/3</dd>
        </div>
        <div>
          <dt>Varer / reserveret</dt>
          <dd>
            {p.inventoryCount} / {p.reservedCargo}
          </dd>
        </div>
        <div>
          <dt>Kontaktkort</dt>
          <dd>{p.contactCount}</dd>
        </div>
      </dl>
      <h3>Relationer</h3>
      <ul className="plain-list">
        {view.countries.map((c) => (
          <li key={c.id}>
            {c.name}: {p.relationships[c.id] ?? 0}
          </li>
        ))}
      </ul>
      <p>
        {p.deliveries.length} meningsfulde leverancer.{" "}
        {p.restructured ? "Har saneret: −4 slutpoint." : ""}
      </p>
      <p>
        Varesammensætning, kontaktidentiteter og hemmeligt mål er private frem
        til slutregnskabet.
      </p>
    </>
  );
}
export function Results({ view, seat }: Pick<Props, "view" | "seat">) {
  const me = privatePlayer(view, seat);
  if (!view.finished) {
    const score = scoreBreakdown(
      { config: { scenario: view.scenario } },
      { ...me, objective: me.objective ?? null },
    );
    return (
      <>
        <h3>Dit foreløbige regnskab / {score.total} point</h3>
        <p>
          Dette er kun dit eget øjebliksbillede. Mål, gæld, efterforskning og
          kontrakter kan stadig ændre slutresultatet.
        </p>
        <ScoreTable rows={[{ ...score, name: me.name, rank: 1 }]} />
      </>
    );
  }
  const players = view.players.map((p) => {
    if (!p.inventory || p.objective === undefined)
      throw new Error("Slutregnskabet mangler afslørede hænder.");
    return { ...p, inventory: p.inventory, objective: p.objective };
  });
  const rows = standings({ config: { scenario: view.scenario }, players });
  const names = rows.filter((r) => r.rank === 1).map((r) => r.name);
  const awardSpecs = [
    ["Årets bortforklaring", (p: PublicPlayer) => p.metrics.finesPaid],
    ["Formularens ven", (p: PublicPlayer) => p.metrics.audits],
    ["Kontoret lukker aldrig", (p: PublicPlayer) => p.deliveries.length],
    ["Vi ringer tilbage", (p: PublicPlayer) => p.metrics.withdrawals],
    [
      "Alle kender nogen",
      (p: PublicPlayer) =>
        new Set(p.deliveries.flatMap((d) => d.partners)).size,
    ],
  ] as const;
  return (
    <>
      <h3>
        {names.join(" og ")} {names.length > 1 ? "deler sejren" : "vinder"}
      </h3>
      <p>
        Alle frister, tab, forsikringer og personlige kontroller er afregnet.
        Ved lige point tæller prestige, mindst efterforskning og kasse. Derefter
        deles sejren.
      </p>
      <ScoreTable rows={rows} />
      <details>
        <summary>Regnskabets rå værdier</summary>
        <table>
          <thead>
            <tr>
              <th>Hus</th>
              <th>Penge</th>
              <th>Varer</th>
              <th>Gæld</th>
              <th>Mål</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.cash}</td>
                <td>{p.inventoryCount}</td>
                <td>{p.debt}</td>
                <td>{p.objective ? CARD[p.objective].title : "Intet mål"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
      <h3>Aftenens hædersbevisninger</h3>
      <p>Disse omtaler giver ingen point.</p>
      <ul>
        {awardSpecs.map(([title, metric]) => {
          const max = Math.max(...view.players.map(metric));
          return max > 0 ? (
            <li key={title}>
              <strong>{title}:</strong>{" "}
              {view.players
                .filter((p) => metric(p) === max)
                .map((p) => p.name)
                .join(" og ")}{" "}
              / {max}
            </li>
          ) : null;
        })}
      </ul>
    </>
  );
}
function ScoreTable({
  rows,
}: {
  rows: Array<{
    name: string;
    rank: number;
    wealth: number;
    prestige: number;
    relations: number;
    objective: number;
    investigation: number;
    restructure: number;
    scenario: number;
    total: number;
  }>;
}) {
  return (
    <div className="table-scroll">
      <table className="score-table">
        <thead>
          <tr>
            <th>Hus</th>
            <th>Formue</th>
            <th>Prestige</th>
            <th>Rel.</th>
            <th>Mål</th>
            <th>EF</th>
            <th>Sanering</th>
            <th>Scenarie</th>
            <th>Point</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}>
              <th>
                {r.rank} / {r.name}
              </th>
              <td>{r.wealth}</td>
              <td>{r.prestige}</td>
              <td>{r.relations}</td>
              <td>{r.objective}</td>
              <td>{r.investigation}</td>
              <td>{r.restructure}</td>
              <td>{r.scenario}</td>
              <td>
                <strong>{r.total}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
