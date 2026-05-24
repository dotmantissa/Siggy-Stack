import { COINS, type Tile as TileType } from "@/lib/game";

interface Props {
  tile: TileType;
  cellSize: number; // px
  gap: number; // px
}

// Renders a single coin tile, absolutely positioned so CSS transitions
// animate its movement when row/col change.
//
// We expose the current translation as CSS variables (--tx / --ty) so the
// spawn + merge keyframes can keep the tile anchored at its grid position
// while scaling/popping.
export function Tile({ tile, cellSize, gap }: Props) {
  const x = tile.col * (cellSize + gap);
  const y = tile.row * (cellSize + gap);
  const coin = COINS[tile.tier];

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
      <span className="coin-tile__label">{coin}</span>
    </div>
  );
}
