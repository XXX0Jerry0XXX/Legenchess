import type { GameState } from '../game/types';

const SAVE_KEY = 'legenchess_save';

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
    if (parsed.mode === undefined) parsed.mode = 'local';
    if (parsed.aiPlayer === undefined) parsed.aiPlayer = null;
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
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
