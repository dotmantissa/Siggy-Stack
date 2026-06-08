import { Check, Target, Flame } from "lucide-react";
import {
  dailyChallenges,
  progressPercent,
  type ChallengeProgress,
} from "@/lib/challenges";

interface Props {
  progress: ChallengeProgress;
  // Optional: most recently completed challenge id (drives a small celebrate
  // animation on the row).
  justCompleted?: string | null;
}

// Daily Ritual challenges. Three per UTC day, auto-rotated.
export function DailyChallengesCard({ progress, justCompleted }: Props) {
  const challenges = dailyChallenges();
  const pct = progressPercent(progress);
  const done = challenges.filter((c) => progress.completed[c.id]).length;

  return (
    <section className="daily">
      <header className="daily__head">
        <div className="daily__title">
          <Target size={14} />
          <span>Daily Challenges</span>
        </div>
        <span className="daily__count">
          {done}/{challenges.length}
        </span>
      </header>

      <div className="daily__bar" aria-hidden>
        <div
          className="daily__bar-fill"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="daily__list">
        {challenges.map((c) => {
          const isDone = !!progress.completed[c.id];
          const isCelebrate = justCompleted === c.id;
          return (
            <li
              key={c.id}
              className={`daily__row ${isDone ? "is-done" : ""} ${
                isCelebrate ? "is-celebrate" : ""
              }`}
            >
              <span className="daily__icon" aria-hidden>
                {isDone ? <Check size={11} strokeWidth={3} /> : <Flame size={11} />}
              </span>
              <div className="daily__body">
                <span className="daily__name">{c.title}</span>
                <span className="daily__desc">{c.description}</span>
              </div>
              {isDone && <span className="daily__tag">DONE</span>}
            </li>
          );
        })}
      </ul>

      <p className="daily__note">Resets daily (UTC) · A new Ritual challenge awaits tomorrow</p>
    </section>
  );
}
