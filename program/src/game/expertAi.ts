import { getPiece, getSkill } from './registry';
import { getAttackCells, getMoveCells, getWarriorSkillCells, getMageSkillCells } from './ranges';
import { emptyPrepCell, shuffled } from './setup';
import type { Action } from './types';
import type { GameState } from './types';

const PIECE_VALUE: Record<string, number> = {
  novice: 1,
  warrior: 4,
  mage: 3,
  assassin: 3,
  priest: 3,
  chairman: 6,
};

function evaluate(state: GameState, aiPlayer: 0 | 1): number {
  let score = 0;
  for (const piece of Object.values(state.pieces)) {
    if (piece.dead) continue;
    const value = (PIECE_VALUE[piece.type] ?? 2) + piece.hp * 0.15;
    if (piece.owner === aiPlayer) score += value;
    else score -= value;
  }
  score += state.ap * 0.1;
  return score;
}

export function chooseExpertAiActions(state: GameState, apply: (s: GameState, a: Action) => GameState): Action[] {
  if (state.phase !== 'play' || state.currentPlayer !== state.aiPlayer || state.winner) return [];
  if (state.pendingPromotion) return [{ type: 'CHOOSE_PROMOTION', pieceType: 'warrior' }];

  const ai = state.aiPlayer;
  const own = shuffled(Object.values(state.pieces).filter((p) => p.owner === ai && !p.dead));
  const candidates: Action[][] = [];

  for (const piece of own) {
    const attackTargets = shuffled(getAttackCells(state, piece.id));
    for (const target of attackTargets) {
      const targetId = state.board[target.r][target.c];
      if (targetId) {
        candidates.push([
          { type: 'SELECT_PIECE', id: piece.id },
          { type: 'SET_MODE', mode: 'attack' },
          { type: 'ATTACK', targetId },
        ]);
      }
    }

    const moveCells = shuffled(getMoveCells(state, piece.id)).slice(0, 10);
    for (const cell of moveCells) {
      candidates.push([
        { type: 'SELECT_PIECE', id: piece.id },
        { type: 'SET_MODE', mode: 'move' },
        { type: 'MOVE', r: cell.r, c: cell.c },
      ]);
    }

    const def = getPiece(piece.type);
    if (!def) continue;
    const skill = getSkill(def.skill);
    if (!skill) continue;

    if (def.type === 'warrior' && state.ap >= 2) {
      for (const cell of shuffled(getWarriorSkillCells(state, piece.id)).slice(0, 3)) {
        const targetId = state.board[cell.r][cell.c];
        if (targetId) {
          candidates.push([
            { type: 'SELECT_PIECE', id: piece.id },
            { type: 'SET_MODE', mode: 'warrior' },
            { type: 'WARRIOR', targetId },
          ]);
        }
      }
    }

    if (def.type === 'mage' && state.ap >= 2) {
      for (const cell of shuffled(getMageSkillCells(state, piece.id)).slice(0, 3)) {
        const targetId = state.board[cell.r][cell.c];
        if (targetId) {
          candidates.push([
            { type: 'SELECT_PIECE', id: piece.id },
            { type: 'SET_MODE', mode: 'mage' },
            { type: 'TOGGLE_MAGE', id: targetId },
            { type: 'CONFIRM_MAGE' },
          ]);
        }
      }
    }
  }

  if (state.ap >= 2) {
    const deathPool = [...state.lastTurnDeaths, ...state.previousTurnDeaths];
    const revivable = deathPool.find(
      (id) => state.pieces[id]?.owner === ai && state.pieces[id]?.dead,
    );
    if (revivable) {
      const priest = own.find((p) => p.type === 'priest');
      const cell = emptyPrepCell(state, ai);
      if (priest && cell) {
        candidates.push([
          { type: 'SELECT_PIECE', id: priest.id },
          { type: 'SET_MODE', mode: 'revive' },
          { type: 'CHOOSE_REVIVE', id: revivable },
          { type: 'PLACE_REVIVE', r: cell.r, c: cell.c },
        ]);
      }
    }
  }

  candidates.push([{ type: 'END_TURN' }]);

  let best: Action[] = [{ type: 'END_TURN' }];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const actions of candidates) {
    const next = actions.reduce((s, a) => apply(s, a), state);
    if (next === state) continue;
    const score = evaluate(next, ai);
    if (score > bestScore) {
      bestScore = score;
      best = actions;
    }
  }

  return best;
}
