// Daily challenges for Coin Merge.
//
// Three challenges are generated deterministically per UTC date so every
// player sees the same set today (and a fresh set tomorrow). Progress is
// stored per wallet+date in localStorage. Completion history persists
// across days for the "completed history" surface.
//
// Pure module — no UI / no Supabase. Easy to swap for an onchain or
// server-backed version later.

export type ChallengeKind =
  | "reach_tier"
  | "score_at_least"
  | "beat_yesterday";

export interface ChallengeDef {
  id: string;
  kind: ChallengeKind;
  title: string;
  description: string;
  // For reach_tier: required tier index. For score_at_least: required score.
  target: number;
}

// Pool of possible challenges. Three are picked deterministically per day.
const POOL: ChallengeDef[] = [
  { id: "reach_sol",        kind: "reach_tier",      title: "Reach SOL",        description: "Forge a SOL tile",       target: 2 },
  { id: "reach_eth",        kind: "reach_tier",      title: "Reach ETH",        description: "Forge an ETH tile",      target: 3 },
  { id: "reach_btc",        kind: "reach_tier",      title: "Reach BTC",        description: "Forge a BTC tile",       target: 4 },
  { id: "reach_legendary",  kind: "reach_tier",      title: "Ritual Legend",    description: "Unlock the LEGENDARY tile", target: 5 },
  { id: "score_500",        kind: "score_at_least",  title: "Score 500+",       description: "Finish a run with 500+ points",  target: 500 },
  { id: "score_1000",       kind: "score_at_least",  title: "Score 1,000+",     description: "Finish a run with 1,000+ points", target: 1000 },
  { id: "score_2500",       kind: "score_at_least",  title: "Score 2,500+",     description: "Finish a run with 2,500+ points", target: 2500 },
  { id: "beat_yesterday",   kind: "beat_yesterday",  title: "Beat Yesterday",   description: "Beat yesterday's best score", target: 0 },
];

// ------- Deterministic daily pick -------

function hashSeed(seed: string): number {
  // Tiny string hash → 32-bit int.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dailyChallenges(date: string = todayUtc()): ChallengeDef[] {
  const seed = hashSeed(`coin-merge:${date}`);
  const pool = [...POOL];
  // Fisher-Yates with seeded LCG so the order is stable per day.
  let s = seed || 1;
  for (let i = pool.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}

// ------- Per-wallet, per-day progress -------

export interface ChallengeProgress {
  date: string;
  completed: Record<string, boolean>;
}

const KEY = "coin-merge-challenges";
const HISTORY_KEY = "coin-merge-challenges-history";

function progressKey(wallet?: string | null): string {
  return wallet ? `${KEY}:${wallet.toLowerCase()}` : KEY;
}

export function loadProgress(wallet?: string | null): ChallengeProgress {
  if (typeof window === "undefined") return { date: todayUtc(), completed: {} };
  try {
    const raw = window.localStorage.getItem(progressKey(wallet));
    if (!raw) return { date: todayUtc(), completed: {} };
    const parsed = JSON.parse(raw) as ChallengeProgress;
    // New day → reset progress (history is preserved separately).
    if (parsed.date !== todayUtc()) return { date: todayUtc(), completed: {} };
    return parsed;
  } catch {
    return { date: todayUtc(), completed: {} };
  }
}

export function saveProgress(
  wallet: string | null | undefined,
  p: ChallengeProgress,
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(progressKey(wallet), JSON.stringify(p));
}

// Append a completed-on-date entry to the local history list.
export interface HistoryEntry {
  date: string;
  id: string;
  title: string;
}

function historyKey(wallet?: string | null): string {
  return wallet ? `${HISTORY_KEY}:${wallet.toLowerCase()}` : HISTORY_KEY;
}

export function loadHistory(wallet?: string | null): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(historyKey(wallet)) ?? "[]");
  } catch {
    return [];
  }
}

function appendHistory(wallet: string | null | undefined, entry: HistoryEntry) {
  if (typeof window === "undefined") return;
  const list = loadHistory(wallet);
  // Dedupe (one entry per id+date).
  if (list.some((h) => h.id === entry.id && h.date === entry.date)) return;
  list.unshift(entry);
  window.localStorage.setItem(historyKey(wallet), JSON.stringify(list.slice(0, 50)));
}

// Evaluate a finished run against today's challenges. Returns the list of
// challenge IDs newly completed this run.
export function evaluateRun(
  wallet: string | null | undefined,
  run: { score: number; bestTier: number; yesterdayBest?: number },
): string[] {
  const challenges = dailyChallenges();
  const progress = loadProgress(wallet);
  const newlyCompleted: string[] = [];

  for (const c of challenges) {
    if (progress.completed[c.id]) continue;
    let done = false;
    if (c.kind === "reach_tier") done = run.bestTier >= c.target;
    else if (c.kind === "score_at_least") done = run.score >= c.target;
    else if (c.kind === "beat_yesterday")
      done = run.yesterdayBest != null && run.score > run.yesterdayBest;
    if (done) {
      progress.completed[c.id] = true;
      newlyCompleted.push(c.id);
      appendHistory(wallet, { date: progress.date, id: c.id, title: c.title });
    }
  }
  saveProgress(wallet, progress);
  return newlyCompleted;
}

// Compute % completion for the "progress" surface.
export function progressPercent(progress: ChallengeProgress): number {
  const challenges = dailyChallenges();
  if (challenges.length === 0) return 0;
  const done = challenges.filter((c) => progress.completed[c.id]).length;
  return Math.round((done / challenges.length) * 100);
}
