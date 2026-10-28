import type { Action, GameState } from '../types';

export function handleSelection(state: GameState, action: Extract<Action, { type: 'SELECT_PIECE' | 'SET_MODE' }>): GameState {
  switch (action.type) {
    case 'SELECT_PIECE': {
      if (state.phase !== 'play') return state;
      if (action.id && state.pieces[action.id]?.owner !== state.currentPlayer) return state;
      if (action.id && state.pieces[action.id].dead) return state;
      return { ...state, selectedId: action.id, actionMode: null, mageTargets: [], skillTargets: [] };
    }
    case 'SET_MODE':
      return {
        ...state,
        actionMode: action.mode,
        mageTargets: action.mode === 'mage' ? state.mageTargets : [],
        skillTargets: action.mode === 'skill' ? state.skillTargets : [],
      };
    default:
      return state;
  }
}
