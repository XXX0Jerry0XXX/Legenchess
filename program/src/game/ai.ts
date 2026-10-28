import { ATTACK_COST, MOVE_COST, SKILL_COST } from './constants';
import { getAttackCells, getMoveCells } from './ranges';
import type { Action } from './reducer';
import { shuffled, emptyPrepCell } from './setup';
import type { GameState } from './types';

export function chooseBeginnerAiActions(state: GameState): Action[] {
  if (
    state.phase !== 'play' ||
    state.mode !== 'ai' ||
    state.currentPlayer !== state.aiPlayer ||
    state.winner
  ) {
    return [];
  }

  if (state.pendingPromotion) {
    return [{ type: 'CHOOSE_PROMOTION', pieceType: 'warrior' }];
  }

  if (state.ap >= SKILL_COST) {
    const deathPool = [...state.lastTurnDeaths, ...state.previousTurnDeaths];
    const revivable = deathPool.find(
      (id) =>
        state.pieces[id]?.owner === state.currentPlayer &&
        state.pieces[id]?.dead &&
        state.pieces[id].type !== 'chairman',
    );
    if (revivable) {
      const priest = Object.values(state.pieces).find(
        (p) => p.owner === state.currentPlayer && !p.dead && p.type === 'priest',
      );
      const cell = emptyPrepCell(state, state.currentPlayer);
      if (priest && cell) {
        return [
          { type: 'SELECT_PIECE', id: priest.id },
          { type: 'SET_MODE', mode: 'revive' },
          { type: 'CHOOSE_REVIVE', id: revivable },
          { type: 'PLACE_REVIVE', r: cell.r, c: cell.c },
        ];
      }
    }
  }

  if (state.ap >= ATTACK_COST) {
    const attackers = shuffled(
      Object.values(state.pieces).filter(
        (p) => p.owner === state.currentPlayer && !p.dead,
      ),
    );
    for (const piece of attackers) {
      const targets = shuffled(getAttackCells(state, piece.id));
      if (targets.length > 0) {
        const targetId = state.board[targets[0].r][targets[0].c];
        if (targetId) {
          return [
            { type: 'SELECT_PIECE', id: piece.id },
            { type: 'SET_MODE', mode: 'attack' },
            { type: 'ATTACK', targetId },
          ];
        }
      }
    }
  }

  if (state.ap >= MOVE_COST) {
    const movers = shuffled(
      Object.values(state.pieces).filter(
        (p) => p.owner === state.currentPlayer && !p.dead,
      ),
    );
    for (const piece of movers) {
      const cells = shuffled(getMoveCells(state, piece.id));
      if (cells.length > 0) {
        const cell = cells[0];
        return [
          { type: 'SELECT_PIECE', id: piece.id },
          { type: 'SET_MODE', mode: 'move' },
          { type: 'MOVE', r: cell.r, c: cell.c },
        ];
      }
    }
  }

  return [{ type: 'END_TURN' }];
}
