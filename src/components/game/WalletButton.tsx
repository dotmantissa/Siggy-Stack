import { useEffect, useRef, useState } from "react";
import { Wallet, LogOut, Loader2 } from "lucide-react";
import { shortenAddress, useWallet } from "@/hooks/useWallet";

// Lightweight wallet button. Sits at the top of the game without distracting from play.
// Game logic lives elsewhere — this component is purely presentational + uses the wallet hook.
export function WalletButton() {
  const { address, status, error, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);
  const popRef = useRef<HTMLDivElement | null>(null);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  if (status === "connected" && address) {
    return (
      <div className="wallet" ref={popRef}>
        <button
          className="wallet__btn wallet__btn--connected"
          onClick={() => setOpen((o) => !o)}
          aria-label="Wallet menu"
        >
          <span className="wallet__dot" />
          <span className="wallet__addr">{shortenAddress(address)}</span>
        </button>
        {open && (
          <div className="wallet__menu" role="menu">
            <button
              className="wallet__menu-item"
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
            >
              <LogOut size={14} />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet">
      <button
        className="wallet__btn"
        onClick={connect}
        disabled={status === "connecting"}
        aria-label="Connect wallet"
      >
        {status === "connecting" ? (
          <Loader2 size={14} className="wallet__spin" />
        ) : (
          <Wallet size={14} />
        )}
        <span>{status === "connecting" ? "Connecting…" : "Connect Wallet"}</span>
      </button>
      {error && status !== "connecting" && (
        <p className="wallet__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
