import { createContext, useCallback, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import { AI_STEP_DELAY_MS, AUTO_SETUP_DELAY_MS, TICK_MS } from '../game/constants';
import { createInitialState, reducer } from '../game/reducer';
import type { Action } from '../game/types';
import { chooseAiActions } from '../game/ai/runner';
import { choosePpoActions } from '../game/ai/ppoClient';
import type { GameState } from '../game/types';
import { hasSave, loadGame, saveGame } from './storage';
import { useLan } from '../net/LanContext';
import { canAct, localOwnerOf, maskState } from '../net/perspective';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  canResume: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const lan = useLan();
  const canResume = hasSave();

  const role = lan.role;
  const localOwner = localOwnerOf(role);
  const isHost = role === 'host';
  const isGuest = role === 'guest';
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    lan.client.onMessage = (message) => {
      if (message.kind === 'state' && isGuest) {
        dispatch({ type: 'RESTORE', state: message.state });
      } else if (message.kind === 'action' && isHost) {
        dispatch(message.action);
      }
    };
  }, [lan.client, isGuest, isHost]);

  useEffect(() => {
    if (isHost && lan.status === 'ready') {
      lan.client.send({ kind: 'state', state });
    }
  }, [isHost, lan.status, state, lan.client]);

  useEffect(() => {
    if (role && lan.status === 'disconnected' && state.phase !== 'start') {
      lan.leave();
      dispatch({ type: 'RESTORE', state: createInitialState() });
    }
  }, [role, lan.status, state.phase, lan]);

  const dispatchOut = useCallback((action: Action) => {
    if (role) {
      if (action.type === 'RESTORE') {
        dispatch(action);
        return;
      }
      if (action.type === 'START_SETUP') {
        if (isHost) dispatch(action);
        return;
      }
      if (!canAct(stateRef.current, localOwner)) return;
      if (isGuest) {
        lan.client.send({ kind: 'action', action });
      } else {
        dispatch(action);
      }
      return;
    }
    dispatch(action);
  }, [role, isGuest, isHost, localOwner, lan.client]);

  useEffect(() => {
    if (state.phase !== 'start' && state.phase !== 'finished' && state.mode !== 'lan') {
      saveGame(state);
    }
  }, [state]);

  useEffect(() => {
    if (isGuest) return;
    if (state.phase !== 'play' || !state.clockRunning || state.winner !== null) return;
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), TICK_MS);
    return () => window.clearInterval(timer);
  }, [isGuest, state.phase, state.clockRunning, state.winner]);

  useEffect(() => {
    if (isGuest) return;
    if (state.phase !== 'observe') return;
    const timer = window.setInterval(() => dispatch({ type: 'OBSERVE_TICK' }), TICK_MS);
    return () => window.clearInterval(timer);
  }, [isGuest, state.phase]);

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

  const viewState = maskState(state, localOwner);

  return <GameContext.Provider value={{ state: viewState, dispatch: dispatchOut, canResume }}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

export function resumeGame(): GameState | null {
  return loadGame();
}
