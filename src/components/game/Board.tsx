import { useEffect, useRef, useState } from "react";
import { SIZE, flattenTiles, type Board as BoardType, type Direction } from "@/lib/game";
import { Tile } from "./Tile";

interface Props {
  board: BoardType;
  onMove: (dir: Direction) => void;
}

// Renders the 4x4 grid + absolutely positioned tiles. Handles keyboard
// arrows on desktop and touch swipes on mobile.
export function Board({ board, onMove }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(72);
  const gap = 10;
  const padding = 10;

  // Recalculate cell size from container width so the board scales
  // fluidly on any device.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const cs = Math.floor((w - padding * 2 - gap * (SIZE - 1)) / SIZE);
      setCellSize(cs);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keyboard controls.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        s: "down",
        a: "left",
        d: "right",
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        onMove(dir);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onMove]);

  // Touch swipe controls — fires as soon as a swipe passes the threshold,
  // so the move feels instant and a single drag can't trigger two moves.
  const touchStart = useRef<{ x: number; y: number; fired: boolean } | null>(null);
  const SWIPE_THRESHOLD = 22; // px — small enough to feel snappy on phones

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, fired: false };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start || start.fired) return;
    // touch-action: none on the board already prevents scroll; this
    // preventDefault is a belt-and-braces for older mobile browsers.
    if (e.cancelable) e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (Math.max(absX, absY) < SWIPE_THRESHOLD) return;
    start.fired = true;
    if (absX > absY) onMove(dx > 0 ? "right" : "left");
    else onMove(dy > 0 ? "down" : "up");
  };
  const onTouchEnd = () => {
    touchStart.current = null;
  };

  const boardPx = cellSize * SIZE + gap * (SIZE - 1) + padding * 2;
  const tiles = flattenTiles(board);

  return (
    <div
      ref={containerRef}
      className="coin-board"
      style={{ height: boardPx, padding }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* Background cells */}
      <div
        className="coin-board__grid"
        style={{
          gap,
          gridTemplateColumns: `repeat(${SIZE}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${SIZE}, ${cellSize}px)`,
        }}
      >
        {Array.from({ length: SIZE * SIZE }).map((_, i) => (
          <div key={i} className="coin-board__cell" />
        ))}
      </div>

      {/* Absolutely positioned tiles slide via CSS transitions. */}
      <div className="coin-board__tiles" style={{ top: padding, left: padding }}>
        {tiles.map((tile) => (
          <Tile key={tile.id} tile={tile} cellSize={cellSize} gap={gap} />
        ))}
      </div>
    </div>
  );
}
