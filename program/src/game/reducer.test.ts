import { describe, expect, it } from 'vitest';
import { createPiece, computeAp } from './engine';
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
