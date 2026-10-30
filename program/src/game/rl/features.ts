import { COLS, PIECE_DEFS, PLAYER_TIME, PROMOTABLE, ROWS, isPrepCell } from '../constants';
import { DECISION_KINDS, type Decision } from '../decisions';
import { cellsForAttackKind } from '../ranges';
import type { Cell, GameState, Owner, Piece } from '../types';

export const RULES_VERSION = 'legenchess-8x12-ppo-v1';
export const PIECE_TYPES = ['novice', 'warrior', 'mage', 'assassin', 'priest', 'chairman'];
export const PIECE_VALUES: Record<string, number> = { novice: 1, warrior: 4, mage: 3, assassin: 3, priest: 3, chairman: 6 };
export const PIECE_FEATURES = 18;
export const GLOBAL_FEATURES = 16;
export const OBSERVATION_SIZE = GLOBAL_FEATURES + 32 * PIECE_FEATURES;
export const CANDIDATE_FEATURES = 96;
export const FEATURE_SCALE = 1024;

function canonical(cell: Cell, owner: Owner): Cell {
  return { r: owner === 0 ? ROWS - 1 - cell.r : cell.r, c: cell.c };
}
function quantized(values: number[]): number[] {
  return values.map((v) => Math.round(Math.max(-30, Math.min(30, v)) * FEATURE_SCALE) / FEATURE_SCALE);
}
export function material(state: GameState, owner: Owner): number {
  return Object.values(state.pieces).reduce((sum, p) => sum + (!p.dead && p.owner === owner ? (PIECE_VALUES[p.type] ?? 2) + Math.max(0, p.hp) * 0.15 : 0), 0);
}
export function potential(state: GameState, owner: Owner): number {
  return Math.tanh((material(state, owner) - material(state, (1 - owner) as Owner)) / 20);
}

export function encodeObservation(state: GameState, owner = state.currentPlayer): number[] {
  const positions = new Map<string, Cell>();
  state.board.forEach((row, r) => row.forEach((id, c) => { if (id) positions.set(id, { r, c }); }));
  const own = Object.values(state.pieces).filter((p) => p.owner === owner);
  const enemy = Object.values(state.pieces).filter((p) => p.owner !== owner);
  const alive = (ps: Piece[]) => ps.filter((p) => !p.dead);
  const a = alive(own), b = alive(enemy);
  const values = [state.ap / 8, +(state.currentPlayer === state.firstPlayer), +(state.turn === 2), Math.min(state.turn, 300) / 300,
    a.length / 16, b.length / 16, a.reduce((s, p) => s + Math.max(0, p.hp), 0) / 50, b.reduce((s, p) => s + Math.max(0, p.hp), 0) / 50,
    material(state, owner) / 60, material(state, (1 - owner) as Owner) / 60,
    +a.some((p) => p.type === 'chairman'), +b.some((p) => p.type === 'chairman'),
    state.times[owner] / PLAYER_TIME, state.times[(1 - owner) as Owner] / PLAYER_TIME, +!!state.pendingPromotion, +state.clockRunning];
  for (const ps of [own, enemy]) {
    for (let i = 0; i < 16; i++) {
      const p = ps[i];
      if (!p) { values.push(...Array(PIECE_FEATURES).fill(0)); continue; }
      const pos = positions.get(p.id);
      const cell = pos ? canonical(pos, owner) : { r: -11, c: -7 };
      values.push(...PIECE_TYPES.map((type) => +(type === p.type)), cell.r / 11, cell.c / 7,
        Math.max(0, p.hp) / 4, p.maxHp / 4, p.atk / 3, +p.freeMove, +p.freeAttack, +p.dead,
        +state.lastTurnDeaths.includes(p.id), +state.previousTurnDeaths.includes(p.id), +state.deadThisTurn.includes(p.id), +(state.pendingPromotion === p.id));
    }
  }
  return quantized(values);
}

