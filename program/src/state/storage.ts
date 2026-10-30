import { COLS, ROWS } from '../game/constants';
import type { GameState } from '../game/types';

const SAVE_KEY = 'legenchess_save';
const LEGACY_ROWS = 10;

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式或存储不可用时忽略。
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameState>;
    if (
      !parsed ||
      !Array.isArray(parsed.board) ||
      ![LEGACY_ROWS, ROWS].includes(parsed.board.length) ||
      !parsed.board.every((row) => Array.isArray(row) && row.length === COLS)
    ) return null;
    if (parsed.board.length === LEGACY_ROWS) {
      // 在旧棋盘中央插入两行，下半盘棋子与底边的距离保持不变。
      const middle = LEGACY_ROWS / 2;
      parsed.board = [
        ...parsed.board.slice(0, middle),
        ...Array.from({ length: ROWS - LEGACY_ROWS }, () => Array<string | null>(COLS).fill(null)),
        ...parsed.board.slice(middle),
      ];
    }
    if (parsed.mode === undefined) parsed.mode = 'local';
    if (parsed.aiPlayer === undefined) parsed.aiPlayer = null;
    if (parsed.aiLevel === undefined) parsed.aiLevel = 'beginner';
    if (parsed.previousTurnDeaths === undefined) parsed.previousTurnDeaths = [];
    if (parsed.skillTargets === undefined) parsed.skillTargets = [];
    return parsed as GameState;
  } catch {
    return null;
  }
}

export function clearGame(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // 忽略。
  }
}

export function hasSave(): boolean {
  return loadGame() !== null;
}
