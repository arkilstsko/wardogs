import {
  CATALOGUE,
  PHASE_NAMES,
  PHASES,
} from "../../../../packages/game-core/src/v1";
import { Icon } from "./primitives";

export function ReferenceCards() {
  return (
    <section className="reference-catalogue">
      <h3>Otte rundekort</h3>
      <div className="reference-grid">
        {Array.from({ length: 8 }, (_, i) => (
          <article className="reference-face" key={i}>
            <p className="reference-band">
              RUNDEKORT / {String(i + 1).padStart(2, "0")}
            </p>
            <h4>RUNDE {String(i + 1).padStart(2, "0")}</h4>
            <Icon name="scroll" size={54} />
            <ol>
              {PHASES.map((p) => (
                <li key={p}>
                  <strong>{PHASE_NAMES[p]}</strong>
                </li>
              ))}
            </ol>
            <p>
              {i === 0
                ? "Startkontakterne er allerede fordelt. Spring verdensfasens normale kontaktopfyldning over."
                : i === 5
                  ? "Slutregnskab i Første sending og Fragtkrisen. Standard og Valgår fortsætter til runde 8."
                  : i === 7
                    ? "Sidste runde. Ingen ny standardfragt. Afregn frister og kontrol, og afslør alle mål."
                    : "Bevar bundet last og logistik. Næste førstespiller overtager efter regnskabet."}
            </p>
            <footer>WARDOGS / R-{String(i + 1).padStart(2, "0")} · V1.0</footer>
          </article>
        ))}
      </div>
      <h3>Fire scenariekort</h3>
      <div className="reference-grid scenario-reference">
        {CATALOGUE.scenarios.map((s, i) => (
          <article className="reference-face" key={s.id}>
            <p className="reference-band">SCENARIE / {s.rounds} RUNDER</p>
            <h4>{s.title}</h4>
            <Icon name="globe-hemisphere-west" size={54} />
            <ul>
              {s.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <footer>WARDOGS / S-{String(i + 1).padStart(2, "0")} · V1.0</footer>
          </article>
        ))}
      </div>
    </section>
  );
}
