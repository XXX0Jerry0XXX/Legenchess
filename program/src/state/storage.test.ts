import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPiece } from '../game/engine';
import { pieceCell } from '../game/ranges';
import { createInitialState } from '../game/reducer';
import { hasSave, loadGame, saveGame } from './storage';

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('8×12 存档兼容', () => {
  it('旧棋盘中央插入两行，双方与各自底边的距离不变', () => {
    const state = createInitialState();
    state.board = Array.from({ length: 10 }, () => Array<string | null>(8).fill(null));
    for (const [r, owner] of [[0, 0], [4, 0], [5, 1], [9, 1]] as const) {
      const piece = createPiece(owner, 'novice');
      state.pieces[piece.id] = piece;
      state.board[r][0] = piece.id;
    }
    saveGame(state);
    const loaded = loadGame()!;
    expect(loaded.board).toHaveLength(12);
    expect(loaded.board.slice(5, 7).flat().every((id) => id === null)).toBe(true);
    expect(Object.keys(loaded.pieces)).toEqual(Object.keys(state.pieces));
    for (const [oldRow, newRow] of [[0, 0], [4, 4], [5, 7], [9, 11]]) {
      const id = state.board[oldRow][0]!;
      expect(pieceCell(loaded, id)).toEqual({ r: newRow, c: 0 });
    }
    saveGame(loaded);
    expect(loadGame()).toEqual(loaded);
  });

  it('新版存档原样读取', () => {
    const state = createInitialState();
    saveGame(state);
    expect(loadGame()).toEqual(state);
    expect(hasSave()).toBe(true);
  });

  it('尺寸不支持或 JSON 损坏时不提供继续游戏入口', () => {
    for (const raw of ['{broken', 'null', '{}', JSON.stringify({ board: [[null]] }),
      JSON.stringify({ board: Array.from({ length: 12 }, () => Array(7).fill(null)) }),
    ]) {
      localStorage.setItem('legenchess_save', raw);
      expect(loadGame()).toBe(null);
      expect(hasSave()).toBe(false);
      expect(localStorage.getItem('legenchess_save')).toBe(raw);
    }
  });
});
