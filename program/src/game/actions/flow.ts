import { aliveCount, computeAp, opponent } from '../engine';
import { endTurn as finishTurn } from '../rules';
import type { Action, GameState } from '../types';

function startPlay(state: GameState): GameState {
  const next: GameState = {
    ...state,
    phase: 'play',
    currentPlayer: state.firstPlayer,
    turn: 1,
    selectedId: null,
    actionMode: null,
    mageTargets: [],
    skillTargets: [],
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

export function handleFlow(state: GameState, action: Extract<Action, { type: 'START_PLAY' | 'END_TURN' | 'TICK' | 'OBSERVE_TICK' | 'RESIGN' | 'RESTORE' }>): GameState {
  switch (action.type) {
    case 'START_PLAY':
      return startPlay(state);
    case 'END_TURN':
      return state.phase === 'play' ? finishTurn(state) : state;
    case 'TICK': {
      if (state.phase !== 'play' || !state.clockRunning || state.winner) return state;
      const time = Math.max(0, state.times[state.currentPlayer] - 1);
      const next = { ...state, times: { ...state.times, [state.currentPlayer]: time } };
      return time === 0 ? timeoutResult(next) : next;
    }
    case 'OBSERVE_TICK': {
      if (state.phase !== 'observe') return state;
      const remaining = Math.max(0, state.observationRemaining - 1);
      const next = { ...state, observationRemaining: remaining };
      return remaining === 0 ? startPlay(next) : next;
    }
    case 'RESIGN':
      return {
        ...state,
        winner: opponent(action.owner),
        phase: 'finished',
        clockRunning: false,
        turnStarted: false,
      };
    case 'RESTORE':
      return action.state;
    default:
      return state;
  }
}
