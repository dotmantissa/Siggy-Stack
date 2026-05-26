import { useEffect, useRef, useState } from "react";

interface Props {
  score: number;
  best: number;
}

// Score card with a small "+N" pop and pulse whenever the score increases.
export function Score({ score, best }: Props) {
  const prev = useRef(score);
  const [gain, setGain] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const diff = score - prev.current;
    prev.current = score;
    if (diff > 0) {
      setGain(diff);
      setPulse(true);
      const t1 = setTimeout(() => setGain(null), 850);
      const t2 = setTimeout(() => setPulse(false), 350);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [score]);

  return (
    <div className="score-row">
      <div className={`score-card ${pulse ? "score-card--pulse" : ""}`}>
        <span className="score-card__label">SCORE</span>
        <span className="score-card__value">{score}</span>
        {gain !== null && <span className="score-card__gain">+{gain}</span>}
      </div>
      <div className="score-card">
        <span className="score-card__label">BEST</span>
        <span className="score-card__value">{best}</span>
      </div>
    </div>
  );
}
