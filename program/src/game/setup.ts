import { COLS, ROWS, SETUP_COUNTS, TOTAL_PIECES_PER_SIDE, isPrepCell } from './constants';
import type { Cell, GameState, Owner, PieceType } from './types';

export function shuffled<T>(items: T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function emptyPrepCell(state: GameState, owner: Owner): Cell | null {
  for (let r = 0; r < state.board.length; r += 1) {
    if (!isPrepCell(owner, r)) continue;
    for (let c = 0; c < state.board[r].length; c += 1) {
      if (state.board[r][c] === null) return { r, c };
    }
  }
  return null;
}

export function randomSetupPlacements(owner: Owner, random: () => number = Math.random): { type: PieceType; r: number; c: number }[] {
  const cells: Cell[] = [];
  for (let r = 0; r < ROWS; r += 1) {
    if (!isPrepCell(owner, r)) continue;
    for (let c = 0; c < COLS; c += 1) {
      cells.push({ r, c });
    }
  }
  const chosenCells = shuffled(cells, random).slice(0, TOTAL_PIECES_PER_SIDE);
  const types: PieceType[] = [];
  (Object.keys(SETUP_COUNTS) as PieceType[]).forEach((type) => {
    for (let i = 0; i < SETUP_COUNTS[type]; i += 1) {
      types.push(type);
    }
  });
  return shuffled(types, random).map((type, index) => ({ type, r: chosenCells[index].r, c: chosenCells[index].c }));
}
