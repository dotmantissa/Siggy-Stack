// Ritual testnet network configuration.
// Chain ID 1979 (0x7BB) — https://docs.ritualfoundation.org

const env = ((typeof import.meta !== "undefined" && import.meta.env) ||
  {}) as Record<string, string | undefined>;

export const RITUAL_NETWORK_NAME =
  env.VITE_RITUAL_CHAIN_NAME || "Ritual";

// Public Ritual block explorer. Used for "View on Ritual Explorer" links.
export const RITUAL_EXPLORER_URL =
  env.VITE_RITUAL_EXPLORER_URL || "https://explorer.ritualfoundation.org";

// EIP-3085 chain params — used to add the chain to the wallet if missing.
export const RITUAL_CHAIN = {
  chainId: env.VITE_RITUAL_CHAIN_ID || "0x7BB", // Ritual testnet chain ID 1979
  chainName: RITUAL_NETWORK_NAME,
  nativeCurrency: {
    name: env.VITE_RITUAL_CURRENCY_SYMBOL || "RITUAL",
    symbol: env.VITE_RITUAL_CURRENCY_SYMBOL || "RITUAL",
    decimals: 18,
  },
  rpcUrls: [
    env.VITE_RITUAL_RPC_URL || "https://rpc.ritualfoundation.org",
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

// Deployed SiggyAchievements contract — records player achievements on-chain.
export const SIGGY_ACHIEVEMENTS_ADDRESS: `0x${string}` =
  (env.VITE_SIGGY_ACHIEVEMENTS_ADDRESS as `0x${string}`) ||
  "0xB74AB4b11871CD75a1CaD4F2CAa8E9F0De447F78";
