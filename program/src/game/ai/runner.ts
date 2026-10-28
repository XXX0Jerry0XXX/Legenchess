import { chooseBeginnerAiActions } from '../ai';
import { chooseExpertAiActions } from '../expertAi';
import type { Action } from '../types';
import type { GameState } from '../types';

export function chooseAiActions(
  state: GameState,
  apply: (s: GameState, a: Action) => GameState,
): Action[] {
  if (state.aiLevel === 'expert') return chooseExpertAiActions(state, apply);
  return [{ type: 'AI_STEP' }];
}

export { chooseBeginnerAiActions, chooseExpertAiActions };
