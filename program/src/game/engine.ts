import { BASE_AP, CHAIRMAN_BONUS, COLS, PIECE_DEFS, ROWS, SECOND_PLAYER_BONUS } from './constants';
import type { GameState, Owner, Piece, PieceType } from './types';

let idCounter = 0;

export function nextId(): string {
  idCounter += 1;
  return `p${Date.now()}_${idCounter}`;
}

export function createPiece(owner: Owner, type: PieceType): Piece {
  const def = PIECE_DEFS[type];
  return {
    id: nextId(),
    owner,
    type,
    hp: def.hp,
    maxHp: def.hp,
    atk: def.atk,
    freeMove: false,
    freeAttack: false,
    dead: false,
  };
}

export function emptyBoard(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array<string | null>(COLS).fill(null));
}

export function aliveCount(state: GameState, owner: Owner): number {
  return Object.values(state.pieces).filter((p) => p.owner === owner && !p.dead).length;
}

export function hasChairmanAlive(state: GameState, owner: Owner): boolean {
  return Object.values(state.pieces).some(
    (p) => p.owner === owner && p.type === 'chairman' && !p.dead,
  );
}

export function computeAp(state: GameState): number {
  let ap = BASE_AP;
  if (hasChairmanAlive(state, state.currentPlayer)) ap += CHAIRMAN_BONUS;
  if (state.turn === 2 && state.currentPlayer !== state.firstPlayer) ap += SECOND_PLAYER_BONUS;
  return ap;
}

export function pieceCount(state: GameState, owner: Owner): number {
  return aliveCount(state, owner);
}

export function checkWinner(state: GameState): Owner | 'draw' | null {
  const a = aliveCount(state, 0);
  const b = aliveCount(state, 1);
  if (a === 0 && b === 0) return 'draw';
  if (a === 0) return 1;
  if (b === 0) return 0;
  return null;
}

export function playerLabel(owner: Owner): 'A' | 'B' {
  return owner === 0 ? 'A' : 'B';
}

export function opponent(owner: Owner): Owner {
  return owner === 0 ? 1 : 0;
}
