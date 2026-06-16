// Low-level Ritual testnet service.
//
// Talks directly to the user's injected EIP-1193 wallet (MetaMask, Rabby…).
// Responsibilities:
//   - Ensure the wallet is on the Ritual chain (switch / add if needed).
//   - Send a transaction to SiggyAchievements.record(bytes) with the JSON payload.

import { RITUAL_CHAIN, SIGGY_ACHIEVEMENTS_ADDRESS } from "./networkConfig";

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

// ABI-encode a call to SiggyAchievements.record(bytes calldata data).
// Selector: 0xe1112648 (keccak256("record(bytes)")[:4])
// Layout:  selector(4) | offset(32) | length(32) | data(ceil(len/32)*32)
function encodeRecordCall(jsonPayload: string): string {
  const utf8 = new TextEncoder().encode(jsonPayload);
  const len = utf8.length;
  const paddedLen = Math.ceil(len / 32) * 32 || 32;
  const buf = new Uint8Array(4 + 32 + 32 + paddedLen);
  // selector
  buf[0] = 0xe1; buf[1] = 0x11; buf[2] = 0x26; buf[3] = 0x48;
  // offset = 0x20 (32)
  buf[4 + 31] = 0x20;
  // length
  let l = len;
  for (let i = 31; i >= 0; i--) { buf[4 + 32 + i] = l & 0xff; l >>= 8; }
  // data
  buf.set(utf8, 4 + 32 + 32);
  let hex = "0x";
  for (const b of buf) hex += b.toString(16).padStart(2, "0");
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

  const data = encodeRecordCall(JSON.stringify(payload));

  try {
    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: wallet,
          to: SIGGY_ACHIEVEMENTS_ADDRESS,
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
