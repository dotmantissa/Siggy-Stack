interface Props {
  score: number;
  best: number;
}

export function Score({ score, best }: Props) {
  return (
    <div className="score-row">
      <div className="score-card">
        <span className="score-card__label">SCORE</span>
        <span className="score-card__value">{score}</span>
      </div>
      <div className="score-card">
        <span className="score-card__label">BEST</span>
        <span className="score-card__value">{best}</span>
      </div>
    </div>
  );
}
