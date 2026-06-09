import { CheckCircle2, Loader2, Trophy } from "lucide-react";
import { type RecordedScore } from "@/lib/ritual";
import { ExplorerLink } from "./ExplorerLink";

type Status = "not_recorded" | "recording" | "synced" | "failed";

interface Props {
  wallet: string | null;
  record: RecordedScore | null;
  status: Status;
  errorMessage?: string | null;
}

/**
 * "Ritual Score" card — purely presentational. Owns no flow logic; the parent
 * passes in the current status + persisted record. This keeps the card easy
 * to reuse from anywhere (profile page, end-of-game screen, etc.).
 */
export function RitualScoreCard({ wallet, record, status, errorMessage }: Props) {
  if (!wallet) return null;

  return (
    <section className="ritual" aria-label="Ritual Score">
      <header className="ritual__head">
        <div className="ritual__title">
          <Trophy size={16} />
          <span>Ritual Score</span>
        </div>
        <StatusChip status={status} />
      </header>

      <dl className="ritual__rows">
        <div className="ritual__row">
          <dt>Best Recorded Score</dt>
          <dd className={record ? "is-eligible" : undefined}>
            {record ? record.bestScore.toLocaleString() : "—"}
          </dd>
        </div>
        <div className="ritual__row">
          <dt>Status</dt>
          <dd>
            <StatusLabel status={status} />
          </dd>
        </div>
      </dl>

      {record?.txHash && status === "synced" && (
        <ExplorerLink txHash={record.txHash} />
      )}

      {errorMessage ? (
        <p className="ritual__hint ritual__hint--error">{errorMessage}</p>
      ) : (
        <p className="ritual__hint">
          {status === "synced"
            ? "Your best score is recorded on Ritual."
            : status === "recording"
            ? "Waiting for wallet confirmation…"
            : "Beat your best score to record it on Ritual."}
        </p>
      )}
    </section>
  );
}

function StatusChip({ status }: { status: Status }) {
  if (status === "recording") {
    return (
      <span className="ritual__chip">
        <Loader2 size={11} className="ritual__spin" /> Recording
      </span>
    );
  }
  if (status === "synced") {
    return (
      <span className="ritual__chip">
        <CheckCircle2 size={11} /> Synced
      </span>
    );
  }
  if (status === "failed") return <span className="ritual__chip">Failed</span>;
  return <span className="ritual__chip">Not Recorded</span>;
}

function StatusLabel({ status }: { status: Status }) {
  switch (status) {
    case "synced":
      return <span className="is-eligible">Synced ✓</span>;
    case "recording":
      return <span>Recording…</span>;
    case "failed":
      return <span>Failed</span>;
    default:
      return <span>Not Recorded</span>;
  }
}
