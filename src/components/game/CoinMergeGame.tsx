import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  COINS,
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
import { Leaderboard } from "./Leaderboard";
import { LegendaryModal } from "./LegendaryModal";
import { submitScore } from "@/lib/leaderboard";
import { useWallet } from "@/hooks/useWallet";

const BEST_KEY = "coin-merge-best";
const LEGENDARY_TIER = COINS.length - 1;

export function CoinMergeGame() {
  const [board, setBoard] = useState<BoardType>(() => initialBoard());
  const [score, setScore] = useState(0);
  // Load `best` after mount to avoid SSR/client hydration mismatch.
  const [best, setBest] = useState<number>(0);
  const [gameOver, setGameOver] = useState(false);
  // Tracks whether the player produced a LEGENDARY tile during this run.
  // Reset on restart. Drives the post-game-over Ritual achievement modal.
  const [hasUnlockedLegendary, setHasUnlockedLegendary] = useState(false);
  // True once we've shown the modal for this run so it only appears once.
  const [showLegendaryModal, setShowLegendaryModal] = useState(false);
  // Bumped whenever we submit a score, so the leaderboard refetches.
  const [lbRefresh, setLbRefresh] = useState(0);

  const { address } = useWallet();
  // Latest score in a ref so the game-over effect doesn't re-fire on every score change.
  const scoreRef = useRef(0);
  scoreRef.current = score;

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY) ?? 0);
    if (stored > 0) setBest(stored);
  }, []);

  const restart = useCallback(() => {
    setBoard(initialBoard());
    setScore(0);
    setGameOver(false);
    setHasUnlockedLegendary(false);
    setShowLegendaryModal(false);
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

        // Detect if a LEGENDARY tile now exists on the board. We do this
        // here (not in game.ts) so the pure game logic stays untouched.
        // Gameplay continues normally — the celebration only fires after
        // game over, so the player is never interrupted mid-run.
        for (const row of next) {
          for (const tile of row) {
            if (tile && tile.tier === LEGENDARY_TIER) {
              setHasUnlockedLegendary(true);
              break;
            }
          }
        }

        if (isGameOver(withSpawn)) setGameOver(true);
        return withSpawn;
      });
    },
    [gameOver],
  );

  // When the game ends, fire-and-forget a submission to the leaderboard.
  // Only saves for connected wallets, and never blocks gameplay.
  useEffect(() => {
    if (!gameOver) return;
    const finalScore = scoreRef.current;
    if (address && finalScore > 0) {
      submitScore(address, finalScore).then(() => setLbRefresh((n) => n + 1));
    }
    // Reveal the Ritual achievement modal AFTER game over, only if the
    // player actually reached LEGENDARY during this run.
    if (hasUnlockedLegendary) {
      // Small delay so the game-over overlay animates in first.
      const t = setTimeout(() => setShowLegendaryModal(true), 450);
      return () => clearTimeout(t);
    }
  }, [gameOver, address, hasUnlockedLegendary]);

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
      <div className="game-topbar">
        <WalletButton />
      </div>
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

      <Leaderboard currentWallet={address} refreshKey={lbRefresh} />
    </div>
  );
}
