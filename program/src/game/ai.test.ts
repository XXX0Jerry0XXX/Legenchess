import { describe, expect, it } from 'vitest';
import { chooseBeginnerAiActions } from './ai';
import { createPiece, emptyBoard, opponent, playerLabel } from './engine';
import { createInitialState } from './reducer';

describe('玩家辅助与 AI 动作', () => {
  it('playerLabel 与 opponent 正确', () => {
    expect(playerLabel(0)).toBe('A');
    expect(playerLabel(1)).toBe('B');
    expect(opponent(0)).toBe(1);
    expect(opponent(1)).toBe(0);
  });

  it('AI 在可攻击时会生成合法攻击动作序列', () => {
    const state = createInitialState();
    const warrior = createPiece(1, 'warrior');
    const enemy = createPiece(0, 'novice');
    const board = emptyBoard();
    board[7][3] = warrior.id;
    board[6][3] = enemy.id;
    const next = {
      ...state,
      phase: 'play' as const,
      mode: 'ai' as const,
      aiPlayer: 1 as const,
      currentPlayer: 1 as const,
      firstPlayer: 0 as const,
      turn: 2,
      ap: 6,
      pieces: { [warrior.id]: warrior, [enemy.id]: enemy },
      board,
    };

    const actions = chooseBeginnerAiActions(next);
    expect(actions[actions.length - 1].type).toBe('ATTACK');
  });
});
