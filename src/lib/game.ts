// Core 2048-style game logic for Coin Merge.
//
// Board is a 4x4 grid of Tile | null. Each Tile has a unique id so the UI
// can animate movement smoothly. Flags `mergedFrom` and `isNew` are only
// set for the move that produced them, then cleared on the next move.

export const SIZE = 4;

// Coin progression — index represents tier (0 = DOGE, 5 = LEGENDARY).
export const COINS = ["DOGE", "PEPE", "SOL", "ETH", "BTC", "LEGENDARY"] as const;
export type Coin = (typeof COINS)[number];

export type Tile = {
  id: number;
  tier: number; // 0..COINS.length-1
  row: number;
  col: number;
  // Set on the move where this tile was just produced by a merge.
  // Carries the ids of the two source tiles so the UI can animate them.
  mergedFrom?: [number, number];
  // True only on the move where this tile spawned.
  isNew?: boolean;
};

export type Board = (Tile | null)[][];

// Unique tile id generator. IDs are critical for React keys + animations.
let nextId = 1;
const newId = () => nextId++;

export function emptyBoard(): Board {
  return Array.from({ length: SIZE }, () => Array<Tile | null>(SIZE).fill(null));
}

// Place a new DOGE tile (tier 0) at a random empty cell.
export function spawnRandomTile(board: Board): Board {
  const empties: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (!board[r][c]) empties.push([r, c]);
  if (empties.length === 0) return board;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const next = board.map((row) => row.slice());
  next[r][c] = { id: newId(), tier: 0, row: r, col: c, isNew: true };
  return next;
}

// Always start with exactly two DOGE tiles.
export function initialBoard(): Board {
  let b = emptyBoard();
  b = spawnRandomTile(b);
  b = spawnRandomTile(b);
  return b;
}

export type Direction = "up" | "down" | "left" | "right";

// Deep-clone a tile while clearing per-move flags. We do this before any
// move so previous-turn animations don't leak into the next render.
function cloneTile(t: Tile): Tile {
  return { id: t.id, tier: t.tier, row: t.row, col: t.col };
}

// Slide + merge one row to the left (classic 2048 semantics):
// - Tiles slide as far left as possible.
// - Each tile can participate in at most one merge per move.
// - Merges resolve left-to-right.
function slideRowLeft(row: (Tile | null)[]): {
  row: (Tile | null)[];
  gained: number;
  moved: boolean;
} {
  // Compact (drop nulls) — every remaining tile is a fresh clone with
  // no stale `mergedFrom` / `isNew` flags.
  const tiles: Tile[] = row.filter((t): t is Tile => t !== null).map(cloneTile);

  const result: (Tile | null)[] = [];
  let gained = 0;
  let i = 0;
  while (i < tiles.length) {
    const a = tiles[i];
    const b = tiles[i + 1];
    // Merge only if same tier AND not already at the max tier.
    // i += 2 guarantees each tile merges at most once per move.
    if (b && a.tier === b.tier && a.tier < COINS.length - 1) {
      const mergedTier = a.tier + 1;
      result.push({
        id: newId(),
        tier: mergedTier,
        row: a.row, // caller fixes row/col after un-rotation
        col: a.col,
        mergedFrom: [a.id, b.id],
      });
      // Score uses the classic 2048 progression (2,4,8,...).
      gained += Math.pow(2, mergedTier + 1);
      i += 2;
    } else {
      result.push(a);
      i += 1;
    }
  }
  while (result.length < SIZE) result.push(null);

  // A move counts as "moved" if any cell's tile id changed (slide or merge).
  let moved = false;
  for (let c = 0; c < SIZE; c++) {
    const before = row[c];
    const after = result[c];
    if ((before?.id ?? null) !== (after?.id ?? null)) {
      moved = true;
      break;
    }
  }
  return { row: result, gained, moved };
}

// Rotate helpers let us reduce every direction to "slide left".
function rotateCW(board: Board): Board {
  const out = emptyBoard();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) out[c][SIZE - 1 - r] = board[r][c];
  return out;
}
function rotateCCW(board: Board): Board {
  const out = emptyBoard();
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) out[SIZE - 1 - c][r] = board[r][c];
  return out;
}

export function move(
  board: Board,
  dir: Direction,
): { board: Board; gained: number; moved: boolean } {
  // Normalize so we always slide left.
  let work = board;
  if (dir === "up") work = rotateCCW(board);
  else if (dir === "down") work = rotateCW(board);
  else if (dir === "right") work = board.map((row) => row.slice().reverse());

  let totalGained = 0;
  let anyMoved = false;
  const slid: Board = work.map((row) => {
    const { row: newRow, gained, moved } = slideRowLeft(row);
    totalGained += gained;
    if (moved) anyMoved = true;
    return newRow;
  });

  // Un-rotate back to the original orientation.
  let final = slid;
  if (dir === "up") final = rotateCW(slid);
  else if (dir === "down") final = rotateCCW(slid);
  else if (dir === "right") final = slid.map((row) => row.slice().reverse());

  // Fix tile row/col to match their final position.
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = final[r][c];
      if (t) {
        t.row = r;
        t.col = c;
      }
    }
  }

  return { board: final, gained: totalGained, moved: anyMoved };
}

// Game over = board full AND no two adjacent tiles can still merge.
export function isGameOver(board: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (!board[r][c]) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = board[r][c]!;
      if (t.tier >= COINS.length - 1) continue; // max tier can't merge
      if (c + 1 < SIZE && board[r][c + 1]!.tier === t.tier) return false;
      if (r + 1 < SIZE && board[r + 1][c]!.tier === t.tier) return false;
    }
  }
  return true;
}

export function flattenTiles(board: Board): Tile[] {
  const out: Tile[] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (board[r][c]) out.push(board[r][c]!);
  return out;
}
