import { MOVE_COST } from '../constants';
import { getMoveCells, pieceCell } from '../ranges';
import { clonePieces } from '../rules';
import type { Action, GameState } from '../types';

export function handleMovement(state: GameState, action: Extract<Action, { type: 'MOVE' | 'ASSASSIN_MOVE' }>): GameState {
  const id = state.selectedId;
  if (!id) return state;

  if (action.type === 'MOVE') {
    if (state.actionMode !== 'move' || state.ap < MOVE_COST) return state;
    const from = pieceCell(state, id);
    if (!from || !getMoveCells(state, id).some((c) => c.r === action.r && c.c === action.c)) return state;
    const board = state.board.map((row) => row.slice());
    board[from.r][from.c] = null;
    board[action.r][action.c] = id;
    return {
      ...state,
      board,
      ap: state.ap - MOVE_COST,
      actionMode: 'move',
      turnStarted: true,
      clockRunning: true,
    };
  }

  if (state.actionMode !== 'assassinMove') return state;
  const piece = state.pieces[id];
  if (!piece.freeMove) return state;
  const from = pieceCell(state, id);
  if (!from || !getMoveCells(state, id).some((c) => c.r === action.r && c.c === action.c)) return state;
  const board = state.board.map((row) => row.slice());
  board[from.r][from.c] = null;
  board[action.r][action.c] = id;
  return {
    ...state,
    board,
    pieces: clonePieces(state, { [id]: { freeMove: false } }),
    actionMode: 'assassinAttack',
    turnStarted: true,
    clockRunning: true,
  };
}
