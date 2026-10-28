import {
  COLS,
  PIECE_DEFS,
  RECT1_RADIUS,
  RECT2_RADIUS,
  RING_RADIUS,
  ROWS,
} from './constants';
import type { Cell, GameState, MoveKind, AttackKind } from './types';

export function inBoard(r: number, c: number): boolean {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

export function cellsForMoveKind(kind: MoveKind, cell: Cell): Cell[] {
  const out: Cell[] = [];
  const span = kind === 'rect1' ? RECT1_RADIUS : RECT2_RADIUS;

  if (kind === 'cross2') {
    for (let d = 1; d <= RECT2_RADIUS; d += 1) {
      pushIf(out, cell.r - d, cell.c);
      pushIf(out, cell.r + d, cell.c);
      pushIf(out, cell.r, cell.c - d);
      pushIf(out, cell.r, cell.c + d);
    }
    return out;
  }

  for (let dr = -span; dr <= span; dr += 1) {
    for (let dc = -span; dc <= span; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      pushIf(out, cell.r + dr, cell.c + dc);
    }
  }
  return out;
}

export function cellsForAttackKind(kind: AttackKind, cell: Cell): Cell[] {
  return cellsForMoveKind(kind, cell);
}

export function rect2Cells(cell: Cell): Cell[] {
  return cellsForMoveKind('rect2', cell);
}

export function ring2Cells(cell: Cell): Cell[] {
  const out: Cell[] = [];
  for (let dr = -RING_RADIUS; dr <= RING_RADIUS; dr += 1) {
    for (let dc = -RING_RADIUS; dc <= RING_RADIUS; dc += 1) {
      if (Math.max(Math.abs(dr), Math.abs(dc)) !== RING_RADIUS) continue;
      pushIf(out, cell.r + dr, cell.c + dc);
    }
  }
  return out;
}

function pushIf(arr: Cell[], r: number, c: number): void {
  if (inBoard(r, c)) arr.push({ r, c });
}

export function pieceCell(state: GameState, pieceId: string): Cell | null {
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (state.board[r][c] === pieceId) return { r, c };
    }
  }
  return null;
}

export function getMoveCells(state: GameState, pieceId: string): Cell[] {
  const piece = state.pieces[pieceId];
  const cell = pieceCell(state, pieceId);
  if (!piece || !cell) return [];
  const def = PIECE_DEFS[piece.type];
  return cellsForMoveKind(def.move, cell).filter((c) => state.board[c.r][c.c] === null);
}

export function getAttackCells(state: GameState, pieceId: string): Cell[] {
  const piece = state.pieces[pieceId];
  const cell = pieceCell(state, pieceId);
  if (!piece || !cell) return [];
  const def = PIECE_DEFS[piece.type];
  return cellsForAttackKind(def.attack, cell).filter((c) => {
    const id = state.board[c.r][c.c];
    return id !== null && state.pieces[id].owner !== piece.owner && !state.pieces[id].dead;
  });
}

export function getWarriorSkillCells(state: GameState, pieceId: string): Cell[] {
  const piece = state.pieces[pieceId];
  const cell = pieceCell(state, pieceId);
  if (!piece || !cell) return [];
  return rect2Cells(cell).filter((c) => {
    const id = state.board[c.r][c.c];
    return id !== null && state.pieces[id].owner !== piece.owner && !state.pieces[id].dead;
  });
}

export function getMageSkillCells(state: GameState, pieceId: string): Cell[] {
  const piece = state.pieces[pieceId];
  const cell = pieceCell(state, pieceId);
  if (!piece || !cell) return [];
  return ring2Cells(cell).filter((c) => {
    const id = state.board[c.r][c.c];
    return id !== null && state.pieces[id].owner !== piece.owner && !state.pieces[id].dead;
  });
}

export function isInAttackRange(state: GameState, attackerId: string, targetId: string): boolean {
  return getAttackCells(state, attackerId).some((c) => state.board[c.r][c.c] === targetId);
}
