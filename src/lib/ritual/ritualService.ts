// Low-level Ritual testnet service.
//
// Talks directly to the user's injected EIP-1193 wallet (MetaMask, Rabby…).
// Responsibilities:
//   - Ensure the wallet is on the Ritual chain (switch / add if needed).
//   - Send a single transaction whose calldata carries our achievement JSON.
//
// Why a self-transaction with calldata?
//   We don't have a deployed contract yet. The cheapest, contract-free way to
//   leave a verifiable record on an EVM testnet is to send a 0-value tx from
//   the user's address TO their own address, with the achievement payload
//   encoded in the `data` field. Anyone can later inspect the tx and decode
//   the JSON from calldata. This keeps the integration lightweight while
//   still being a real onchain interaction.
//
// FUTURE: swap `to` for a real Ritual achievement contract address and
// replace the raw JSON calldata with an ABI-encoded function call.

import { RITUAL_CHAIN } from "./networkConfig";

type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getProvider(): Eip1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: Eip1193Provider }).ethereum;
}

// Beginner-friendly error messages mapped from common EIP-1193 error codes.
export type RitualErrorKind =
  | "no_wallet"
  | "rejected"
  | "network"
  | "failed";

export class RitualError extends Error {
  kind: RitualErrorKind;
  constructor(kind: RitualErrorKind, message: string) {
    super(message);
    this.kind = kind;
  }
}

function toHex(str: string): string {
  // UTF-8 → hex, prefixed with "0x" — the canonical EVM calldata format.
  const bytes = new TextEncoder().encode(str);
  let hex = "0x";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/** Ensure the wallet is on the Ritual chain. Adds it if missing. */
export async function ensureRitualNetwork(): Promise<void> {
  const provider = getProvider();
  if (!provider) {
    throw new RitualError(
      "no_wallet",
      "No wallet detected. Please connect a wallet first.",
    );
  }

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: RITUAL_CHAIN.chainId }],
    });
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    // 4902 = chain not added to the wallet yet → add it.
    if (err?.code === 4902) {
      try {
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [RITUAL_CHAIN],
        });
      } catch (addErr: unknown) {
        const ae = addErr as { code?: number };
        if (ae?.code === 4001) {
          throw new RitualError("rejected", "You rejected the network request.");
        }
        throw new RitualError(
          "network",
          "Could not add the Ritual network to your wallet.",
        );
      }
    } else if (err?.code === 4001) {
      throw new RitualError("rejected", "You rejected the network switch.");
    } else {
      throw new RitualError(
        "network",
        "Could not switch your wallet to the Ritual network.",
      );
    }
  }
}

/**
 * Send a single self-transaction carrying the achievement payload in calldata.
 * Returns the resulting transaction hash.
 */
export async function sendAchievementTx(
  wallet: string,
  payload: object,
): Promise<string> {
  const provider = getProvider();
  if (!provider) {
    throw new RitualError("no_wallet", "No wallet detected.");
  }

  const data = toHex(JSON.stringify(payload));

  try {
    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: wallet,
          to: wallet, // self-tx; no contract needed
          value: "0x0",
          data,
        },
      ],
    })) as string;
    return txHash;
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err?.code === 4001) {
      throw new RitualError("rejected", "You rejected the transaction.");
    }
    // -32000 / -32603 etc. → generic failure (insufficient funds, RPC down…)
    throw new RitualError(
      "failed",
      err?.message || "The transaction could not be sent.",
    );
  }
}
