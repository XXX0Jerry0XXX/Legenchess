import type { PieceDef, PieceType, Owner } from './types';

export const ROWS = 10;
export const COLS = 8;
export const BASE_AP = 2;
export const CHAIRMAN_BONUS = 4;
export const SECOND_PLAYER_BONUS = 1;
export const PLAYER_TIME = 25 * 60;
export const OBSERVE_TIME = 2 * 60;

export const PIECE_DEFS: Record<PieceType, PieceDef> = {
  novice: { name: '新手', short: '新', atk: 1, hp: 1, move: 'rect1', attack: 'rect1', skill: 'promote' },
  warrior: { name: '战士', short: '战', atk: 2, hp: 4, move: 'cross2', attack: 'cross2', skill: 'warrior' },
  mage: { name: '法师', short: '法', atk: 2, hp: 1, move: 'rect1', attack: 'rect1', skill: 'mage' },
  assassin: { name: '刺客', short: '刺', atk: 3, hp: 1, move: 'rect2', attack: 'rect1', skill: 'assassin' },
  priest: { name: '牧师', short: '牧', atk: 1, hp: 3, move: 'rect1', attack: 'rect1', skill: 'priest' },
  chairman: { name: '会长', short: '会', atk: 3, hp: 3, move: 'rect1', attack: 'rect1', skill: 'chairman' },
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
  return owner === 0 ? [0, 1, 2] : [7, 8, 9];
}

export function isPrepCell(owner: Owner, r: number): boolean {
  return prepRows(owner).includes(r);
}
