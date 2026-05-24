import { useCallback, useEffect, useState } from "react";
import { initialBoard, isGameOver, move, spawnRandomTile, type Direction } from "@/lib/game";
import { Board } from "./Board";
import { Score } from "./Score";

const BEST_KEY = "coin-merge-best";

export function CoinMergeGame() {
  const [board, setBoard] = useState(initialBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    return Number(window.localStorage.getItem(BEST_KEY) ?? 0);
  });
  const [gameOver, setGameOver] = useState(false);

  const restart = useCallback(() => {
    setBoard(initialBoard());
    setScore(0);
    setGameOver(false);
  }, []);

  const handleMove = useCallback(
    (dir: Direction) => {
      if (gameOver) return;
      setBoard((prev) => {
        const { board: next, gained, moved } = move(prev, dir);
        if (!moved) return prev;
        const withSpawn = spawnRandomTile(next);
        if (gained > 0) {
          setScore((s) => {
            const ns = s + gained;
            setBest((b) => {
              if (ns > b) {
                if (typeof window !== "undefined")
                  window.localStorage.setItem(BEST_KEY, String(ns));
                return ns;
              }
              return b;
            });
            return ns;
          });
        }
        if (isGameOver(withSpawn)) setGameOver(true);
        return withSpawn;
      });
    },
    [gameOver],
  );

  // Prevent page from scrolling on arrow keys while playing.
  useEffect(() => {
    const prevent = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();
    };
    window.addEventListener("keydown", prevent, { passive: false });
    return () => window.removeEventListener("keydown", prevent);
  }, []);

  return (
    <div className="game-shell">
      <header className="game-header">
        <div>
          <h1 className="game-title">Coin Merge</h1>
          <p className="game-tagline">Swipe to merge coins. DOGE all the way to LEGENDARY.</p>
        </div>
        <Score score={score} best={best} />
      </header>

      <div className="game-board-wrap">
        <Board board={board} onMove={handleMove} />

        {gameOver && (
          <div className="game-over">
            <div className="game-over__inner">
              <h2 className="game-over__title">Game Over</h2>
              <p className="game-over__score">Final score: {score}</p>
              <button className="btn-primary" onClick={restart}>
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="game-actions">
        <button className="btn-primary" onClick={restart}>
          Restart
        </button>
        <p className="game-help">Arrow keys on desktop · swipe on mobile</p>
      </div>
    </div>
  );
}
