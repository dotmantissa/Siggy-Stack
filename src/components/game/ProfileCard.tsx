import { Sparkles, Flame, Calendar } from "lucide-react";
import { shortenAddress } from "@/hooks/useWallet";
import { tierName } from "@/lib/gsiggy";

interface Props {
  address: string;
  bestScore: number;
  bestTier: number;
  eligible: boolean;
  dailyRank?: number | null;
  dailyScore?: number | null;
  streak?: number;
  unlockedAt?: string | null;
  challengesDone?: number;
  challengesTotal?: number;
}

// Connected-player dashboard: identity + best stats + Ritual status + streak.
export function ProfileCard({
  address,
  bestScore,
  bestTier,
  eligible,
  dailyRank,
  dailyScore,
  streak = 0,
  unlockedAt,
  challengesDone = 0,
  challengesTotal = 0,
}: Props) {
  const unlockedDate = unlockedAt
    ? new Date(unlockedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
        {streak > 0 && (
          <span className="profile__streak" title={`${streak}-day streak`}>
            <Flame size={11} />
            {streak}d
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
          <span className="profile__stat-label">Streak</span>
          <span className="profile__stat-value">
            {streak > 0 ? `${streak} day${streak === 1 ? "" : "s"}` : "—"}
          </span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-label">Daily challenge</span>
          <span className="profile__stat-value">
            {challengesTotal > 0
              ? `${challengesDone}/${challengesTotal}`
              : "—"}
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
            {eligible && unlockedDate && (
              <span className="profile__stat-sub">
                {" "}
                · <Calendar size={9} style={{ display: "inline" }} /> {unlockedDate}
              </span>
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
