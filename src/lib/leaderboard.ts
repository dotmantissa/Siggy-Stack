// Daily leaderboard logic for Coin Merge.
// Kept completely separate from gameplay so it's easy to edit later.
import { supabase } from "@/integrations/supabase/client";

export interface LeaderboardEntry {
  wallet_address: string;
  score: number;
  day: string;
  updated_at: string;
}

// UTC date string (YYYY-MM-DD) — matches the `day` default on the DB.
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

// Fetch today's top scores (highest first).
export async function fetchTodayLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("wallet_address, score, day, updated_at")
    .eq("day", todayUtc())
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true }) // earlier reach of the same score ranks higher
    .limit(limit);

  if (error) {
    console.error("[leaderboard] fetch failed", error);
    return [];
  }
  return data ?? [];
}

// Submit a wallet's score for today. Only stores it if it beats the existing one.
// We use upsert on (wallet_address, day) and the DB trigger guarantees scores never decrease.
export async function submitScore(wallet: string, score: number): Promise<void> {
  if (!wallet || score <= 0) return;

  const row = {
    wallet_address: wallet.toLowerCase(),
    score,
    day: todayUtc(),
  };

  const { error } = await supabase
    .from("leaderboard_scores")
    .upsert(row, { onConflict: "wallet_address,day" });

  if (error) {
    // Never interrupt gameplay — just log.
    console.error("[leaderboard] submit failed", error);
  }
}

// Fetch a wallet's rank + score on today's board.
// Returns null when the wallet has no entry today.
export async function fetchPlayerDailyStanding(
  wallet: string,
): Promise<{ rank: number; score: number } | null> {
  if (!wallet) return null;
  const addr = wallet.toLowerCase();
  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("wallet_address, score")
    .eq("day", todayUtc())
    .order("score", { ascending: false })
    .order("updated_at", { ascending: true });

  if (error || !data) return null;
  const idx = data.findIndex((r) => r.wallet_address === addr);
  if (idx === -1) return null;
  return { rank: idx + 1, score: data[idx].score };
}
