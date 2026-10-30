import { describe, expect, it } from 'vitest';
import { chooseBeginnerAiActions } from './ai';
import { COLS, ROWS, isPrepCell, prepRows } from './constants';
import { createPiece } from './engine';
import { chooseExpertAiActions } from './expertAi';
import { createInitialState, reducer } from './reducer';

describe('8×12 棋盘对局', () => {
  it('双方各用三行布阵，中央六行保持为空', () => {
    let state = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 1 });
    state = reducer(state, { type: 'AUTO_SETUP' });
    state = reducer(state, { type: 'AUTO_SETUP' });
    expect(state.board).toHaveLength(12);
    expect(state.board.every((row) => row.length === 8)).toBe(true);
    expect(prepRows(0)).toEqual([0, 1, 2]);
    expect(prepRows(1)).toEqual([9, 10, 11]);
    expect(prepRows(0).map((r) => ROWS - 1 - r).reverse()).toEqual(prepRows(1));
    for (const owner of [0, 1] as const) {
      const ownIds = state.board.flatMap((row, r) => isPrepCell(owner, r) ? row.filter(Boolean) : []);
      expect(ownIds).toHaveLength(16);
      expect(ownIds.every((id) => state.pieces[id!].owner === owner)).toBe(true);
    }
    expect(state.board.slice(3, 9).flat().every((id) => id === null)).toBe(true);
    expect(state.phase).toBe('observe');
    state = reducer(state, { type: 'START_PLAY' });
    expect(state.currentPlayer).toBe(1);
    expect(state.ap).toBe(6);
  });

  it('下方新增区域能布阵并移动', () => {
    let state = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 1 });
    state = reducer(state, { type: 'NEXT_SETUP' });
    state = reducer(state, { type: 'SELECT_SETUP', pieceType: 'novice' });
    const before = state;
    state = reducer(state, { type: 'PLACE_SETUP', r: 8, c: 7 });
    expect(state).toBe(before);
    state = reducer(state, { type: 'PLACE_SETUP', r: ROWS - 1, c: COLS - 1 });
    const id = state.board[11][7]!;
    expect(state.pieces[id].owner).toBe(1);
    state = reducer(state, { type: 'START_PLAY' });
    state = reducer(state, { type: 'SELECT_PIECE', id });
    state = reducer(state, { type: 'SET_MODE', mode: 'move' });
    state = reducer(state, { type: 'MOVE', r: 10, c: 7 });
    expect(state.board[11][7]).toBe(null);
    expect(state.board[10][7]).toBe(id);
    expect(state.ap).toBe(1);
  });

  it.each(['beginner', 'expert'] as const)('%s AI 能在新增区域攻击', (aiLevel) => {
    let state = createInitialState();
    const warrior = createPiece(1, 'warrior');
    const enemy = createPiece(0, 'novice');
    state = {
      ...state, phase: 'play', mode: 'ai', aiLevel, aiPlayer: 1, currentPlayer: 1, ap: 6,
      pieces: { [warrior.id]: warrior, [enemy.id]: enemy },
    };
    state.board[11][7] = warrior.id;
    state.board[10][7] = enemy.id;
    const actions = aiLevel === 'expert' ? chooseExpertAiActions(state, reducer) : chooseBeginnerAiActions(state);
    const next = reducer(state, { type: 'APPLY_ACTIONS', actions });
    expect(next.pieces[enemy.id].dead).toBe(true);
    expect(next.ap).toBeLessThan(state.ap);
    expect(next.board[10][7]).toBe(null);
  });
});
