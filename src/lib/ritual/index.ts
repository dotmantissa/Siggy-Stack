// Public surface for the Ritual integration.
//
// UI code should import from `@/lib/ritual` (this barrel) rather than the
// individual files so future refactors stay contained.

export {
  RITUAL_NETWORK_NAME,
  RITUAL_CHAIN,
  explorerTxUrl,
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
