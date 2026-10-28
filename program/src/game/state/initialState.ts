import {
  OBSERVE_TIME,
  PLAYER_TIME,
  SETUP_COUNTS,
} from '../constants';
import { emptyBoard } from '../engine';
import type { GameState } from '../types';

export function createInitialState(): GameState {
  const tray = {
    0: { ...SETUP_COUNTS },
    1: { ...SETUP_COUNTS },
  } as GameState['setupTray'];

  return {
    phase: 'start',
    mode: 'local',
    aiPlayer: null,
    aiLevel: 'beginner',
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
    skillTargets: [],
    lastTurnDeaths: [],
    previousTurnDeaths: [],
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
