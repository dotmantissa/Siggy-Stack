import { Check, Lock } from "lucide-react";
import { TIER_MILESTONES, tierStates } from "@/lib/achievements";

interface Props {
  bestTier: number;
}

// Visual milestone path: DOGE → PEPE → SOL → ETH → BTC → LEGENDARY.
// Each node renders in one of three states (completed / current / locked).
export function ProgressionPath({ bestTier }: Props) {
  const states = tierStates(bestTier);

  return (
    <section className="prog">
      <header className="prog__head">
        <span className="prog__title">Progression</span>
        <span className="prog__hint">Climb the tiers · unlock Ritual Legend</span>
      </header>
      <ol className="prog__path">
        {TIER_MILESTONES.map((m, i) => {
          const state = states[i];
          const isLegendary = m.coin === "LEGENDARY";
          return (
            <li
              key={m.coin}
              className={`prog__node prog__node--${state} ${
                isLegendary ? "prog__node--legendary" : ""
              }`}
            >
              <div className="prog__dot" aria-hidden>
                {state === "completed" ? (
                  <Check size={12} strokeWidth={3} />
                ) : state === "locked" ? (
                  <Lock size={10} />
                ) : (
                  <span className="prog__dot-pulse" />
                )}
              </div>
              <div className="prog__meta">
                <span className="prog__coin">{m.coin}</span>
                <span className="prog__label">{m.label}</span>
              </div>
              {i < TIER_MILESTONES.length - 1 && (
                <span
                  className={`prog__rail ${
                    states[i] === "completed" ? "is-filled" : ""
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
