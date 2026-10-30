import { checkWinner, computeAp, opponent } from './engine';
import { isInAttackRange, pieceCell } from './ranges';
import type { Cell, GameState, Piece } from './types';

export function clonePieces(state: GameState, updates: Record<string, Partial<Piece>>): GameState['pieces'] {
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

  const pieces = clonePieces(state, {
    [attackerId]: { hp: attacker.hp - attackerDamage },
    [targetId]: { hp: target.hp - targetDamage },
  });

  const pendingPromotion =
    attacker.type === 'novice' && pieces[targetId].hp <= 0 ? attackerId : state.pendingPromotion;

  return {
    ...state,
    pieces,
    pendingPromotion,
  };
}

export function removeDeadPieces(state: GameState): GameState {
  if (state.pendingPromotion) return state;
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
  if (next.winner !== null) {
    next.phase = 'finished';
    next.clockRunning = false;
    next.turnStarted = false;
  }
  return next;
}

export function endTurn(state: GameState): GameState {
  if (state.phase !== 'play' || state.winner !== null || state.pendingPromotion) return state;
  const currentPlayer = opponent(state.currentPlayer);
  const turn = state.turn + 1;
  const next: GameState = {
    ...state,
    pieces: Object.fromEntries(Object.entries(state.pieces).map(([id, piece]) => [id,
      piece.freeMove || piece.freeAttack ? { ...piece, freeMove: false, freeAttack: false } : piece,
    ])),
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

export function applyGameAction(state: GameState, action: import('./types').GameAction): GameState {
  switch (action.type) {
    case 'dealDamage': {
      const damaged = dealDamage(state, action.attackerId, action.targetId, {
        counterImmune: action.counterImmune,
        targetDamage: action.amount,
      });
      return removeDeadPieces(damaged);
    }
    case 'heal': {
      const piece = state.pieces[action.pieceId];
      if (!piece) return state;
      return {
        ...state,
        pieces: clonePieces(state, {
          [action.pieceId]: { hp: Math.min(piece.maxHp, piece.hp + action.amount) },
        }),
      };
    }
    case 'move':
      return movePiece(state, action.pieceId, action.to);
    case 'revive': {
      const piece = state.pieces[action.pieceId];
      if (!piece) return state;
      const board = state.board.map((row) => row.slice());
      board[action.to.r][action.to.c] = action.pieceId;
      return {
        ...state,
        board,
        pieces: clonePieces(state, { [action.pieceId]: { dead: false, hp: piece.maxHp } }),
      };
    }
    case 'endTurn':
      return endTurn(state);
    default:
      return state;
  }
}
