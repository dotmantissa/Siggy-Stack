// Lightweight achievement + progression system for Coin Merge.
//
// Kept fully separate from gameplay (game.ts) — gameplay never reads from
// here and this module never mutates the board. Achievements are derived
// from a small persisted snapshot:
//   - bestTier       (highest tile ever reached)
//   - firstMerge     (any merge happened at least once)
//   - dailyHighScore (player has held #1 on the daily leaderboard)
//
// FUTURE RITUAL INTEGRATION:
//   When achievements become onchain, swap `loadAchievementState` /
//   `saveAchievementState` for a wallet-scoped backend read and emit an
//   event per newly-unlocked achievement so the Ritual recorder can pick
//   it up. The achievement *definitions* below stay unchanged.

import { COINS } from "@/lib/game";

// ----- Tier milestones -----

export interface TierMilestone {
  tier: number;
  coin: (typeof COINS)[number];
  label: string;
}

export const TIER_MILESTONES: TierMilestone[] = [
  { tier: 0, coin: "DOGE", label: "Beginner" },
  { tier: 1, coin: "PEPE", label: "Explorer" },
  { tier: 2, coin: "SOL", label: "Rising" },
  { tier: 3, coin: "ETH", label: "Skilled" },
  { tier: 4, coin: "BTC", label: "Elite" },
  { tier: 5, coin: "LEGENDARY", label: "Ritual Legend" },
];

export type TierState = "completed" | "current" | "locked";

// Given the highest tile ever reached, classify each milestone for the path UI.
// "current" = the next milestone the player is working toward.
export function tierStates(bestTier: number): TierState[] {
  return TIER_MILESTONES.map((m) => {
    if (bestTier >= m.tier) return "completed";
    if (bestTier + 1 === m.tier) return "current";
    return "locked";
  });
}

// ----- Achievement definitions -----

export type AchievementId =
  | "first_merge"
  | "reach_sol"
  | "reach_eth"
  | "reach_btc"
  | "reach_legendary"
  | "daily_high_score";

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_merge",       title: "First Merge",       description: "Merge your first two coins" },
  { id: "reach_sol",         title: "Reach SOL",         description: "Forge a SOL coin" },
  { id: "reach_eth",         title: "Reach ETH",         description: "Forge an ETH coin" },
  { id: "reach_btc",         title: "Reach BTC",         description: "Forge a BTC coin" },
  { id: "reach_legendary",   title: "Ritual Legend",     description: "Unlock the LEGENDARY tile" },
  { id: "daily_high_score",  title: "Daily High Score",  description: "Claim today's #1 leaderboard spot" },
];

// ----- Persisted state -----

export interface AchievementState {
  firstMerge: boolean;
  dailyHighScore: boolean;
}

const LOCAL_KEY_BASE = "coin-merge-achievements";
// Per-wallet key so different wallets in the same browser stay separate.
function keyFor(wallet: string | null | undefined): string {
  return wallet ? `${LOCAL_KEY_BASE}:${wallet.toLowerCase()}` : LOCAL_KEY_BASE;
}

export function loadAchievementState(wallet?: string | null): AchievementState {
  if (typeof window === "undefined") return { firstMerge: false, dailyHighScore: false };
  try {
    const raw = window.localStorage.getItem(keyFor(wallet));
    if (!raw) return { firstMerge: false, dailyHighScore: false };
    const parsed = JSON.parse(raw);
    return {
      firstMerge: !!parsed.firstMerge,
      dailyHighScore: !!parsed.dailyHighScore,
    };
  } catch {
    return { firstMerge: false, dailyHighScore: false };
  }
}

export function saveAchievementState(wallet: string | null | undefined, s: AchievementState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keyFor(wallet), JSON.stringify(s));
}

// Derive the unlocked set from bestTier + persisted flags. Pure function —
// the UI can call this on every render without side effects.
export function unlockedSet(
  bestTier: number,
  state: AchievementState,
): Set<AchievementId> {
  const set = new Set<AchievementId>();
  if (state.firstMerge || bestTier >= 1) set.add("first_merge");
  if (bestTier >= 2) set.add("reach_sol");
  if (bestTier >= 3) set.add("reach_eth");
  if (bestTier >= 4) set.add("reach_btc");
  if (bestTier >= 5) set.add("reach_legendary");
  if (state.dailyHighScore) set.add("daily_high_score");
  return set;
}
