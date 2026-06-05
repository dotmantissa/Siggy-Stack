// Orchestrates the "Record on Ritual" user flow.
//
// This module sits between the UI and the low-level `ritualService`. It owns:
//   - Building the achievement payload
//   - Calling the wallet to switch network + sign the tx
//   - Persisting a "recorded" flag per wallet so the player can only record once
//
// Keeping this separate from `ritualService` means future flows (e.g. NFT
// minting) can reuse the same persistence helpers without duplicating logic.

import { ensureRitualNetwork, sendAchievementTx, RitualError } from "./ritualService";
import { RITUAL_NETWORK_NAME } from "./networkConfig";

export interface AchievementInput {
  wallet: string;
  bestScore: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}

export interface RecordedAchievement {
  txHash: string;
  network: string;
  timestamp: string;
  bestScore: number;
  bestTier: number;
}

const STORAGE_PREFIX = "ritual-recorded:";

function storageKey(wallet: string): string {
  return `${STORAGE_PREFIX}${wallet.toLowerCase()}`;
}

/** Read the persisted "already recorded" entry for a wallet, if any. */
export function loadRecorded(wallet: string | null | undefined): RecordedAchievement | null {
  if (!wallet || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    return raw ? (JSON.parse(raw) as RecordedAchievement) : null;
  } catch {
    return null;
  }
}

function saveRecorded(wallet: string, record: RecordedAchievement): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(wallet), JSON.stringify(record));
  } catch {
    /* localStorage quota / private mode — best effort only */
  }
}

export type RecordOutcome =
  | { ok: true; record: RecordedAchievement }
  | { ok: false; kind: "no_wallet" | "rejected" | "network" | "failed" | "ineligible" | "already"; message: string };

/**
 * Main entry point used by the UI. Performs the full flow:
 *   1. Validate eligibility + wallet
 *   2. Switch wallet to Ritual network
 *   3. Send the achievement tx
 *   4. Persist success state
 */
export async function recordLegendaryAchievement(
  input: AchievementInput,
): Promise<RecordOutcome> {
  if (!input.wallet) {
    return { ok: false, kind: "no_wallet", message: "Connect your wallet first." };
  }
  if (!input.legendaryUnlocked) {
    return {
      ok: false,
      kind: "ineligible",
      message: "Reach the Legendary tile first to unlock this.",
    };
  }
  if (loadRecorded(input.wallet)) {
    return {
      ok: false,
      kind: "already",
      message: "You've already recorded this achievement.",
    };
  }

  try {
    await ensureRitualNetwork();

    const timestamp = new Date().toISOString();
    // Payload kept tiny on purpose — calldata costs gas per byte.
    const payload = {
      app: "coin-merge",
      kind: "legendary",
      wallet: input.wallet.toLowerCase(),
      best_score: input.bestScore,
      best_tier: input.bestTier,
      ts: timestamp,
    };

    const txHash = await sendAchievementTx(input.wallet, payload);

    const record: RecordedAchievement = {
      txHash,
      network: RITUAL_NETWORK_NAME,
      timestamp,
      bestScore: input.bestScore,
      bestTier: input.bestTier,
    };
    saveRecorded(input.wallet, record);
    return { ok: true, record };
  } catch (e) {
    if (e instanceof RitualError) {
      return { ok: false, kind: e.kind, message: e.message };
    }
    return {
      ok: false,
      kind: "failed",
      message: "Something went wrong while recording your achievement.",
    };
  }
}
