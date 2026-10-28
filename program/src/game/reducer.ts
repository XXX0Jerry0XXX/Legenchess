import {
  OBSERVE_TIME,
  PIECE_DEFS,
  PLAYER_TIME,
  PROMOTABLE,
  SETUP_COUNTS,
  isPrepCell,
} from './constants';
import { aliveCount, checkWinner, computeAp, createPiece, emptyBoard } from './engine';
import {
  getAttackCells,
  getMageSkillCells,
  getMoveCells,
  getWarriorSkillCells,
  isInAttackRange,
  pieceCell,
} from './ranges';
import type {
  ActionMode,
  Cell,
  GameState,
  Owner,
  Piece,
  PieceType,
} from './types';

export type Action =
  | { type: 'START_SETUP'; firstPlayer: Owner }
  | { type: 'SELECT_SETUP'; pieceType: PieceType | null }
  | { type: 'PLACE_SETUP'; r: number; c: number }
  | { type: 'UNDO_SETUP'; r: number; c: number }
  | { type: 'NEXT_SETUP' }
  | { type: 'START_PLAY' }
  | { type: 'SELECT_PIECE'; id: string | null }
  | { type: 'SET_MODE'; mode: ActionMode }
  | { type: 'MOVE'; r: number; c: number }
  | { type: 'ATTACK'; targetId: string }
  | { type: 'WARRIOR'; targetId: string }
  | { type: 'TOGGLE_MAGE'; id: string }
  | { type: 'CONFIRM_MAGE' }
  | { type: 'USE_ASSASSIN' }
  | { type: 'ASSASSIN_MOVE'; r: number; c: number }
  | { type: 'ASSASSIN_ATTACK'; targetId: string }
  | { type: 'CHOOSE_REVIVE'; id: string }
  | { type: 'PLACE_REVIVE'; r: number; c: number }
  | { type: 'CHOOSE_PROMOTION'; pieceType: PieceType }
  | { type: 'END_TURN' }
  | { type: 'TICK' }
  | { type: 'OBSERVE_TICK' }
  | { type: 'RESIGN'; owner: Owner }
  | { type: 'IMPORT_PRESET'; owner: Owner; placements: { type: PieceType; r: number; c: number }[] }
  | { type: 'RESTORE'; state: GameState };

export function createInitialState(): GameState {
  const tray = {
    0: { ...SETUP_COUNTS },
    1: { ...SETUP_COUNTS },
  } as GameState['setupTray'];

  return {
    phase: 'start',
    firstPlayer: 0,
    currentPlayer: 0,
    setupOwner: 0,
    turn: 0,
    ap: 0,
    board: emptyBoard(),
    pieces: {},
    setupTray: tray,
    selectedId: null,
    selectedSetupType: null,
    actionMode: null,
    mageTargets: [],
    lastTurnDeaths: [],
    deadThisTurn: [],
    pendingPromotion: null,
    pendingRevive: null,
    winner: null,
    times: { 0: PLAYER_TIME, 1: PLAYER_TIME },
    observationRemaining: OBSERVE_TIME,
    clockRunning: false,
    turnStarted: false,
  };
}

function clonePieces(state: GameState, updates: Record<string, Partial<Piece>>): GameState['pieces'] {
  const pieces = { ...state.pieces };
  for (const [id, patch] of Object.entries(updates)) {
    pieces[id] = { ...pieces[id], ...patch };
  }
  return pieces;
}

