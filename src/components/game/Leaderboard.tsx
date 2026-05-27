import { useCallback, useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import {
  fetchTodayLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { shortenAddress } from "@/hooks/useWallet";

interface Props {
  // Connected wallet (lowercase or checksum) so we can highlight that row.
  currentWallet?: string | null;
  // Bumped by the game whenever a new score is submitted, to trigger a refetch.
  refreshKey?: number;
}

// Daily leaderboard panel. Read-only — submissions happen from gameplay.
export function Leaderboard({ currentWallet, refreshKey = 0 }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchTodayLeaderboard(50);
    setEntries(data);
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
            return (
              <li
                key={e.wallet_address}
                className={`lb__row ${isMe ? "lb__row--me" : ""}`}
              >
                <span className="lb__rank">{i + 1}</span>
                <span className="lb__addr">
                  {shortenAddress(e.wallet_address)}
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
