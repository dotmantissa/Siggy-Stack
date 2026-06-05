import { Loader2, X } from "lucide-react";

interface Props {
  open: boolean;
  score: number;
  pending: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
}

/**
 * Lightweight "New High Score" prompt that appears after game over when the
 * connected player beats their previously recorded best. Purely a UI shell —
 * the parent owns the actual recording flow.
 */
export function RitualScorePrompt({
  open,
  score,
  pending,
  errorMessage,
  onConfirm,
  onDismiss,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="ritual-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ritual-score-prompt-title"
      onClick={pending ? undefined : onDismiss}
    >
      <div className="ritual-modal" onClick={(e) => e.stopPropagation()}>
        {!pending && (
          <button
            className="ritual-modal__close"
            onClick={onDismiss}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        <div className="ritual-modal__eyebrow">RITUAL TESTNET</div>
        <h2 id="ritual-score-prompt-title" className="ritual-modal__title">
          New High Score
        </h2>
        <p className="ritual-modal__text">
          You achieved a new best score of <strong>{score.toLocaleString()}</strong>.
          Record it on Ritual?
        </p>

        {errorMessage && (
          <p className="ritual__hint ritual__hint--error">{errorMessage}</p>
        )}

        <div className="ritual-modal__actions">
          <button
            className="ritual-modal__btn ritual-modal__btn--ghost"
            onClick={onDismiss}
            disabled={pending}
          >
            Maybe Later
          </button>
          <button
            className="ritual-modal__btn ritual-modal__btn--primary"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 size={14} className="ritual__spin" /> Recording…
              </>
            ) : (
              "Record Score"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
