// Daily streak tracking for Coin Merge.
//
// A "streak" = consecutive UTC days (ending today or yesterday) where the
// wallet posted at least one leaderboard score. The streak stays alive if
// the player played yesterday; it resets to 0 only after a full day skipped.
//
// All reads come from the existing `leaderboard_scores` table — no extra
// schema needed. Per-wallet streaks for the leaderboard are fetched in a
// single query.

import { supabase } from "@/integrations/supabase/client";

function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgoUtc(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return utcDateString(d);
}

// Compute streak length from a Set of UTC date strings the wallet played on.
// Allows a 1-day grace: streak ends today OR yesterday.
function streakFromDays(playedDays: Set<string>): number {
  const today = utcDateString(new Date());
  const yesterday = daysAgoUtc(1);

  let cursor: string;
  if (playedDays.has(today)) cursor = today;
  else if (playedDays.has(yesterday)) cursor = yesterday;
  else return 0;

  let streak = 0;
  const d = new Date(`${cursor}T00:00:00Z`);
  while (playedDays.has(utcDateString(d))) {
    streak += 1;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return streak;
}

// Fetch streaks for a list of wallets in a single round-trip.
// Looks back up to 30 days (plenty for surface-level UI).
export async function fetchStreaks(
  wallets: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (wallets.length === 0) return out;

  const addrs = Array.from(new Set(wallets.map((w) => w.toLowerCase())));
  const since = daysAgoUtc(30);

  const { data, error } = await supabase
    .from("leaderboard_scores")
    .select("wallet_address, day")
    .in("wallet_address", addrs)
    .gte("day", since);

  if (error || !data) {
    console.error("[streak] fetch failed", error);
    return out;
  }

  // Bucket played days per wallet.
  const buckets = new Map<string, Set<string>>();
  for (const row of data) {
    const key = row.wallet_address;
    if (!buckets.has(key)) buckets.set(key, new Set());
    buckets.get(key)!.add(row.day);
  }
  for (const addr of addrs) {
    out.set(addr, streakFromDays(buckets.get(addr) ?? new Set()));
  }
  return out;
}

// Convenience: fetch streak for a single wallet.
export async function fetchStreak(wallet: string): Promise<number> {
  const map = await fetchStreaks([wallet]);
  return map.get(wallet.toLowerCase()) ?? 0;
}
