import { MAX_MAGE_TARGETS, PROMOTABLE, SKILL_COST, prepRows } from './constants';
import { getAttackCells, getMageSkillCells, getMoveCells, getWarriorSkillCells } from './ranges';
import { reducer } from './reducer';
import type { Action, Cell, GameState, PieceType } from './types';

export const DECISION_KINDS = ['end', 'move', 'attack', 'warrior', 'mage', 'activate', 'freeMove', 'freeAttack', 'revive', 'promote'] as const;
export type DecisionKind = typeof DECISION_KINDS[number];
export interface Decision {
  kind: DecisionKind;
  pieceId?: string;
  to?: Cell;
  targets?: string[];
  reviveId?: string;
  promotion?: PieceType;
}

export function decisionKey(d: Decision): string {
  return JSON.stringify([d.kind, d.pieceId, d.to?.r, d.to?.c, d.targets, d.reviveId, d.promotion]);
}

export function legalDecisions(state: GameState): Decision[] {
  if (state.phase !== 'play' || state.winner !== null) return [];
  if (state.pendingPromotion) return PROMOTABLE.map((promotion) => ({ kind: 'promote', promotion }));
  const result: Decision[] = [];
  const own = state.board.flat().filter((id): id is string => !!id && state.pieces[id].owner === state.currentPlayer && !state.pieces[id].dead);
  const revivable = [...new Set([...state.lastTurnDeaths, ...state.previousTurnDeaths])]
    .filter((id) => state.pieces[id]?.dead && state.pieces[id].owner === state.currentPlayer);
  const prepEmpty: Cell[] = [];
  for (const r of prepRows(state.currentPlayer)) {
    state.board[r].forEach((id, c) => { if (!id) prepEmpty.push({ r, c }); });
  }
  for (const pieceId of own) {
    const piece = state.pieces[pieceId];
    const moves = state.ap >= 1 || piece.freeMove ? getMoveCells(state, pieceId) : [];
    const targets = state.ap >= 1 || piece.freeAttack ? getAttackCells(state, pieceId).map((c) => state.board[c.r][c.c]!) : [];
    if (state.ap >= 1) {
      moves.forEach((to) => result.push({ kind: 'move', pieceId, to }));
      targets.forEach((id) => result.push({ kind: 'attack', pieceId, targets: [id] }));
    }
    if (piece.type === 'assassin') {
      if (piece.freeMove) moves.forEach((to) => result.push({ kind: 'freeMove', pieceId, to }));
      if (piece.freeAttack) targets.forEach((id) => result.push({ kind: 'freeAttack', pieceId, targets: [id] }));
    }
    if (state.ap < SKILL_COST) continue;
    if (piece.type === 'warrior') {
      getWarriorSkillCells(state, pieceId).forEach((c) => result.push({ kind: 'warrior', pieceId, targets: [state.board[c.r][c.c]!] }));
    } else if (piece.type === 'mage') {
      const ids = getMageSkillCells(state, pieceId).map((c) => state.board[c.r][c.c]!);
      const visit = (chosen: string[], start: number) => {
        if (chosen.length) result.push({ kind: 'mage', pieceId, targets: chosen });
        if (chosen.length === MAX_MAGE_TARGETS) return;
        for (let i = start; i < ids.length; i++) visit([...chosen, ids[i]], i + 1);
      };
      visit([], 0);
    } else if (piece.type === 'assassin' && !piece.freeMove && !piece.freeAttack) {
      result.push({ kind: 'activate', pieceId });
    } else if (piece.type === 'priest') {
      revivable.forEach((reviveId) => prepEmpty.forEach((to) => result.push({ kind: 'revive', pieceId, reviveId, to })));
    }
  }
  result.push({ kind: 'end' });
  return result;
}

export function decisionActions(d: Decision): Action[] {
  if (d.kind === 'end') return [{ type: 'END_TURN' }];
  if (d.kind === 'promote') return [{ type: 'CHOOSE_PROMOTION', pieceType: d.promotion! }];
  const actions: Action[] = [{ type: 'SELECT_PIECE', id: d.pieceId! }];
  switch (d.kind) {
    case 'move': return [...actions, { type: 'SET_MODE', mode: 'move' }, { type: 'MOVE', ...d.to! }];
    case 'attack': return [...actions, { type: 'SET_MODE', mode: 'attack' }, { type: 'ATTACK', targetId: d.targets![0] }];
    case 'warrior': return [...actions, { type: 'SET_MODE', mode: 'warrior' }, { type: 'WARRIOR', targetId: d.targets![0] }];
    case 'mage': return [...actions, { type: 'SET_MODE', mode: 'mage' }, ...d.targets!.map((id): Action => ({ type: 'TOGGLE_MAGE', id })), { type: 'CONFIRM_MAGE' }];
    case 'activate': return [...actions, { type: 'USE_ASSASSIN' }];
    case 'freeMove': return [...actions, { type: 'SET_MODE', mode: 'assassinMove' }, { type: 'ASSASSIN_MOVE', ...d.to! }];
    case 'freeAttack': return [...actions, { type: 'SET_MODE', mode: 'assassinAttack' }, { type: 'ASSASSIN_ATTACK', targetId: d.targets![0] }];
    case 'revive': return [...actions, { type: 'SET_MODE', mode: 'revive' }, { type: 'CHOOSE_REVIVE', id: d.reviveId! }, { type: 'PLACE_REVIVE', ...d.to! }];
  }
}

/** Only call with a decision just returned by legalDecisions for this exact state. */
export function applyListedDecision(state: GameState, decision: Decision): GameState {
  return reducer(state, { type: 'APPLY_ACTIONS', actions: decisionActions(decision) });
}

export function applyDecision(state: GameState, decision: Decision): GameState {
  const key = decisionKey(decision);
  const legal = legalDecisions(state).find((d) => decisionKey(d) === key);
  if (!legal) throw new Error('Illegal game decision');
  return applyListedDecision(state, legal);
}
