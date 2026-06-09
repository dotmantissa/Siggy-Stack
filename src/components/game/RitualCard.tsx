import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import {
  RITUAL_NETWORK_NAME,
  loadRecorded,
  recordLegendaryAchievement,
  type RecordedAchievement,
} from "@/lib/ritual";
import { track } from "@/lib/analytics";
import { ExplorerLink } from "./ExplorerLink";

interface Props {
  eligible: boolean;
  wallet: string | null;
  bestScore: number;
  bestTier: number;
  onRecorded?: (record: RecordedAchievement) => void;
}

/**
 * Ritual Status card.
 *
 * Shows the "Record on Ritual" button to eligible, wallet-connected players.
 * The actual onchain interaction is delegated to `recordLegendaryAchievement`
 * (see src/lib/ritual/) — this component only owns UI state.
 */
export function RitualCard({ eligible, wallet, bestScore, bestTier, onRecorded }: Props) {
  // null = idle, "pending" = wallet prompt open, string = error message
  const [state, setState] = useState<"idle" | "pending" | { error: string }>("idle");
  const [recorded, setRecorded] = useState<RecordedAchievement | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Restore "already recorded" state from local storage whenever the wallet changes.
  useEffect(() => {
    setRecorded(loadRecorded(wallet));
  }, [wallet]);

  if (!eligible) return null;

  const isPending = state === "pending";
  const errorMessage = typeof state === "object" ? state.error : null;
  const alreadyRecorded = !!recorded;

  async function handleRecord() {
    if (!wallet || isPending || alreadyRecorded) return;
    setState("pending");
    const outcome = await recordLegendaryAchievement({
      wallet,
      bestScore,
      bestTier,
      legendaryUnlocked: true,
    });
    if (outcome.ok) {
      setRecorded(outcome.record);
      setState("idle");
      setShowSuccess(true);
      track("achievement_recorded", {
        tx: outcome.record.txHash,
        wallet,
        best_score: bestScore,
      });
      onRecorded?.(outcome.record);
    } else {
      setState({ error: outcome.message });
    }
  }

  return (
    <>
      <section className="ritual" aria-label="Ritual Status">
        <header className="ritual__head">
          <div className="ritual__title">
            <Sparkles size={16} />
            <span>Ritual Status</span>
          </div>
          <span className="ritual__chip">{RITUAL_NETWORK_NAME}</span>
        </header>

        <dl className="ritual__rows">
          <div className="ritual__row">
            <dt>Network</dt>
            <dd>{RITUAL_NETWORK_NAME}</dd>
          </div>
          <div className="ritual__row">
            <dt>Achievement</dt>
            <dd className="is-eligible">
              {alreadyRecorded ? "Recorded ✓" : "Eligible"}
            </dd>
          </div>
        </dl>

        <button
          className={`ritual__btn${alreadyRecorded ? " ritual__btn--done" : !wallet || isPending ? "" : " ritual__btn--active"}`}
          onClick={handleRecord}
          disabled={!wallet || isPending || alreadyRecorded}
          aria-disabled={!wallet || isPending || alreadyRecorded}
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="ritual__spin" />
              Recording…
            </>
          ) : alreadyRecorded ? (
            <>
              <CheckCircle2 size={14} />
              Recorded on {RITUAL_NETWORK_NAME}
            </>
          ) : !wallet ? (
            "Connect wallet to record"
          ) : (
            "Record on Ritual"
          )}
        </button>

        {alreadyRecorded && recorded?.txHash && (
          <ExplorerLink txHash={recorded.txHash} />
        )}


        {errorMessage ? (
          <p className="ritual__hint ritual__hint--error">{errorMessage}</p>
        ) : (
          <p className="ritual__hint">
            {alreadyRecorded
              ? "Your Legendary achievement lives onchain."
              : "Records a tiny achievement entry on Ritual testnet (one-time)."}
          </p>
        )}
      </section>

      {showSuccess && recorded && (
        <div
          className="ritual-modal__backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ritual-success-title"
          onClick={() => setShowSuccess(false)}
        >
          <div className="ritual-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="ritual-modal__close"
              onClick={() => setShowSuccess(false)}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="ritual-modal__eyebrow">RITUAL TESTNET</div>
            <h2 id="ritual-success-title" className="ritual-modal__title">
              Achievement Recorded
            </h2>
            <p className="ritual-modal__text">
              Your Ritual Legendary achievement has been recorded.
            </p>
            <ExplorerLink txHash={recorded.txHash} />
            <div className="ritual-modal__actions">
              <button
                className="ritual-modal__btn ritual-modal__btn--primary"
                onClick={() => setShowSuccess(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
