import { Sparkles, Flame } from "lucide-react";
import { shortenAddress } from "@/hooks/useWallet";
import { tierName } from "@/lib/gsiggy";

interface Props {
  address: string;
  bestScore: number;
  bestTier: number;
  eligible: boolean;
  // Today's leaderboard standing for this wallet (null = no entry yet).
  dailyRank?: number | null;
  dailyScore?: number | null;
}

// Connected-player profile snapshot: identity, best stats, and Ritual status.
// Achievement detail lives in AchievementsCard; this card is the summary.
export function ProfileCard({
  address,
  bestScore,
  bestTier,
  eligible,
  dailyRank,
  dailyScore,
}: Props) {
  return (
    <section className={`profile ${eligible ? "profile--legend" : ""}`}>
      <header className="profile__head">
        <span className="profile__dot" aria-hidden />
        <span className="profile__addr">{shortenAddress(address)}</span>
        {eligible ? (
          <span className="profile__badge" title="Ritual Legend">
            <Sparkles size={11} />
            Ritual Legend
          </span>
        ) : (
          <span className="profile__badge profile__badge--muted">
            <Flame size={11} />
            Climber
          </span>
        )}
      </header>

      <div className="profile__grid">
        <div className="profile__stat">
          <span className="profile__stat-label">Best score</span>
          <span className="profile__stat-value">{bestScore}</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-label">Best tile</span>
          <span className="profile__stat-value">{tierName(bestTier)}</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-label">Today</span>
          <span className="profile__stat-value">
            {dailyRank ? `#${dailyRank}` : "—"}
            {dailyScore ? (
              <span className="profile__stat-sub"> · {dailyScore}</span>
            ) : null}
          </span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-label">gSiggy</span>
          <span
            className={`profile__stat-value ${eligible ? "is-eligible" : "is-locked"}`}
          >
            {eligible ? "Eligible" : "Locked"}
          </span>
        </div>
        <div className="profile__stat profile__stat--wide">
          <span className="profile__stat-label">Ritual achievement</span>
          <span
            className={`profile__stat-value ${eligible ? "is-eligible" : "is-locked"}`}
          >
            {eligible ? "LEGENDARY unlocked" : "Reach LEGENDARY to unlock"}
          </span>
        </div>
      </div>
    </section>
  );
}
