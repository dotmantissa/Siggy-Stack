import { useCallback, useEffect, useState } from "react";
import { Trophy, RefreshCw, Sparkles, Flame, Crown } from "lucide-react";
import {
  fetchTodayLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { fetchEligibleSet } from "@/lib/gsiggy";
import { fetchStreaks } from "@/lib/streak";
import { shortenAddress } from "@/hooks/useWallet";

interface Props {
  currentWallet?: string | null;
  refreshKey?: number;
  playerRank?: number | null;
}

// Daily leaderboard panel. Per-row enrichment:
//  - gSiggy holder badge
//  - Ritual Legend indicator (same eligibility = legend status today)
//  - Daily streak in days
export function Leaderboard({ currentWallet, refreshKey = 0, playerRank = null }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [eligible, setEligible] = useState<Set<string>>(new Set());
  const [streaks, setStreaks] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchTodayLeaderboard(50);
    setEntries(data);
    const wallets = data.map((d) => d.wallet_address);
    const [elig, str] = await Promise.all([
      fetchEligibleSet(wallets),
      fetchStreaks(wallets),
    ]);
    setEligible(elig);
    setStreaks(str);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const lowerWallet = currentWallet?.toLowerCase() ?? null;

  return (
    <section className="lb">
      <header className="lb__head">
        <div className="lb__title">
          <Trophy size={16} />
          <span>Daily Leaderboard</span>
        </div>
        {playerRank ? (
          <span className="lb__myrank" title="Your rank today">
            #{playerRank}
          </span>
        ) : null}
        <button
          className="lb__refresh"
          onClick={load}
          aria-label="Refresh leaderboard"
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? "lb__spin" : ""} />
        </button>
      </header>

      {loading && entries.length === 0 ? (
        <p className="lb__empty">Loading today's scores…</p>
      ) : entries.length === 0 ? (
        <p className="lb__empty">No scores yet today. Be the first!</p>
      ) : (
        <ol className="lb__list">
          {entries.map((e, i) => {
            const isMe = lowerWallet && e.wallet_address === lowerWallet;
            const isEligible = eligible.has(e.wallet_address);
            const streak = streaks.get(e.wallet_address) ?? 0;
            return (
              <li
                key={e.wallet_address}
                className={`lb__row ${isMe ? "lb__row--me" : ""} ${
                  isEligible ? "lb__row--legend" : ""
                }`}
              >
                <span className="lb__rank">{i + 1}</span>
                <span className="lb__addr">
                  {shortenAddress(e.wallet_address)}
                  {isEligible && (
                    <span className="lb__legend" title="Ritual Legend">
                      <Crown size={9} />
                    </span>
                  )}
                  {isEligible && (
                    <span className="lb__gsiggy" title="gSiggy eligible">
                      <Sparkles size={9} />
                    </span>
                  )}
                  {streak > 1 && (
                    <span className="lb__streak" title={`${streak}-day streak`}>
                      <Flame size={9} />
                      {streak}
                    </span>
                  )}
                  {isMe && <span className="lb__you">you</span>}
                </span>
                <span className="lb__score">{e.score}</span>
              </li>
            );
          })}
        </ol>
      )}
      <p className="lb__note">Resets daily (UTC) · Top 50</p>
    </section>
  );
}
