// Lightweight analytics event bus for Coin Merge.
//
// Goals:
//   - Single, typed surface for emitting product events.
//   - Zero runtime dependency: events are dispatched on `window` as
//     CustomEvents and also logged to console under a stable prefix.
//   - Easy to wire to any analytics provider later (PostHog, Plausible,
//     Mixpanel, GA…) — just add a listener in one place.
//
// USAGE:
//   import { track } from "@/lib/analytics";
//   track("wallet_connected", { wallet });
//
// FUTURE: register a provider once at app boot:
//   window.addEventListener("coin-merge:analytics", (e) => {
//     provider.capture(e.detail.event, e.detail.props);
//   });

export type AnalyticsEvent =
  | "wallet_connected"
  | "wallet_disconnected"
  | "game_started"
  | "game_ended"
  | "new_high_score"
  | "legendary_unlocked"
  | "achievement_recorded"
  | "score_recorded"
  | "gsiggy_minted"
  | "explorer_opened";

export interface AnalyticsPayload {
  [key: string]: string | number | boolean | null | undefined;
}

const EVENT_NAME = "coin-merge:analytics";

/** Fire-and-forget event. Safe to call during SSR (no-op). */
export function track(event: AnalyticsEvent, props: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;
  const detail = { event, props, ts: Date.now() };
  try {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  } catch {
    /* CustomEvent unavailable — fall through to console only */
  }
  // Stable, greppable log line for debugging in dev tools.
  if (typeof console !== "undefined") {
    console.debug(`[analytics] ${event}`, props);
  }
}

export const ANALYTICS_EVENT_NAME = EVENT_NAME;
