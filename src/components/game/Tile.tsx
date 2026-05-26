import { COINS, type Tile as TileType } from "@/lib/game";

interface Props {
  tile: TileType;
  cellSize: number;
  gap: number;
}

// Visual metadata for each coin tier. Kept here (not in game logic) so the
// game module stays pure and easy to edit.
const COIN_META: Record<
  (typeof COINS)[number],
  { symbol: string; short: string }
> = {
  DOGE: { symbol: "Ð", short: "DOGE" },
  PEPE: { symbol: "ᵱ", short: "PEPE" },
  SOL: { symbol: "◎", short: "SOL" },
  ETH: { symbol: "Ξ", short: "ETH" },
  BTC: { symbol: "₿", short: "BTC" },
  LEGENDARY: { symbol: "★", short: "LGND" },
};

export function Tile({ tile, cellSize, gap }: Props) {
  const x = tile.col * (cellSize + gap);
  const y = tile.row * (cellSize + gap);
  const coin = COINS[tile.tier];
  const meta = COIN_META[coin];

  // Slightly smaller symbol/label scaling for higher tiers' longer labels.
  const symbolSize = Math.max(18, Math.round(cellSize * 0.42));
  const labelSize = Math.max(9, Math.round(cellSize * 0.14));

  const style: React.CSSProperties & Record<"--tx" | "--ty", string> = {
    width: cellSize,
    height: cellSize,
    transform: `translate(${x}px, ${y}px)`,
    "--tx": `${x}px`,
    "--ty": `${y}px`,
  };

  return (
    <div
      className={`coin-tile coin-tile--${coin.toLowerCase()} ${
        tile.mergedFrom ? "coin-tile--merged" : ""
      } ${tile.isNew ? "coin-tile--new" : ""}`}
      style={style}
    >
      {/* Inner coin face — gives the tile depth like a real coin. */}
      <div className="coin-tile__face">
        <span className="coin-tile__symbol" style={{ fontSize: symbolSize }}>
          {meta.symbol}
        </span>
        <span className="coin-tile__label" style={{ fontSize: labelSize }}>
          {meta.short}
        </span>
      </div>
      {/* Sheen overlay — animates on merge/new for a premium feel. */}
      <div className="coin-tile__sheen" aria-hidden />
    </div>
  );
}
