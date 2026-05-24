import { createFileRoute } from "@tanstack/react-router";
import { CoinMergeGame } from "@/components/game/CoinMergeGame";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Coin Merge — Swipe to merge coins from DOGE to LEGENDARY" },
      {
        name: "description",
        content:
          "Coin Merge is a mobile-first 2048-style puzzle. Swipe to merge DOGE, PEPE, SOL, ETH, BTC and reach LEGENDARY.",
      },
    ],
  }),
});

function Index() {
  return (
    <main className="game-page">
      <CoinMergeGame />
    </main>
  );
}
