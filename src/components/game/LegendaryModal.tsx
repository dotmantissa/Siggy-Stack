import ritualLogo from "@/assets/ritual-logo.png";

interface Props {
  open: boolean;
  onPlayAgain: () => void;
  onDismiss: () => void;
}

/**
 * Premium achievement modal shown AFTER game over, but only if the player
 * reached the Ritual LEGENDARY tile during that run. It does not interrupt
 * gameplay — the unlock is tracked silently and revealed at the end.
 */
export function LegendaryModal({ open, onPlayAgain, onDismiss }: Props) {
  if (!open) return null;
  return (
    <div
      className="ritual-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ritual-modal-title"
      onClick={onDismiss}
    >
      <div className="ritual-modal" onClick={(e) => e.stopPropagation()}>
        <img
          src={ritualLogo}
          alt="Ritual"
          className="ritual-modal__logo"
          width={92}
          height={92}
        />
        <div className="ritual-modal__eyebrow">Ritual Achievement</div>
        <h2 id="ritual-modal-title" className="ritual-modal__title">
          Legendary Unlocked
        </h2>
        <p className="ritual-modal__text">
          You reached the Ritual <strong>Legendary</strong> tile.
          <br />
          You are now eligible for a <strong>gSiggy badge</strong>.
        </p>
        <div className="ritual-modal__actions">
          <button
            className="ritual-modal__btn ritual-modal__btn--primary"
            onClick={onPlayAgain}
          >
            Continue Playing Again
          </button>
          <button
            className="ritual-modal__btn ritual-modal__btn--ghost"
            onClick={onDismiss}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
