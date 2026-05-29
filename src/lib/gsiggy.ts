// gSiggy eligibility logic for Coin Merge.
//
// Purpose: track which wallets have unlocked the Ritual LEGENDARY tile so
// they will be eligible for a future gSiggy NFT badge.
//
// This module is deliberately decoupled from gameplay state — gameplay
// never reads from here, and this module never mutates the board.
//
// FUTURE NFT INTEGRATION:
//   When minting is added, the mint endpoint should:
//     1. Verify wallet ownership (sign-in-with-ethereum / SIWE).
//     2. Call `fetchEligibility(wallet)` to confirm `eligible === true`.
//     3. Call the contract's mint function. No on-chain logic lives here yet.

import { supabase } from "@/integrations/supabase/client";
import { COINS } from "@/lib/game";

// Local cache so disconnected players keep their progress in the browser.
// When a wallet connects we merge local progress into the DB row.
const LOCAL_KEY = "coin-merge-gsiggy";

export interface GsiggyProfile {
  wallet_address: string;
  eligible: boolean;
  best_score: number;
  best_tier: number; // 0..COINS.length-1
  unlocked_at: string | null;
}

function emptyProfile(wallet: string): GsiggyProfile {
  return {
    wallet_address: wallet.toLowerCase(),
    eligible: false,
    best_score: 0,
    best_tier: 0,
    unlocked_at: null,
  };
}

// ----- Local (browser) cache -----

function readLocal(): Pick<GsiggyProfile, "eligible" | "best_score" | "best_tier"> {
  if (typeof window === "undefined")
    return { eligible: false, best_score: 0, best_tier: 0 };
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return { eligible: false, best_score: 0, best_tier: 0 };
    const parsed = JSON.parse(raw);
    return {
      eligible: !!parsed.eligible,
      best_score: Number(parsed.best_score) || 0,
      best_tier: Number(parsed.best_tier) || 0,
    };
  } catch {
    return { eligible: false, best_score: 0, best_tier: 0 };
  }
}

function writeLocal(p: Pick<GsiggyProfile, "eligible" | "best_score" | "best_tier">) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(p));
}

// Update local cache by merging the run's best values (sticky).
export function recordRunLocal(run: {
  eligible: boolean;
  score: number;
  best_tier: number;
}) {
  const cur = readLocal();
  writeLocal({
    eligible: cur.eligible || run.eligible,
    best_score: Math.max(cur.best_score, run.score),
    best_tier: Math.max(cur.best_tier, run.best_tier),
  });
}

export function getLocalEligibility(): boolean {
  return readLocal().eligible;
}

// ----- Remote (Supabase) -----

// Fetch a wallet's full eligibility profile. Falls back to a fresh empty
// profile if the row doesn't exist yet.
export async function fetchEligibility(wallet: string): Promise<GsiggyProfile> {
  const addr = wallet.toLowerCase();
  const { data, error } = await supabase
    .from("gsiggy_eligibility")
    .select("wallet_address, eligible, best_score, best_tier, unlocked_at")
    .eq("wallet_address", addr)
    .maybeSingle();

  if (error) {
    console.error("[gsiggy] fetch failed", error);
    return emptyProfile(addr);
  }
  return data ?? emptyProfile(addr);
}

// Persist a finished run for the connected wallet.
// The DB trigger guarantees eligibility/best_score/best_tier never downgrade.
export async function saveRun(
  wallet: string,
  run: { eligible: boolean; score: number; best_tier: number },
): Promise<GsiggyProfile | null> {
  if (!wallet) return null;
  const addr = wallet.toLowerCase();

  // Always mirror to local cache so disconnected sessions keep progress.
  recordRunLocal(run);

  // Read existing row so we send the merged best values (defense-in-depth;
  // the DB trigger also enforces non-downgrade).
  const existing = await fetchEligibility(addr);
  const merged = {
    wallet_address: addr,
    eligible: existing.eligible || run.eligible,
    best_score: Math.max(existing.best_score, run.score),
    best_tier: Math.max(existing.best_tier, run.best_tier),
  };

  const { data, error } = await supabase
    .from("gsiggy_eligibility")
    .upsert(merged, { onConflict: "wallet_address" })
    .select("wallet_address, eligible, best_score, best_tier, unlocked_at")
    .maybeSingle();

  if (error) {
    console.error("[gsiggy] save failed", error);
    return null;
  }
  return data;
}

// Fetch which wallets in a given list are eligible (for leaderboard badge).
export async function fetchEligibleSet(
  wallets: string[],
): Promise<Set<string>> {
  if (wallets.length === 0) return new Set();
  const addrs = Array.from(new Set(wallets.map((w) => w.toLowerCase())));
  const { data, error } = await supabase
    .from("gsiggy_eligibility")
    .select("wallet_address")
    .in("wallet_address", addrs)
    .eq("eligible", true);

  if (error) {
    console.error("[gsiggy] eligible set failed", error);
    return new Set();
  }
  return new Set((data ?? []).map((r) => r.wallet_address));
}

// Human-readable coin name for a tier index (used by the profile card).
export function tierName(tier: number): string {
  return COINS[Math.max(0, Math.min(tier, COINS.length - 1))];
}
