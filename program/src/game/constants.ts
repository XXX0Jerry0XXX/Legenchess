import type { PieceDef, PieceType, Owner } from './types';

export const ROWS = 12;
export const COLS = 8;
export const PREP_ROWS = 3;
export const BASE_AP = 2;
export const CHAIRMAN_BONUS = 4;
export const SECOND_PLAYER_BONUS = 1;
export const PLAYER_TIME = 25 * 60;
export const OBSERVE_TIME = 2 * 60;
export const MOVE_COST = 1;
export const ATTACK_COST = 1;
export const SKILL_COST = 2;
export const MAX_MAGE_TARGETS = 3;
export const TOTAL_PIECES_PER_SIDE = 16;
export const TICK_MS = 1000;
export const AI_STEP_DELAY_MS = 600;
export const AUTO_SETUP_DELAY_MS = 500;
export const RECT1_RADIUS = 1;
export const RECT2_RADIUS = 2;
export const RING_RADIUS = 2;

export const PIECE_DEFS: Record<PieceType, PieceDef> = {
  novice: { type: 'novice', name: '新手', short: '新', atk: 1, hp: 1, move: 'rect1', attack: 'rect1', skill: 'promote' },
  warrior: { type: 'warrior', name: '战士', short: '战', atk: 2, hp: 4, move: 'cross2', attack: 'cross2', skill: 'warrior' },
  mage: { type: 'mage', name: '法师', short: '法', atk: 2, hp: 1, move: 'rect1', attack: 'rect1', skill: 'mage' },
  assassin: { type: 'assassin', name: '刺客', short: '刺', atk: 3, hp: 1, move: 'rect2', attack: 'rect1', skill: 'assassin' },
  priest: { type: 'priest', name: '牧师', short: '牧', atk: 1, hp: 3, move: 'rect1', attack: 'rect1', skill: 'priest' },
  chairman: { type: 'chairman', name: '会长', short: '会', atk: 3, hp: 3, move: 'rect1', attack: 'rect1', skill: 'chairman' },
};

export const SETUP_COUNTS: Record<PieceType, number> = {
  novice: 8,
  warrior: 2,
  mage: 2,
  assassin: 2,
  priest: 1,
  chairman: 1,
};

export const PROMOTABLE: PieceType[] = ['warrior', 'mage', 'assassin', 'priest'];

export function prepRows(owner: Owner): number[] {
  const start = owner === 0 ? 0 : ROWS - PREP_ROWS;
  return Array.from({ length: PREP_ROWS }, (_, index) => start + index);
}

export function isPrepCell(owner: Owner, r: number): boolean {
  return prepRows(owner).includes(r);
}
