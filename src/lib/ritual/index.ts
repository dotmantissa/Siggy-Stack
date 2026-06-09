// Public surface for the Ritual integration.
//
// UI code should import from `@/lib/ritual` (this barrel) rather than the
// individual files so future refactors stay contained.

export {
  RITUAL_NETWORK_NAME,
  RITUAL_EXPLORER_URL,
  RITUAL_CHAIN,
  explorerTxUrl,
  explorerAddressUrl,
} from "./networkConfig";
export {
  ensureRitualNetwork,
  sendAchievementTx,
  RitualError,
  type RitualErrorKind,
} from "./ritualService";
export {
  recordLegendaryAchievement,
  loadRecorded,
  type AchievementInput,
  type RecordedAchievement,
  type RecordOutcome,
} from "./achievementRecorder";
export {
  recordBestScore,
  loadRecordedScore,
  type ScoreInput,
  type RecordedScore,
  type ScoreOutcome,
} from "./scoreRecorder";
export { isNewBestScore } from "./scoreValidation";
