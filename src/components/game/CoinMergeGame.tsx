import { useCallback, useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  initialBoard,
  isGameOver,
  move,
  spawnRandomTile,
  type Board as BoardType,
  type Direction,
} from "@/lib/game";
import { Board } from "./Board";
import { Score } from "./Score";
import { WalletButton } from "./WalletButton";

const BEST_KEY = "coin-merge-best";

export function CoinMergeGame() {
  const [board, setBoard] = useState<BoardType>(() => initialBoard());
  const [score, setScore] = useState(0);
  // Load `best` after mount to avoid SSR/client hydration mismatch.
  const [best, setBest] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY) ?? 0);
    if (stored > 0) setBest(stored);
  }, []);

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
        <div className="game-header__top">
          <div>
            <div className="game-eyebrow">CRYPTO · 2048</div>
            <h1 className="game-title">Coin Merge</h1>
          </div>
          <button
            className="btn-icon"
            onClick={restart}
            aria-label="Restart game"
            title="Restart"
          >
            <RotateCcw size={18} />
          </button>
        </div>
        <Score score={score} best={best} />
      </header>

      <div className="game-board-wrap">
        <Board board={board} onMove={handleMove} />

        {gameOver && (
          <div className="game-over">
            <div className="game-over__inner">
              <div className="game-eyebrow">RUN ENDED</div>
              <h2 className="game-over__title">Game Over</h2>
              <p className="game-over__score">
                Final score <strong>{score}</strong>
              </p>
              <button className="btn-primary" onClick={restart}>
                Play again
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="game-actions">
        <button className="btn-primary" onClick={restart}>
          <RotateCcw size={16} />
          Restart
        </button>
        <p className="game-help">Swipe on mobile · arrow keys on desktop</p>
      </div>
    </div>
  );
}