export function encodeCandidates(state: GameState, decisions: Decision[]): number[][] {
  const owner = state.currentPlayer;
  const positions = new Map<string, Cell>();
  state.board.forEach((row, r) => row.forEach((id, c) => { if (id) positions.set(id, { r, c }); }));
  const enemies = Object.values(state.pieces).filter((p) => p.owner !== owner && !p.dead && positions.has(p.id));
  const enemyCells = enemies.map((p) => positions.get(p.id)!);
  const enemyChair = enemies.find((p) => p.type === 'chairman');
  const chair = enemyChair ? positions.get(enemyChair.id)! : null;
  const distance = (a: Cell, b: Cell) => Math.max(Math.abs(a.r - b.r), Math.abs(a.c - b.c));
  const nearest = (c: Cell) => enemyCells.length ? Math.min(...enemyCells.map((p) => distance(c, p))) : 0;
  const threat = Array(ROWS * COLS).fill(0);
  for (const p of enemies) {
    for (const c of cellsForAttackKind(PIECE_DEFS[p.type].attack, positions.get(p.id)!)) threat[c.r * COLS + c.c] += p.atk;
  }
  const matDiff = (material(state, owner) - material(state, (1 - owner) as Owner)) / 60;
  return decisions.map((d) => {
    const f = Array(CANDIDATE_FEATURES).fill(0);
    f[DECISION_KINDS.indexOf(d.kind)] = 1;
    f[60] = state.ap / 8;
    f[61] = matDiff;
    if (d.promotion) f[42 + PROMOTABLE.indexOf(d.promotion)] = 1;
    const p = d.pieceId ? state.pieces[d.pieceId] : null;
    if (!p) return quantized(f);
    const from = positions.get(p.id)!;
    const to = d.to ?? (d.targets?.[0] ? positions.get(d.targets[0])! : from);
    const s = canonical(from, owner), t = canonical(to, owner);
    PIECE_TYPES.forEach((type, i) => { f[10 + i] = +(type === p.type); });
    f[16] = s.r / 11; f[17] = s.c / 7; f[18] = t.r / 11; f[19] = t.c / 7;
    f[20] = (t.r - s.r) / 2; f[21] = (t.c - s.c) / 2;
    f[22] = p.hp / 4; f[23] = p.maxHp / 4; f[24] = p.atk / 3; f[25] = +p.freeMove; f[26] = +p.freeAttack;
    const cost = ['warrior', 'mage', 'activate', 'revive'].includes(d.kind) ? 2 : ['move', 'attack'].includes(d.kind) ? 1 : 0;
    f[27] = cost / 2; f[28] = (d.targets?.length ?? 0) / 3;
    let killed = 0;
    d.targets?.forEach((id, i) => {
      const target = state.pieces[id], cell = canonical(positions.get(id)!, owner);
      const damage = d.kind === 'mage' || d.kind === 'warrior' ? 2 : p.atk;
      f[29] += Math.max(0, target.hp) / 12;
      f[30] += Math.min(damage, Math.max(0, target.hp)) / 9;
      if (damage >= target.hp) { f[31] += 1 / 3; f[32] += PIECE_VALUES[target.type] / 18; killed++; }
      f[41] += PIECE_VALUES[target.type] / 18;
      const offset = 64 + i * 10;
      f[offset] = cell.r / 11; f[offset + 1] = cell.c / 7; f[offset + 2] = target.hp / 4; f[offset + 3] = target.atk / 3;
      PIECE_TYPES.forEach((type, j) => { f[offset + 4 + j] = +(type === target.type); });
      if (d.kind === 'attack' && cellsForAttackKind(PIECE_DEFS[target.type].attack, positions.get(id)!).some((c) => c.r === from.r && c.c === from.c)) {
        f[33] = target.atk / 3; f[34] = +(target.atk >= p.hp && !(p.type === 'novice' && killed));
      }
    });
    f[35] = nearest(from) / 12; f[36] = nearest(to) / 12; f[37] = (nearest(from) - nearest(to)) / 4;
    f[38] = threat[to.r * COLS + to.c] / 12; f[39] = threat[from.r * COLS + from.c] / 12;
    f[40] = PIECE_VALUES[p.type] / 6; f[55] = +(p.type === 'novice' && killed > 0);
    f[56] = +isPrepCell(owner, to.r); f[57] = +isPrepCell((1 - owner) as Owner, to.r);
    if (chair) { f[58] = distance(from, chair) / 12; f[59] = distance(to, chair) / 12; }
    f[60] = (state.ap - cost) / 8; f[63] = (s.r - t.r) / 11;
    if (d.reviveId) {
      const revived = state.pieces[d.reviveId];
      f[46] = revived.maxHp / 4; f[47] = revived.atk / 3; f[48] = PIECE_VALUES[revived.type] / 6;
      PIECE_TYPES.forEach((type, i) => { f[49 + i] = +(type === revived.type); });
      if (revived.type === 'chairman') f[60] += 4 / 8;
    }
    f[94] = f[34] * f[40]; f[95] = +(d.kind === 'activate');
    return quantized(f);
  });
}

/** A separate, deterministic training/evaluation opponent; not the game's old expert AI. */
export function tacticalScores(features: number[][]): number[] {
  return features.map((f) => {
    if (f[0]) return -0.8;
    if (f[9]) return 2 * f[42] + 0.3 * f[43] + 0.7 * f[44] + 0.6 * f[45];
    return 30 * f[32] + 3 * f[30] - 9 * f[94] + 3 * f[55] + 2 * f[48] + 3 * f[54]
      + 0.8 * f[37] - 0.7 * f[38] * f[40] + 0.15 * (f[58] - f[59]) - 0.05 * f[27]
      - 0.15 * f[95] + 0.03 * f[63];
  });
}
