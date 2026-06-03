import { Sparkles } from "lucide-react";
import { RITUAL_NETWORK } from "@/lib/ritual";

interface Props {
  eligible: boolean;
}

/**
 * Ritual Status card — only visible to players who are gSiggy-eligible.
 *
 * Today this is purely informational: the "Record on Ritual" button is
 * disabled. When the testnet integration ships, wire the click handler to
 * `recordAchievement` from `@/lib/ritual` — no UI changes required.
 */
export function RitualCard({ eligible }: Props) {
  if (!eligible) return null;

  return (
    <section className="ritual" aria-label="Ritual Status">
      <header className="ritual__head">
        <div className="ritual__title">
          <Sparkles size={16} />
          <span>Ritual Status</span>
        </div>
        <span className="ritual__chip">{RITUAL_NETWORK}</span>
      </header>

      <dl className="ritual__rows">
        <div className="ritual__row">
          <dt>Network</dt>
          <dd>{RITUAL_NETWORK}</dd>
        </div>
        <div className="ritual__row">
          <dt>Achievement</dt>
          <dd className="is-eligible">Eligible</dd>
        </div>
      </dl>

      <button
        className="ritual__btn"
        disabled
        aria-disabled="true"
        title="Your Legendary achievement will soon be recordable on Ritual testnet."
      >
        Record on Ritual (Coming Soon)
      </button>
      <p className="ritual__hint">
        Your Legendary achievement will soon be recordable on Ritual testnet.
      </p>
    </section>
  );
}
