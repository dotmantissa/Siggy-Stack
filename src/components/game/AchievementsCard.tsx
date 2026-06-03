import { Trophy, Lock, Check } from "lucide-react";
import {
  ACHIEVEMENTS,
  unlockedSet,
  type AchievementState,
} from "@/lib/achievements";

interface Props {
  bestTier: number;
  state: AchievementState;
}

// Lightweight achievement grid. Pure presentation — unlock state is derived
// from bestTier + the persisted `state` flags (first merge, daily #1).
export function AchievementsCard({ bestTier, state }: Props) {
  const unlocked = unlockedSet(bestTier, state);
  const total = ACHIEVEMENTS.length;
  const done = unlocked.size;

  return (
    <section className="ach">
      <header className="ach__head">
        <div className="ach__title">
          <Trophy size={14} />
          <span>Achievements</span>
        </div>
        <span className="ach__count">
          {done}/{total}
        </span>
      </header>

      <ul className="ach__grid">
        {ACHIEVEMENTS.map((a) => {
          const got = unlocked.has(a.id);
          const isLegend = a.id === "reach_legendary";
          return (
            <li
              key={a.id}
              className={`ach__item ${got ? "is-unlocked" : "is-locked"} ${
                isLegend && got ? "is-legend" : ""
              }`}
            >
              <span className="ach__icon" aria-hidden>
                {got ? <Check size={12} strokeWidth={3} /> : <Lock size={10} />}
              </span>
              <div className="ach__body">
                <span className="ach__name">{a.title}</span>
                <span className="ach__desc">{a.description}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
