import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { AI_STEP_DELAY_MS, AUTO_SETUP_DELAY_MS, TICK_MS } from '../game/constants';
import { createInitialState, reducer } from '../game/reducer';
import type { Action } from '../game/types';
import { chooseAiActions } from '../game/ai/runner';
import { choosePpoActions } from '../game/ai/ppoClient';
import type { GameState } from '../game/types';
import { hasSave, loadGame, saveGame } from './storage';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  canResume: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const canResume = hasSave();

  useEffect(() => {
    if (state.phase !== 'start' && state.phase !== 'finished') {
      saveGame(state);
    }
  }, [state]);

  useEffect(() => {
    if (state.phase !== 'play' || !state.clockRunning || state.winner !== null) return;
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), TICK_MS);
    return () => window.clearInterval(timer);
  }, [state.phase, state.clockRunning, state.winner]);

  useEffect(() => {
    if (state.phase !== 'observe') return;
    const timer = window.setInterval(() => dispatch({ type: 'OBSERVE_TICK' }), TICK_MS);
    return () => window.clearInterval(timer);
  }, [state.phase]);

  useEffect(() => {
    if (state.phase === 'setup' && state.mode === 'ai' && state.setupOwner === state.aiPlayer) {
      const timer = window.setTimeout(() => dispatch({ type: 'AUTO_SETUP' }), AUTO_SETUP_DELAY_MS);
      return () => window.clearTimeout(timer);
    }
  }, [state.phase, state.mode, state.setupOwner, state.aiPlayer]);

  useEffect(() => {
    if (
      state.phase === 'play' &&
      state.mode === 'ai' &&
      state.currentPlayer === state.aiPlayer &&
      state.winner === null
    ) {
      let cancelled = false;
      const timer = window.setTimeout(() => {
        if (state.aiLevel === 'ppo') {
          choosePpoActions(state).then((actions) => {
            if (!cancelled) dispatch({ type: 'APPLY_ACTIONS', actions });
          }).catch(() => {
            if (!cancelled) dispatch({ type: 'AI_STEP' });
          });
          return;
        }
        const actions = chooseAiActions(state, reducer);
        dispatch({ type: 'APPLY_ACTIONS', actions });
      }, AI_STEP_DELAY_MS);
      return () => { cancelled = true; window.clearTimeout(timer); };
    }
  // A clock tick leaves the position legal and must not cancel model loading.
  }, [state.phase, state.mode, state.currentPlayer, state.aiPlayer, state.aiLevel, state.board,
    state.pieces, state.ap, state.turn, state.pendingPromotion, state.lastTurnDeaths,
    state.previousTurnDeaths, state.deadThisTurn]);

  return <GameContext.Provider value={{ state, dispatch, canResume }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

export function resumeGame(): GameState | null {
  return loadGame();
}
