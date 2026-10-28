import { describe, expect, it } from 'vitest';
import { Legenchess } from './api';
import { createInitialState, reducer } from './reducer';

describe('统一 API 命名空间', () => {
  it('暴露核心入口', () => {
    expect(typeof Legenchess.createInitialState).toBe('function');
    expect(typeof Legenchess.dispatch).toBe('function');
    expect(typeof Legenchess.registerPiece).toBe('function');
    expect(typeof Legenchess.registerSkill).toBe('function');
    expect(typeof Legenchess.query.moveCells).toBe('function');
    expect(Legenchess.helpers.playerLabel(0)).toBe('A');
  });

  it('APPLY_GAME_ACTIONS 可以执行治疗动作', () => {
    let state = createInitialState();
    state = {
      ...state,
      pieces: {
        p1: {
          id: 'p1',
          owner: 0,
          type: 'warrior',
          hp: 1,
          maxHp: 4,
          atk: 2,
          freeMove: false,
          freeAttack: false,
          dead: false,
        },
      },
    };
    const next = reducer(state, {
      type: 'APPLY_GAME_ACTIONS',
      actions: [{ type: 'heal', pieceId: 'p1', amount: 2 }],
    });
    expect(next.pieces.p1.hp).toBe(3);
  });
});
