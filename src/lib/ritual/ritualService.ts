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

// Direct JSON-RPC call to the Ritual RPC endpoint (bypasses wallet proxy).
async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RITUAL_CHAIN.rpcUrls[0], {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json() as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(json.error.message);
  return json.result as T;
}

/**
 * Send the achievement payload to SiggyAchievements.record(bytes).
 *
 * Ritual Chain only accepts EIP-1559 (type-2) transactions. Many wallets
 * silently downgrade custom chains to legacy. We work around this by:
 *
 *   Path 1 — fully-specified eth_signTransaction → eth_sendRawTransaction
 *     Pre-fetch nonce, gas, and fees directly from the Ritual RPC so the
 *     transaction is complete before the wallet sees it. A complete tx
 *     forces wallets to sign as-is rather than re-estimating the type.
 *     Submit the raw signed bytes directly to the Ritual RPC, bypassing
 *     any wallet-side type conversion on broadcast.
 *
 *   Path 2 — eth_sendTransaction fallback
 *     For wallets that removed eth_signTransaction (e.g. MetaMask).
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

  // Fetch all tx fields directly from the Ritual RPC (not via wallet proxy).
  const tip = 1_000_000_000n; // 1 gwei priority fee
  let maxFeePerGas = "0x77359401"; // 2 gwei fallback
  let nonce = "0x0";
  let gas = "0xcf08"; // 53000 fallback

  try {
    const [block, nonceHex, gasEst] = await Promise.all([
      rpcCall<{ baseFeePerGas?: string }>("eth_getBlockByNumber", ["latest", false]),
      rpcCall<string>("eth_getTransactionCount", [wallet, "pending"]),
      rpcCall<string>("eth_estimateGas", [{
        from: wallet,
        to: SIGGY_ACHIEVEMENTS_ADDRESS,
        value: "0x0",
        data,
      }]),
    ]);
    const base = BigInt(block?.baseFeePerGas ?? "0x7");
    maxFeePerGas = "0x" + (base * 2n + tip).toString(16);
    nonce = nonceHex;
    // Add 20% gas buffer to the estimate.
    gas = "0x" + ((BigInt(gasEst) * 12n) / 10n).toString(16);
  } catch {
    /* proceed with fallbacks */
  }

  const maxPriorityFeePerGas = "0x" + tip.toString(16);

  // Fully-specified tx params — no field left for the wallet to "fix".
  const txParams = {
    type: "0x2",
    from: wallet,
    to: SIGGY_ACHIEVEMENTS_ADDRESS,
    value: "0x0",
    data,
    nonce,
    gas,
    maxFeePerGas,
    maxPriorityFeePerGas,
    chainId: RITUAL_CHAIN.chainId,
  };

  // Path 1: sign (without broadcast) → submit raw bytes directly to Ritual RPC.
  try {
    const signedTx = (await provider.request({
      method: "eth_signTransaction",
      params: [txParams],
    })) as string;

    return await rpcCall<string>("eth_sendRawTransaction", [signedTx]);
  } catch (signErr: unknown) {
    const se = signErr as { code?: number; message?: string };
    if (se?.code === 4001) {
      throw new RitualError("rejected", "You rejected the transaction.");
    }
    // Method not supported (e.g. MetaMask) → fall through.
  }

  // Path 2: eth_sendTransaction fallback.
  try {
    return (await provider.request({
      method: "eth_sendTransaction",
      params: [txParams],
    })) as string;
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
