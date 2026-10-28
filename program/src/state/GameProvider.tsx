import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { createInitialState, reducer, type Action } from '../game/reducer';
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
    if (state.phase !== 'play' || !state.clockRunning || state.winner) return;
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase, state.clockRunning, state.winner]);

  useEffect(() => {
    if (state.phase !== 'observe') return;
    const timer = window.setInterval(() => dispatch({ type: 'OBSERVE_TICK' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.phase]);

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
