// Records a player's best score on Ritual testnet.
//
// Same mechanism as the achievement recorder: a self-transaction carrying a
// small JSON payload in calldata. We deliberately keep this separate from
// `achievementRecorder` so each flow can evolve on its own (e.g. swapping
// scores to a contract call, while achievements stay as raw calldata).
//
// Persistence rules (per wallet, local storage):
//   - One "best recorded score" entry per wallet.
//   - Only overwritten when the new score is strictly higher.
//   - Survives refresh and wallet reconnect.

import { ensureRitualNetwork, sendAchievementTx, RitualError } from "./ritualService";
import { RITUAL_NETWORK_NAME } from "./networkConfig";

export interface ScoreInput {
  wallet: string;
  score: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}

export interface RecordedScore {
  txHash: string;
  network: string;
  timestamp: string;
  bestScore: number;
  bestTier: number;
  legendaryUnlocked: boolean;
}

export type ScoreOutcome =
  | { ok: true; record: RecordedScore }
  | {
      ok: false;
      kind: "no_wallet" | "rejected" | "network" | "failed" | "not_improved";
      message: string;
    };

const STORAGE_PREFIX = "ritual-score:";

function storageKey(wallet: string): string {
  return `${STORAGE_PREFIX}${wallet.toLowerCase()}`;
}

/** Read the persisted "best recorded score" for a wallet, if any. */
export function loadRecordedScore(
  wallet: string | null | undefined,
): RecordedScore | null {
  if (!wallet || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(storageKey(wallet));
    return raw ? (JSON.parse(raw) as RecordedScore) : null;
  } catch {
    return null;
  }
}

function saveRecordedScore(wallet: string, record: RecordedScore): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(wallet), JSON.stringify(record));
  } catch {
    /* best effort */
  }
}

/**
 * Full flow: validate → switch network → send tx → persist.
 *
 * Returns a discriminated outcome the UI can render directly. No throws.
 */
export async function recordBestScore(input: ScoreInput): Promise<ScoreOutcome> {
  if (!input.wallet) {
    return { ok: false, kind: "no_wallet", message: "Connect your wallet first." };
  }

  const previous = loadRecordedScore(input.wallet);
  if (previous && input.score <= previous.bestScore) {
    return {
      ok: false,
      kind: "not_improved",
      message: "This score doesn't beat your recorded best.",
    };
  }

  try {
    await ensureRitualNetwork();

    const timestamp = new Date().toISOString();
    // Tiny payload — calldata costs gas per byte. Keep keys short.
    const payload = {
      app: "coin-merge",
      kind: "score",
      wallet: input.wallet.toLowerCase(),
      best_score: input.score,
      best_tier: input.bestTier,
      legendary: input.legendaryUnlocked,
      ts: timestamp,
    };

    const txHash = await sendAchievementTx(input.wallet, payload);

    const record: RecordedScore = {
      txHash,
      network: RITUAL_NETWORK_NAME,
      timestamp,
      bestScore: input.score,
      bestTier: input.bestTier,
      legendaryUnlocked: input.legendaryUnlocked,
    };
    saveRecordedScore(input.wallet, record);
    return { ok: true, record };
  } catch (e) {
    if (e instanceof RitualError) {
      return { ok: false, kind: e.kind, message: e.message };
    }
    return {
      ok: false,
      kind: "failed",
      message: "Something went wrong while recording your score.",
    };
  }
}
