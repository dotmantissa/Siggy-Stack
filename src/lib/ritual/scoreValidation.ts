// Score validation helpers.
//
// Kept as a tiny standalone module so the rules ("is this a new best?") stay
// in one place and are trivial to unit-test or extend later (e.g. weekly best,
// tier-weighted best, etc.) without touching the recorder or UI.

import { loadRecordedScore } from "./scoreRecorder";

export interface ScoreCandidate {
  wallet: string;
  score: number;
}

/** Is this score strictly higher than the player's last recorded best? */
export function isNewBestScore(candidate: ScoreCandidate): boolean {
  if (!candidate.wallet || candidate.score <= 0) return false;
  const previous = loadRecordedScore(candidate.wallet);
  if (!previous) return true;
  return candidate.score > previous.bestScore;
}
