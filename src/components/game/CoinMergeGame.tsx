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
import { GsiggyCard } from "./GsiggyCard";
import { ProfileCard } from "./ProfileCard";
import { submitScore } from "@/lib/leaderboard";
import {
  fetchEligibility,
  getLocalEligibility,
  saveRun,
  type GsiggyProfile,
} from "@/lib/gsiggy";
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
  // gSiggy profile for the connected wallet (or local-only when disconnected).
  const [profile, setProfile] = useState<GsiggyProfile | null>(null);
  // Highest tile tier reached during the current run (for profile stats).
  const [bestTierThisRun, setBestTierThisRun] = useState(0);

  const { address } = useWallet();
  // Latest values in refs so the game-over effect doesn't re-fire on score changes.
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const bestTierRef = useRef(0);
  bestTierRef.current = bestTierThisRun;
  const legendaryRef = useRef(false);
  legendaryRef.current = hasUnlockedLegendary;

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(BEST_KEY) ?? 0);
    if (stored > 0) setBest(stored);
  }, []);

  // Whenever the wallet connects (or changes), pull that wallet's eligibility
  // profile so it survives refresh and reconnects.
  useEffect(() => {
    if (!address) {
      // Disconnected: show local-only eligibility so unconnected players
      // still see progress they've made in this browser.
      setProfile({
        wallet_address: "",
        eligible: getLocalEligibility(),
        best_score: 0,
        best_tier: 0,
        unlocked_at: null,
      });
      return;
    }
    let cancelled = false;
    fetchEligibility(address).then((p) => {
      if (!cancelled) setProfile(p);
    });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const restart = useCallback(() => {
    setBoard(initialBoard());
    setScore(0);
    setGameOver(false);
    setHasUnlockedLegendary(false);
    setShowLegendaryModal(false);
    setBestTierThisRun(0);
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

        // Track LEGENDARY unlock + highest tier this run. Done here (not in
        // game.ts) so the pure game logic stays untouched. Gameplay
        // continues normally — eligibility is persisted at game over.
        let runMax = bestTierRef.current;
        for (const row of next) {
          for (const tile of row) {
            if (tile) {
              if (tile.tier > runMax) runMax = tile.tier;
              if (tile.tier === LEGENDARY_TIER) setHasUnlockedLegendary(true);
            }
          }
        }
        if (runMax !== bestTierRef.current) setBestTierThisRun(runMax);

        if (isGameOver(withSpawn)) setGameOver(true);
        return withSpawn;
      });
    },
    [gameOver],
  );

  // When the game ends:
  //  1. Submit the score to the daily leaderboard.
  //  2. Persist eligibility + best stats for the connected wallet.
  //  3. Reveal the Ritual achievement modal (if applicable).
  // None of this blocks gameplay — restart works regardless.
  useEffect(() => {
    if (!gameOver) return;
    const finalScore = scoreRef.current;
    const finalTier = bestTierRef.current;
    const unlocked = legendaryRef.current;

    if (address && finalScore > 0) {
      submitScore(address, finalScore).then(() => setLbRefresh((n) => n + 1));
    }
    if (address) {
      // Persist eligibility for the connected wallet (sticky on the server).
      saveRun(address, {
        eligible: unlocked,
        score: finalScore,
        best_tier: finalTier,
      }).then((p) => {
        if (p) setProfile(p);
      });
    } else if (unlocked) {
      // No wallet — still track local eligibility so it survives refresh.
      setProfile((prev) => ({
        wallet_address: "",
        eligible: true,
        best_score: Math.max(prev?.best_score ?? 0, finalScore),
        best_tier: Math.max(prev?.best_tier ?? 0, finalTier),
        unlocked_at: prev?.unlocked_at ?? new Date().toISOString(),
      }));
    }

    if (unlocked) {
      const t = setTimeout(() => setShowLegendaryModal(true), 450);
      return () => clearTimeout(t);
    }
  }, [gameOver, address]);

  useEffect(() => {
    const prevent = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key))
        e.preventDefault();
    };
    window.addEventListener("keydown", prevent, { passive: false });
    return () => window.removeEventListener("keydown", prevent);
  }, []);

  const isEligible = !!profile?.eligible;

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

      {/* Connected player's profile: best score, best tile, eligibility. */}
      {address && profile && (
        <ProfileCard
          address={address}
          bestScore={Math.max(profile.best_score, score)}
          bestTier={Math.max(profile.best_tier, bestTierThisRun)}
          eligible={isEligible}
        />
      )}

      {/* gSiggy eligibility card — visible to everyone. */}
      <GsiggyCard eligible={isEligible} />

      <Leaderboard currentWallet={address} refreshKey={lbRefresh} />

      <LegendaryModal
        open={showLegendaryModal}
        onPlayAgain={() => {
          setShowLegendaryModal(false);
          restart();
        }}
        onDismiss={() => setShowLegendaryModal(false)}
      />
    </div>
  );
}
