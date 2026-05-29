import { Sparkles } from "lucide-react";
import { shortenAddress } from "@/hooks/useWallet";
import { tierName } from "@/lib/gsiggy";

interface Props {
  address: string;
  bestScore: number;
  bestTier: number;
  eligible: boolean;
}

// Shown only when a wallet is connected.
export function ProfileCard({ address, bestScore, bestTier, eligible }: Props) {
  return (
    <section className="profile">
      <header className="profile__head">
        <span className="profile__dot" aria-hidden />
        <span className="profile__addr">{shortenAddress(address)}</span>
        {eligible && (
          <span className="profile__badge" title="gSiggy eligible">
            <Sparkles size={11} />
            gSiggy
          </span>
        )}
      </header>
      <div className="profile__grid">
        <div className="profile__stat">
          <span className="profile__stat-label">Best score</span>
          <span className="profile__stat-value">{bestScore}</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-label">Best tile</span>
          <span className="profile__stat-value">{tierName(bestTier)}</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-label">gSiggy</span>
          <span
            className={`profile__stat-value ${eligible ? "is-eligible" : "is-locked"}`}
          >
            {eligible ? "Eligible" : "Locked"}
          </span>
        </div>
      </div>
    </section>
  );
}
