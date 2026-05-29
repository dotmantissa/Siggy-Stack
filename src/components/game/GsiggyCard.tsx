import { Lock, Sparkles } from "lucide-react";

interface Props {
  eligible: boolean;
}

/**
 * gSiggy badge card. Two states:
 *  - Locked: prompt the player to reach LEGENDARY.
 *  - Eligible: confirmation + disabled "Mint Coming Soon" CTA.
 *
 * FUTURE: when minting goes live, swap the disabled button for a real
 * mint action that calls the contract after verifying wallet ownership.
 */
export function GsiggyCard({ eligible }: Props) {
  return (
    <section className={`gsiggy ${eligible ? "gsiggy--eligible" : "gsiggy--locked"}`}>
      <div className="gsiggy__head">
        <div className="gsiggy__title">
          {eligible ? <Sparkles size={16} /> : <Lock size={16} />}
          <span>gSiggy Badge</span>
        </div>
        <span className={`gsiggy__status ${eligible ? "is-eligible" : "is-locked"}`}>
          {eligible ? "Eligible" : "Locked"}
        </span>
      </div>

      <p className="gsiggy__text">
        {eligible
          ? "You unlocked eligibility for gSiggy"
          : "Reach Ritual LEGENDARY to unlock eligibility"}
      </p>

      {eligible && (
        <button
          className="gsiggy__btn"
          disabled
          aria-disabled="true"
          title="Minting coming soon"
        >
          Mint Coming Soon
        </button>
      )}
    </section>
  );
}
