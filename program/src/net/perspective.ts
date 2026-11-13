import type { GameState, Owner } from '../game/types';
import type { LanRole } from './LanContext';

export function localOwnerOf(role: LanRole): Owner | null {
  if (role === 'host') return 0;
  if (role === 'guest') return 1;
  return null;
}

export function maskState(state: GameState, localOwner: Owner | null): GameState {
  if (state.phase !== 'setup' || localOwner === null) return state;
  const board = state.board.map((row) =>
    row.map((id) => (id && state.pieces[id]?.owner !== localOwner ? null : id)),
  );
  const pieces: GameState['pieces'] = {};
  for (const [id, piece] of Object.entries(state.pieces)) {
    if (piece.owner === localOwner) pieces[id] = piece;
  }
  return { ...state, board, pieces };
}

export function canAct(state: GameState, localOwner: Owner | null): boolean {
  if (localOwner === null) return true;
  if (state.phase === 'setup') return state.setupOwner === localOwner;
  if (state.phase === 'observe') return localOwner === state.firstPlayer;
  if (state.phase === 'play') return state.currentPlayer === localOwner;
  return false;
}
