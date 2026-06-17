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

// Fetch EIP-1559 fee params directly from the Ritual RPC (bypasses wallet proxy).
async function fetchEip1559Fees(): Promise<{ maxFeePerGas: string; maxPriorityFeePerGas: string }> {
  const tip = 1_000_000_000n; // 1 gwei priority fee
  const fallbackCap = "0x77359401"; // 2 gwei — used if RPC call fails
  try {
    const res = await fetch(RITUAL_CHAIN.rpcUrls[0], {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "eth_getBlockByNumber",
        params: ["latest", false],
      }),
    });
    const json = await res.json() as { result?: { baseFeePerGas?: string } };
    const base = BigInt(json.result?.baseFeePerGas ?? "0x7");
    const cap = base * 2n + tip;
    return {
      maxFeePerGas: "0x" + cap.toString(16),
      maxPriorityFeePerGas: "0x" + tip.toString(16),
    };
  } catch {
    return { maxFeePerGas: fallbackCap, maxPriorityFeePerGas: "0x3b9aca00" };
  }
}

// Submit a raw signed transaction directly to the Ritual RPC, bypassing the wallet.
async function sendRawToRitual(signedTx: string): Promise<string> {
  const res = await fetch(RITUAL_CHAIN.rpcUrls[0], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "eth_sendRawTransaction",
      params: [signedTx],
    }),
  });
  const json = await res.json() as { result?: string; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  if (!json.result) throw new Error("No transaction hash returned.");
  return json.result;
}

/**
 * Send the achievement payload to SiggyAchievements.record(bytes).
 *
 * Strategy (most → least reliable for Ritual Chain):
 *   1. eth_signTransaction → eth_sendRawTransaction direct to RPC
 *      Bypasses the wallet's gas-type inference entirely. Works in Rabby / Frame.
 *   2. eth_sendTransaction with explicit EIP-1559 fields
 *      Fallback for wallets (e.g. MetaMask) that removed eth_signTransaction.
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
  const { maxFeePerGas, maxPriorityFeePerGas } = await fetchEip1559Fees();

  const txParams = {
    type: "0x2",
    from: wallet,
    to: SIGGY_ACHIEVEMENTS_ADDRESS,
    value: "0x0",
    data,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: RITUAL_CHAIN.chainId,
  };

  // Path 1: sign without broadcasting, then submit raw bytes directly to the RPC.
  // This bypasses wallet internals that may convert EIP-1559 → legacy.
  try {
    const signedTx = (await provider.request({
      method: "eth_signTransaction",
      params: [txParams],
    })) as string;
    return await sendRawToRitual(signedTx);
  } catch (signErr: unknown) {
    const se = signErr as { code?: number; message?: string };
    // User explicitly rejected — surface immediately, don't fall through.
    if (se?.code === 4001) {
      throw new RitualError("rejected", "You rejected the transaction.");
    }
    // Otherwise (e.g. MetaMask: "method not found") → fall through to Path 2.
  }

  // Path 2: eth_sendTransaction with explicit EIP-1559 fields.
  try {
    const txHash = (await provider.request({
      method: "eth_sendTransaction",
      params: [txParams],
    })) as string;
    return txHash;
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err?.code === 4001) {
      throw new RitualError("rejected", "You rejected the transaction.");
    }
    throw new RitualError(
      "failed",
      err?.message || "The transaction could not be sent.",
    );
  }
}
