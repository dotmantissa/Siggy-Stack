// Ritual testnet network configuration.
//
// These values can be overridden at build time via Vite env vars so we don't
// have to hardcode a moving testnet target. Defaults are sane placeholders
// for a generic EVM testnet — set the real Ritual values in `.env` when
// they're published:
//
//   VITE_RITUAL_CHAIN_ID=0x...        (hex, e.g. "0xaa36a7")
//   VITE_RITUAL_CHAIN_NAME="Ritual Testnet"
//   VITE_RITUAL_RPC_URL=https://...
//   VITE_RITUAL_EXPLORER_URL=https://...
//   VITE_RITUAL_CURRENCY_SYMBOL=ETH

const env = ((typeof import.meta !== "undefined" && import.meta.env) ||
  {}) as Record<string, string | undefined>;

export const RITUAL_NETWORK_NAME =
  env.VITE_RITUAL_CHAIN_NAME || "Ritual Testnet";

// Public Ritual block explorer. Used for "View on Ritual Explorer" links.
export const RITUAL_EXPLORER_URL =
  env.VITE_RITUAL_EXPLORER_URL || "https://explorer.ritualfoundation.org";

// EIP-3085 chain params — used to add the chain to the wallet if missing.
export const RITUAL_CHAIN = {
  chainId: env.VITE_RITUAL_CHAIN_ID || "0xaa36a7", // default: Sepolia placeholder
  chainName: RITUAL_NETWORK_NAME,
  nativeCurrency: {
    name: env.VITE_RITUAL_CURRENCY_SYMBOL || "ETH",
    symbol: env.VITE_RITUAL_CURRENCY_SYMBOL || "ETH",
    decimals: 18,
  },
  rpcUrls: [
    env.VITE_RITUAL_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
  ],
  blockExplorerUrls: [RITUAL_EXPLORER_URL],
} as const;

export function explorerTxUrl(txHash: string): string {
  const base = RITUAL_EXPLORER_URL.replace(/\/$/, "");
  return `${base}/tx/${txHash}`;
}

export function explorerAddressUrl(address: string): string {
  const base = RITUAL_EXPLORER_URL.replace(/\/$/, "");
  return `${base}/address/${address}`;
}
