// Ritual testnet integration foundation.
//
// This module is a placeholder layer for future onchain interaction with
// the Ritual testnet. It intentionally contains NO blockchain code yet —
// no contracts, no signing, no transactions. Its only job is to define
// the shape of an "achievement record" and expose async stubs that the
// UI can call without caring about the implementation underneath.
//
// FUTURE Ritual integration point:
//   - Wire `recordAchievement` to a real contract call.
//   - Wire `submitScore` to an onchain score registry.
//   - Wire `mintGsiggy` to the gSiggy NFT mint function.
// Each stub already accepts the data the UI has, so swapping in real
// implementations later won't require touching gameplay or UI code.

export const RITUAL_NETWORK = "Ritual Testnet";

// Shape of an achievement we'd eventually record onchain.
export interface RitualAchievement {
  wallet_address: string;
  best_score: number;
  best_tier: number; // index into COINS
  legendary_unlocked: boolean;
  timestamp: string; // ISO
}

export interface RitualResult {
  ok: boolean;
  reason?: string;
}

// FUTURE Ritual integration point — record a Legendary achievement onchain.
export async function recordAchievement(
  _achievement: RitualAchievement,
): Promise<RitualResult> {
  return { ok: false, reason: "Ritual testnet integration coming soon." };
}

// FUTURE Ritual integration point — submit a score to an onchain registry.
export async function submitScore(
  _wallet: string,
  _score: number,
): Promise<RitualResult> {
  return { ok: false, reason: "Ritual testnet integration coming soon." };
}

// FUTURE Ritual integration point — mint the gSiggy NFT for an eligible wallet.
export async function mintGsiggy(_wallet: string): Promise<RitualResult> {
  return { ok: false, reason: "Ritual testnet integration coming soon." };
}

// Helper: build an achievement payload from the current profile state.
export function buildAchievement(input: {
  wallet: string;
  bestScore: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}): RitualAchievement {
  return {
    wallet_address: input.wallet.toLowerCase(),
    best_score: input.bestScore,
    best_tier: input.bestTier,
    legendary_unlocked: input.legendaryUnlocked,
    timestamp: new Date().toISOString(),
  };
}
