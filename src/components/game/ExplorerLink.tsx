import { ExternalLink } from "lucide-react";
import { explorerTxUrl, RITUAL_NETWORK_NAME } from "@/lib/ritual";
import { track } from "@/lib/analytics";

interface Props {
  txHash: string;
  label?: string;
  variant?: "link" | "button";
}

/**
 * "View on Ritual Explorer" — single source of truth for explorer links.
 * Emits an `explorer_opened` analytics event so we can measure how often
 * players verify their onchain records.
 */
export function ExplorerLink({
  txHash,
  label = "View on Ritual Explorer",
  variant = "link",
}: Props) {
  const href = explorerTxUrl(txHash);
  const className = variant === "button" ? "explorer-btn" : "ritual__tx";
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() =>
        track("explorer_opened", { tx: txHash, network: RITUAL_NETWORK_NAME })
      }
    >
      {label} <ExternalLink size={11} />
    </a>
  );
}
