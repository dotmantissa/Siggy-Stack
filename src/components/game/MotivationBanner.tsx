import { Sparkles } from "lucide-react";

interface Props {
  // What we know about the player, used to pick the most relevant nudge.
  eligible: boolean;
  bestTier: number;
  streak: number;
  challengesDone: number;
  challengesTotal: number;
}

// Lightweight motivational nudge surfaced above the game shell.
// Chooses the most relevant message based on current player state.
export function MotivationBanner({
  eligible,
  bestTier,
  streak,
  challengesDone,
  challengesTotal,
}: Props) {
  const msg = pickMessage({ eligible, bestTier, streak, challengesDone, challengesTotal });
  if (!msg) return null;
  return (
    <div className="motiv" role="status">
      <Sparkles size={12} />
      <span>{msg}</span>
    </div>
  );
}

function pickMessage(p: Props): string | null {
  if (!p.eligible && p.bestTier === 4)
    return "You are one tile away from becoming a Ritual Legend";
  if (p.challengesDone < p.challengesTotal && p.challengesTotal > 0)
    return "Daily Ritual challenge available — claim it before reset";
  if (p.streak >= 3)
    return `${p.streak}-day Ritual streak — keep it alive`;
  if (p.eligible)
    return "gSiggy eligibility unlocked · holders shine on the leaderboard";
  if (p.bestTier >= 2)
    return "Reach Ritual LEGENDARY to unlock gSiggy eligibility";
  return "Merge coins · climb tiers · become a Ritual Legend";
}