function removeDead(state: GameState): GameState {
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

function dealDamage(
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

  let pendingPromotion = state.pendingPromotion;
  if (attacker.type === 'novice' && pieces[targetId].hp <= 0) {
    pendingPromotion = attackerId;
  }

  const next: GameState = { ...state, pieces, pendingPromotion };
  if (pendingPromotion) return next;
  return removeDead(next);
}

function endTurn(state: GameState): GameState {
  const currentPlayer = (1 - state.currentPlayer) as Owner;
  const turn = state.turn + 1;
  const next: GameState = {
    ...state,
    currentPlayer,
    turn,
    lastTurnDeaths: state.deadThisTurn,
    deadThisTurn: [],
    selectedId: null,
    actionMode: null,
    mageTargets: [],
    pendingPromotion: null,
    pendingRevive: null,
    clockRunning: true,
    turnStarted: true,
  };
  next.ap = computeAp(next);
  return next;
}

function startPlay(state: GameState): GameState {
  const next: GameState = {
    ...state,
    phase: 'play',
    currentPlayer: state.firstPlayer,
    turn: 1,
    selectedId: null,
    actionMode: null,
    mageTargets: [],
    pendingPromotion: null,
    pendingRevive: null,
    winner: null,
    observationRemaining: 0,
    clockRunning: false,
    turnStarted: false,
  };
  next.ap = computeAp(next);
  return next;
}

function timeoutResult(state: GameState): GameState {
  const a = aliveCount(state, 0);
  const b = aliveCount(state, 1);
  const winner = a === b ? 'draw' : a > b ? 0 : 1;
  return { ...state, winner, phase: 'finished', clockRunning: false, turnStarted: false };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'START_SETUP':
      return {
        ...createInitialState(),
        phase: 'setup',
        firstPlayer: action.firstPlayer,
        currentPlayer: action.firstPlayer,
      };

    case 'SELECT_SETUP':
      return { ...state, selectedSetupType: action.pieceType };

    case 'PLACE_SETUP': {
      if (state.phase !== 'setup' || !state.selectedSetupType) return state;
      const type = state.selectedSetupType;
      if (state.setupTray[state.setupOwner][type] <= 0) return state;
      if (!isPrepCell(state.setupOwner, action.r) || state.board[action.r][action.c] !== null) return state;
      const piece = createPiece(state.setupOwner, type);
      const board = state.board.map((row) => row.slice());
      board[action.r][action.c] = piece.id;
      const tray = {
        ...state.setupTray,
        [state.setupOwner]: {
          ...state.setupTray[state.setupOwner],
          [type]: state.setupTray[state.setupOwner][type] - 1,
        },
      } as GameState['setupTray'];
      return {
        ...state,
        pieces: { ...state.pieces, [piece.id]: piece },
        board,
        setupTray: tray,
        selectedSetupType: tray[state.setupOwner][type] === 0 ? null : type,
      };
    }

    case 'UNDO_SETUP': {
      if (state.phase !== 'setup') return state;
      const id = state.board[action.r][action.c];
      if (!id || state.pieces[id].owner !== state.setupOwner) return state;
      const piece = state.pieces[id];
      const board = state.board.map((row) => row.slice());
      board[action.r][action.c] = null;
      const tray = {
        ...state.setupTray,
        [state.setupOwner]: {
          ...state.setupTray[state.setupOwner],
          [piece.type]: state.setupTray[state.setupOwner][piece.type] + 1,
        },
      } as GameState['setupTray'];
      const pieces = { ...state.pieces };
      delete pieces[id];
      return { ...state, pieces, board, setupTray: tray };
    }

    case 'NEXT_SETUP': {
      if (state.phase !== 'setup') return state;
      if (state.setupOwner === 0) {
        return { ...state, setupOwner: 1, selectedSetupType: null };
      }
      return { ...state, phase: 'observe', observationRemaining: OBSERVE_TIME };
    }

    case 'START_PLAY':
      return startPlay(state);

    case 'SELECT_PIECE': {
      if (state.phase !== 'play') return state;
      if (action.id && state.pieces[action.id]?.owner !== state.currentPlayer) return state;
      if (action.id && state.pieces[action.id].dead) return state;
      return { ...state, selectedId: action.id, actionMode: null, mageTargets: [] };
    }

    case 'SET_MODE':
      return { ...state, actionMode: action.mode, mageTargets: action.mode === 'mage' ? state.mageTargets : [] };

    case 'MOVE': {
      const id = state.selectedId;
      if (!id || state.actionMode !== 'move') return state;
      const from = pieceCell(state, id);
      if (!from) return state;
      if (!getMoveCells(state, id).some((c) => c.r === action.r && c.c === action.c)) return state;
      const board = state.board.map((row) => row.slice());
      board[from.r][from.c] = null;
      board[action.r][action.c] = id;
      return {
        ...state,
        board,
        ap: state.ap - 1,
        actionMode: 'move',
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'ATTACK': {
      const id = state.selectedId;
      if (!id || state.actionMode !== 'attack') return state;
      if (!getAttackCells(state, id).some((c) => state.board[c.r][c.c] === action.targetId)) return state;
      const next = dealDamage(state, id, action.targetId);
      return {
        ...next,
        ap: state.ap - 1,
        actionMode: 'attack',
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'WARRIOR': {
      const id = state.selectedId;
      if (!id || state.actionMode !== 'warrior' || state.ap < 2) return state;
      if (!getWarriorSkillCells(state, id).some((c) => state.board[c.r][c.c] === action.targetId)) return state;
      const next = dealDamage(state, id, action.targetId, { counter: false, targetDamage: 2 });
      return {
        ...next,
        ap: state.ap - 2,
        actionMode: 'warrior',
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'TOGGLE_MAGE': {
      if (state.actionMode !== 'mage') return state;
      const id = action.id;
      const targets = state.mageTargets.includes(id)
        ? state.mageTargets.filter((x) => x !== id)
        : state.mageTargets.length < 3
          ? [...state.mageTargets, id]
          : state.mageTargets;
      return { ...state, mageTargets: targets };
    }

    case 'CONFIRM_MAGE': {
      const id = state.selectedId;
      if (!id || state.actionMode !== 'mage' || state.ap < 2) return state;
      if (state.mageTargets.length < 1 || state.mageTargets.length > 3) return state;
      const valid = state.mageTargets.every((targetId) =>
        getMageSkillCells(state, id).some((c) => state.board[c.r][c.c] === targetId),
      );
      if (!valid) return state;
      let next = state;
      for (const targetId of state.mageTargets) {
        next = dealDamage(next, id, targetId, { counter: false, attackerDamage: 0, targetDamage: 2 });
      }
      return {
        ...next,
        ap: state.ap - 2,
        actionMode: 'mage',
        mageTargets: [],
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'USE_ASSASSIN': {
      const id = state.selectedId;
      const piece = id ? state.pieces[id] : undefined;
      if (!id || !piece || piece.type !== 'assassin' || state.ap < 2 || piece.freeMove || piece.freeAttack) return state;
      return {
        ...state,
        pieces: clonePieces(state, { [id]: { freeMove: true, freeAttack: true } }),
        ap: state.ap - 2,
        actionMode: null,
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'ASSASSIN_MOVE': {
      const id = state.selectedId;
      if (!id || state.actionMode !== 'assassinMove') return state;
      const piece = state.pieces[id];
      if (!piece.freeMove) return state;
      const from = pieceCell(state, id);
      if (!from || !getMoveCells(state, id).some((c) => c.r === action.r && c.c === action.c)) return state;
      const board = state.board.map((row) => row.slice());
      board[from.r][from.c] = null;
      board[action.r][action.c] = id;
      return {
        ...state,
        board,
        pieces: clonePieces(state, { [id]: { freeMove: false } }),
        actionMode: 'assassinAttack',
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'ASSASSIN_ATTACK': {
      const id = state.selectedId;
      if (!id || state.actionMode !== 'assassinAttack') return state;
      const piece = state.pieces[id];
      if (!piece.freeAttack) return state;
      if (!getAttackCells(state, id).some((c) => state.board[c.r][c.c] === action.targetId)) return state;
      const next = dealDamage(state, id, action.targetId, { counterImmune: true });
      return {
        ...next,
        pieces: clonePieces(next, { [id]: { freeAttack: false } }),
        actionMode: null,
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'CHOOSE_REVIVE': {
      const id = state.selectedId;
      if (!id || state.pieces[id].type !== 'priest') return state;
      const target = state.pieces[action.id];
      if (!target || target.owner !== state.currentPlayer || !target.dead || target.type === 'chairman') return state;
      if (!state.lastTurnDeaths.includes(action.id)) return state;
      return { ...state, pendingRevive: action.id, actionMode: 'revive', mageTargets: [] };
    }

    case 'PLACE_REVIVE': {
      const id = state.pendingRevive;
      if (!id || state.actionMode !== 'revive' || state.ap < 2) return state;
      if (!isPrepCell(state.currentPlayer, action.r) || state.board[action.r][action.c] !== null) return state;
      const piece = state.pieces[id];
      const board = state.board.map((row) => row.slice());
      board[action.r][action.c] = id;
      return {
        ...state,
        board,
        pieces: clonePieces(state, { [id]: { dead: false, hp: piece.maxHp } }),
        lastTurnDeaths: state.lastTurnDeaths.filter((x) => x !== id),
        ap: state.ap - 2,
        actionMode: null,
        pendingRevive: null,
        turnStarted: true,
        clockRunning: true,
      };
    }

    case 'CHOOSE_PROMOTION': {
      const id = state.pendingPromotion;
      if (!id || !PROMOTABLE.includes(action.pieceType)) return state;
      const def = PIECE_DEFS[action.pieceType];
      const next: GameState = {
        ...state,
        pieces: clonePieces(state, {
          [id]: {
            type: action.pieceType,
            maxHp: def.hp,
            hp: def.hp,
            atk: def.atk,
          },
        }),
        pendingPromotion: null,
      };
      return removeDead(next);
    }

    case 'END_TURN':
      if (state.phase !== 'play') return state;
      return endTurn(state);

    case 'TICK': {
      if (state.phase !== 'play' || !state.clockRunning || state.winner) return state;
      const time = Math.max(0, state.times[state.currentPlayer] - 1);
      const next: GameState = {
        ...state,
        times: { ...state.times, [state.currentPlayer]: time },
      };
      if (time === 0) return timeoutResult(next);
      return next;
    }

    case 'OBSERVE_TICK': {
      if (state.phase !== 'observe') return state;
      const remaining = Math.max(0, state.observationRemaining - 1);
      const next = { ...state, observationRemaining: remaining };
      if (remaining === 0) return startPlay(next);
      return next;
    }

    case 'RESIGN':
      return {
        ...state,
        winner: (1 - action.owner) as Owner,
        phase: 'finished',
        clockRunning: false,
        turnStarted: false,
      };

    case 'IMPORT_PRESET': {
      if (state.phase !== 'setup') return state;
      const counts = { ...SETUP_COUNTS };
      const seen = new Set<string>();
      for (const p of action.placements) {
        if (!isPrepCell(action.owner, p.r) || p.c < 0 || p.c > 7) return state;
        const key = `${p.r},${p.c}`;
        if (seen.has(key)) return state;
        seen.add(key);
        counts[p.type] -= 1;
      }
      if (Object.values(counts).some((n) => n !== 0)) return state;

      const pieces = { ...state.pieces };
      const board = state.board.map((row) => row.slice());
      for (const id of Object.keys(pieces)) {
        if (pieces[id].owner === action.owner) {
          delete pieces[id];
          for (let r = 0; r < board.length; r += 1) {
            for (let c = 0; c < board[r].length; c += 1) {
              if (board[r][c] === id) board[r][c] = null;
            }
          }
        }
      }

      for (const p of action.placements) {
        const piece = createPiece(action.owner, p.type);
        pieces[piece.id] = piece;
        board[p.r][p.c] = piece.id;
      }

      return {
        ...state,
        pieces,
        board,
        setupTray: {
          ...state.setupTray,
          [action.owner]: { novice: 0, warrior: 0, mage: 0, assassin: 0, priest: 0, chairman: 0 },
        },
        selectedSetupType: null,
      };
    }

    case 'RESTORE':
      return action.state;

    default:
      return state;
  }
}
