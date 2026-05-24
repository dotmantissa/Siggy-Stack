// Core 2048-style game logic for Coin Merge.
// Board is a 4x4 grid of Tile | null. Each Tile has a unique id so the UI
// can animate movement; `mergedFrom` lets the UI know a tile just merged.

export const SIZE = 4;

// Coin progression — index represents tier (0 = DOGE, 5 = LEGENDARY).
export const COINS = ["DOGE", "PEPE", "SOL", "ETH", "BTC", "LEGENDARY"] as const;
export type Coin = (typeof COINS)[number];

export type Tile = {
  id: number;
  tier: number; // 0..5
  row: number;
  col: number;
  mergedFrom?: [number, number]; // ids of tiles that produced this one
  isNew?: boolean;
};

export type Board = (Tile | null)[][];

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

export function initialBoard(): Board {
  let b = emptyBoard();
  b = spawnRandomTile(b);
  b = spawnRandomTile(b);
  return b;
}

export type Direction = "up" | "down" | "left" | "right";

// Move/merge a single row to the left. Returns new row + score gained.
// Pure function on an array of Tile|null.
function slideRowLeft(row: (Tile | null)[]): { row: (Tile | null)[]; gained: number; moved: boolean } {
  const tiles = row.filter((t): t is Tile => t !== null);
  const result: (Tile | null)[] = [];
  let gained = 0;
  let i = 0;
  while (i < tiles.length) {
    const a = tiles[i];
    const b = tiles[i + 1];
    // Merge only if same tier AND not already LEGENDARY (max tier).
    if (b && a.tier === b.tier && a.tier < COINS.length - 1) {
      const mergedTier = a.tier + 1;
      result.push({
        id: newId(),
        tier: mergedTier,
        row: a.row, // placeholder — caller fixes coords
        col: a.col,
        mergedFrom: [a.id, b.id],
      });
      // Score = value of resulting tier (powers of 2 style).
      gained += Math.pow(2, mergedTier + 1);
      i += 2;
    } else {
      result.push(a);
      i += 1;
    }
  }
  while (result.length < SIZE) result.push(null);

  // Detect any change vs. original positions.
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

// Rotate board so any move reduces to "left".
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

export function move(board: Board, dir: Direction): { board: Board; gained: number; moved: boolean } {
  // Normalize so we always slide left.
  let work = board;
  if (dir === "up") work = rotateCCW(board);
  else if (dir === "down") work = rotateCW(board);
  else if (dir === "right")
    work = board.map((row) => row.slice().reverse());

  let totalGained = 0;
  let anyMoved = false;
  const slid: Board = work.map((row) => {
    const { row: newRow, gained, moved } = slideRowLeft(row);
    totalGained += gained;
    if (moved) anyMoved = true;
    return newRow;
  });

  // Un-rotate back to original orientation.
  let final = slid;
  if (dir === "up") final = rotateCW(slid);
  else if (dir === "down") final = rotateCCW(slid);
  else if (dir === "right") final = slid.map((row) => row.slice().reverse());

  // Fix tile row/col coordinates and clear stale flags.
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = final[r][c];
      if (t) {
        t.row = r;
        t.col = c;
        t.isNew = false;
      }
    }
  }

  return { board: final, gained: totalGained, moved: anyMoved };
}

// Game over = board full AND no adjacent tiles share a tier.
export function isGameOver(board: Board): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) if (!board[r][c]) return false;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const t = board[r][c]!;
      if (c + 1 < SIZE && board[r][c + 1]!.tier === t.tier && t.tier < COINS.length - 1) return false;
      if (r + 1 < SIZE && board[r + 1][c]!.tier === t.tier && t.tier < COINS.length - 1) return false;
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
