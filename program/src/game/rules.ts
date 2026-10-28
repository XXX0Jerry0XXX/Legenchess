import { checkWinner, computeAp, opponent } from './engine';
import { isInAttackRange, pieceCell } from './ranges';
import type { Cell, GameState, Piece } from './types';

function clonePieces(state: GameState, updates: Record<string, Partial<Piece>>): GameState['pieces'] {
  const pieces = { ...state.pieces };
  for (const [id, patch] of Object.entries(updates)) {
    pieces[id] = { ...pieces[id], ...patch };
  }
  return pieces;
}

export function movePiece(state: GameState, pieceId: string, to: Cell): GameState {
  const from = pieceCell(state, pieceId);
  if (!from) return state;
  const board = state.board.map((row) => row.slice());
  board[from.r][from.c] = null;
  board[to.r][to.c] = pieceId;
  return { ...state, board };
}

export function dealDamage(
  state: GameState,
  attackerId: string,
  targetId: string,
  options: { counter?: boolean; counterImmune?: boolean; attackerDamage?: number; targetDamage?: number } = {},
): GameState {
  const attacker = state.pieces[attackerId];
  const target = state.pieces[targetId];
  if (!attacker || !target) return state;

  const targetDamage = options.targetDamage ?? attacker.atk;
  let attackerDamage = options.attackerDamage ?? 0;
  if (options.counter !== false && !options.counterImmune && isInAttackRange(state, targetId, attackerId)) {
    attackerDamage = target.atk;
  }

  return {
    ...state,
    pieces: clonePieces(state, {
      [attackerId]: { hp: attacker.hp - attackerDamage },
      [targetId]: { hp: target.hp - targetDamage },
    }),
  };
}

export function removeDeadPieces(state: GameState): GameState {
  const pieces = { ...state.pieces };
  const board = state.board.map((row) => row.slice());
  const deadIds: string[] = [];

  for (const id of Object.keys(pieces)) {
    if (pieces[id].hp <= 0 && !pieces[id].dead) {
      pieces[id] = { ...pieces[id], dead: true };
      deadIds.push(id);
    }
  }

  for (const id of deadIds) {
    for (let r = 0; r < board.length; r += 1) {
      for (let c = 0; c < board[r].length; c += 1) {
        if (board[r][c] === id) board[r][c] = null;
      }
    }
  }

  const next: GameState = {
    ...state,
    pieces,
    board,
    deadThisTurn: [...state.deadThisTurn, ...deadIds],
  };
  next.winner = checkWinner(next);
  return next;
}

export function endTurn(state: GameState): GameState {
  const currentPlayer = opponent(state.currentPlayer);
  const turn = state.turn + 1;
  const next: GameState = {
    ...state,
    currentPlayer,
    turn,
    previousTurnDeaths: state.lastTurnDeaths,
    lastTurnDeaths: state.deadThisTurn,
    deadThisTurn: [],
    selectedId: null,
    actionMode: null,
    mageTargets: [],
    skillTargets: [],
    pendingPromotion: null,
    pendingRevive: null,
    clockRunning: true,
    turnStarted: true,
  };
  next.ap = computeAp(next);
  return next;
}
