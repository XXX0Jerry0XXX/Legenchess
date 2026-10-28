import type { GameState, Owner, Piece } from '../types';

export function aliveOwnPieces(state: GameState, owner: Owner): Piece[] {
  return Object.values(state.pieces).filter((piece) => piece.owner === owner && !piece.dead);
}

export function revivablePieces(state: GameState, owner: Owner): string[] {
  return [...state.lastTurnDeaths, ...state.previousTurnDeaths].filter(
    (id) => state.pieces[id]?.owner === owner && state.pieces[id]?.dead,
  );
}

export function pieceValue(piece: Piece): number {
  const base = {
    novice: 1,
    warrior: 4,
    mage: 3,
    assassin: 3,
    priest: 3,
    chairman: 6,
  }[piece.type] ?? 2;
  return base + piece.hp * 0.15;
}
