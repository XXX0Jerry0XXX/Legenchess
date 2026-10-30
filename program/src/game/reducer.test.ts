import { describe, expect, it } from 'vitest';
import { ROWS } from './constants';
import { createPiece, computeAp } from './engine';
import { emptyBoard } from './engine';
import { createInitialState, reducer } from './reducer';

describe('开局与后手补偿', () => {
  it('初始状态进入布阵阶段', () => {
    const state = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 1 });
    expect(state.phase).toBe('setup');
    expect(state.firstPlayer).toBe(1);
  });

  it('后手第一回合获得额外 1 AP', () => {
    const state = createInitialState();
    state.currentPlayer = 1;
    state.firstPlayer = 0;
    state.turn = 2;
    state.pieces.a = createPiece(0, 'chairman');
    state.pieces.b = createPiece(1, 'chairman');
    expect(computeAp(state)).toBe(2 + 4 + 1);
  });
});

describe('牧师复活', () => {
  it('可以多次复活同一枚棋子', () => {
    let state = createInitialState();
    state = { ...state, phase: 'play', mode: 'local', currentPlayer: 1, turn: 5, ap: 6 };
    const priest = createPiece(1, 'priest');
    const warrior = createPiece(1, 'warrior');
    warrior.hp = 0;
    warrior.dead = true;
    state.pieces = { [priest.id]: priest, [warrior.id]: warrior };
    state.board = emptyBoard();
    state.board[ROWS - 1][0] = priest.id;
    state.lastTurnDeaths = [warrior.id];

    state = reducer(state, { type: 'SELECT_PIECE', id: priest.id });
    state = reducer(state, { type: 'SET_MODE', mode: 'revive' });
    state = reducer(state, { type: 'CHOOSE_REVIVE', id: warrior.id });
    expect(reducer(state, { type: 'PLACE_REVIVE', r: 8, c: 1 })).toBe(state);
    state = reducer(state, { type: 'PLACE_REVIVE', r: ROWS - 1, c: 1 });
    expect(state.pieces[warrior.id].dead).toBe(false);

    state = {
      ...state,
      pieces: {
        ...state.pieces,
        [warrior.id]: { ...state.pieces[warrior.id], dead: true, hp: 0 },
      },
      lastTurnDeaths: [warrior.id],
      board: state.board.map((row) => row.map((id) => (id === warrior.id ? null : id))),
    };
    state = reducer(state, { type: 'SELECT_PIECE', id: priest.id });
    state = reducer(state, { type: 'SET_MODE', mode: 'revive' });
    state = reducer(state, { type: 'CHOOSE_REVIVE', id: warrior.id });
    state = reducer(state, { type: 'PLACE_REVIVE', r: ROWS - 1, c: 2 });
    expect(state.pieces[warrior.id].dead).toBe(false);
  });
});
