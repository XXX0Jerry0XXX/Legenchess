import { describe, expect, it } from 'vitest';
import { applyDecision, legalDecisions } from './decisions';
import { createPiece } from './engine';
import { createInitialState, reducer } from './reducer';
import type { GameState, Owner } from './types';

function position(entries: [Owner, string, number, number][]): GameState {
  const state = { ...createInitialState(), phase: 'play' as const, ap: 6, turn: 1 };
  entries.forEach(([owner, type, r, c]) => {
    const p = createPiece(owner, type); state.pieces[p.id] = p; state.board[r][c] = p.id;
  });
  return state;
}

describe('共享完整合法决策', () => {
  it('枚举法师所有 1～3 目标组合，整组只扣一次 AP 且不反击', () => {
    const state = position([[0, 'mage', 5, 3], [1, 'novice', 3, 1], [1, 'novice', 3, 3], [1, 'novice', 3, 5]]);
    const before = JSON.stringify(state), mage = state.board[5][3]!;
    const choices = legalDecisions(state).filter((d) => d.kind === 'mage');
    expect(choices).toHaveLength(7);
    for (const choice of choices) {
      const next = applyDecision(state, choice);
      expect(next.ap).toBe(4);
      expect(next.pieces[mage].hp).toBe(1);
      expect(Object.values(next.pieces).filter((p) => p.dead)).toHaveLength(choice.targets!.length);
    }
    expect(JSON.stringify(state)).toBe(before);
  });

  it.each(['attack', 'generic'])('新手双方同时致命时先转职再判胜（%s 路径）', (path) => {
    let state = position([[0, 'novice', 5, 3], [1, 'assassin', 5, 4]]);
    const novice = state.board[5][3]!, target = state.board[5][4]!;
    state = path === 'attack' ? applyDecision(state, { kind: 'attack', pieceId: novice, targets: [target] })
      : reducer(state, { type: 'APPLY_GAME_ACTIONS', actions: [{ type: 'dealDamage', attackerId: novice, targetId: target, amount: 1 }] });
    expect(state.pendingPromotion).toBe(novice);
    expect(state.phase).toBe('play');
    expect(legalDecisions(state).map((d) => d.kind)).toEqual(['promote', 'promote', 'promote', 'promote']);
    expect(reducer(state, { type: 'END_TURN' })).toBe(state);
    state = applyDecision(state, { kind: 'promote', promotion: 'warrior' });
    expect(state.pieces[novice].hp).toBe(4);
    expect(state.pieces[novice].dead).toBe(false);
    expect(state.pieces[target].dead).toBe(true);
    expect(state.winner).toBe(0);
    expect(legalDecisions(state)).toEqual([]);
    expect(reducer(state, { type: 'END_TURN' })).toBe(state);
  });

  it('AP 为零仍可免费攻击，未用完的免费次数在换回合时清理', () => {
    let state = position([[0, 'assassin', 5, 3], [1, 'warrior', 5, 4]]);
    const assassin = state.board[5][3]!, target = state.board[5][4]!;
    state.ap = 0;
    state.pieces[assassin] = { ...state.pieces[assassin], freeMove: true, freeAttack: true };
    const choices = legalDecisions(state);
    expect(choices.some((d) => d.kind === 'freeMove')).toBe(true);
    expect(choices.some((d) => d.kind === 'attack' || d.kind === 'activate' || d.kind === 'move')).toBe(false);
    state = applyDecision(state, { kind: 'freeAttack', pieceId: assassin, targets: [target] });
    expect(state.ap).toBe(0);
    expect(state.pieces[assassin].hp).toBe(1);
    expect(state.pieces[target].hp).toBe(1);
    expect(state.pieces[assassin].freeAttack).toBe(false);
    state = applyDecision(state, { kind: 'end' });
    expect(state.currentPlayer).toBe(1);
    expect(state.pieces[assassin].freeMove).toBe(false);
  });

  it('复活保留转职形态和会长 AP 奖励，过期目标不合法', () => {
    let state = position([[0, 'priest', 0, 0], [1, 'warrior', 8, 0]]);
    const priest = state.board[0][0]!;
    const chairman = { ...createPiece(0, 'chairman'), hp: 0, dead: true };
    state.pieces[chairman.id] = chairman;
    state.lastTurnDeaths = [chairman.id];
    expect(legalDecisions(state).filter((d) => d.kind === 'revive')).toHaveLength(23);
    state = applyDecision(state, { kind: 'revive', pieceId: priest, reviveId: chairman.id, to: { r: 2, c: 7 } });
    expect(state.ap).toBe(8);
    expect(state.pieces[chairman.id].hp).toBe(3);
    expect(state.lastTurnDeaths).toEqual([]);
    expect(legalDecisions(state).some((d) => d.kind === 'revive')).toBe(false);
  });

  it('拒绝错误职业技能与不在范围内的动作', () => {
    let state = position([[0, 'mage', 5, 3], [1, 'novice', 4, 3]]);
    const mage = state.board[5][3]!, target = state.board[4][3]!;
    expect(() => applyDecision(state, { kind: 'warrior', pieceId: mage, targets: [target] })).toThrow();
    expect(() => applyDecision(state, { kind: 'move', pieceId: mage, to: { r: 11, c: 7 } })).toThrow();
    state = reducer(state, { type: 'SELECT_PIECE', id: mage });
    state = reducer(state, { type: 'SET_MODE', mode: 'warrior' });
    expect(reducer(state, { type: 'WARRIOR', targetId: target })).toBe(state);
  });
});
