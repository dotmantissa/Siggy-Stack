import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";

// Minimal EIP-1193 wallet hook.
// Works with any injected browser wallet (MetaMask, Rabby, Coinbase, Trust, etc.)
// On mobile without an injected provider, we deep-link into MetaMask's in-app browser.
// No heavy dependencies — beginner-friendly and easy to swap later for wagmi/web3modal.

const STORAGE_KEY = "coin-merge-wallet-connected";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export type WalletStatus = "idle" | "connecting" | "connected" | "error";

export function shortenAddress(addr: string): string {
  if (!addr) return "";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

function getProvider(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return window.ethereum;
}

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Try to silently restore a previous session on mount (no popup).
  useEffect(() => {
    const provider = getProvider();
    if (!provider) return;
    const wasConnected = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (!wasConnected) return;

    provider
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const list = accounts as string[];
        if (list && list.length > 0) {
          setAddress(list[0]);
          setStatus("connected");
        }
      })
      .catch(() => {
        /* ignore silent restore errors */
      });
  }, []);

  // Listen for account/chain changes from the wallet.
  useEffect(() => {
    const provider = getProvider();
    if (!provider?.on) return;

    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        setAddress(null);
        setStatus("idle");
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        setAddress(accounts[0]);
        setStatus("connected");
      }
    };

    provider.on("accountsChanged", onAccountsChanged);
    return () => provider.removeListener?.("accountsChanged", onAccountsChanged);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const provider = getProvider();

    // No injected wallet — guide mobile users into MetaMask's in-app browser.
    if (!provider) {
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const host = window.location.host + window.location.pathname;
        window.location.href = `https://metamask.app.link/dapp/${host}`;
        return;
      }
      setStatus("error");
      setError("No wallet detected. Install MetaMask or another browser wallet.");
      return;
    }

    try {
      setStatus("connecting");
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as string[];
      if (accounts && accounts.length > 0) {
        setAddress(accounts[0]);
        setStatus("connected");
        window.localStorage.setItem(STORAGE_KEY, "1");
      } else {
        setStatus("idle");
      }
    } catch (e: unknown) {
      // EIP-1193 user rejection = code 4001
      const err = e as { code?: number; message?: string };
      if (err?.code === 4001) {
        setStatus("idle");
        setError("Connection request rejected.");
      } else {
        setStatus("error");
        setError(err?.message || "Failed to connect wallet.");
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    // Wallets don't expose a true "disconnect" — we just clear local session.
    setAddress(null);
    setStatus("idle");
    setError(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { address, status, error, connect, disconnect };
}
