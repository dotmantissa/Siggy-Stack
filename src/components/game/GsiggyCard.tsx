import { Lock, Sparkles, Calendar } from "lucide-react";

interface Props {
  eligible: boolean;
  unlockedAt?: string | null;
}

/**
 * gSiggy badge / holder card. Two states:
 *  - Locked: prompt the player to reach LEGENDARY.
 *  - Eligible (holder): premium Ritual-themed showcase with unlock date.
 *
 * FUTURE: when minting goes live, swap the disabled button for a real
 * mint action that calls the contract after verifying wallet ownership.
 */
export function GsiggyCard({ eligible, unlockedAt }: Props) {
  const date = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <section
      className={`gsiggy ${eligible ? "gsiggy--eligible gsiggy--prestige" : "gsiggy--locked"}`}
    >
      {eligible && <div className="gsiggy__glow" aria-hidden />}

      <div className="gsiggy__head">
        <div className="gsiggy__title">
          {eligible ? <Sparkles size={16} /> : <Lock size={16} />}
          <span>{eligible ? "gSiggy · Holder" : "gSiggy Badge"}</span>
        </div>
        <span className={`gsiggy__status ${eligible ? "is-eligible" : "is-locked"}`}>
          {eligible ? "Eligible" : "Locked"}
        </span>
      </div>

      <p className="gsiggy__text">
        {eligible
          ? "Eligibility unlocked. You are part of the Ritual Legend circle."
          : "Reach Ritual LEGENDARY to unlock eligibility"}
      </p>

      {eligible && (
        <>
          <ul className="gsiggy__showcase">
            <li>
              <span>Status</span>
              <strong>Ritual Legend</strong>
            </li>
            <li>
              <span>Unlocked</span>
              <strong>
                {date ? (
                  <>
                    <Calendar size={10} /> {date}
                  </>
                ) : (
                  "—"
                )}
              </strong>
            </li>
            <li>
              <span>Mint</span>
              <strong>Coming Soon</strong>
            </li>
          </ul>
          <button
            className="gsiggy__btn"
            disabled
            aria-disabled="true"
            title="Minting coming soon"
          >
            Mint Coming Soon
          </button>
        </>
      )}
    </section>
  );
}
