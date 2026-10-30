import { decisionActions, legalDecisions } from '../decisions';
import { encodeCandidates, encodeObservation } from '../rl/features';
import { FrozenPolicy, sampleScores } from '../rl/policy';
import type { GameState } from '../types';

let loading: Promise<FrozenPolicy> | null = null;
self.onmessage = async (event: MessageEvent<{ id: number; state: GameState; modelURL: string }>) => {
  const { id, state, modelURL } = event.data;
  try {
    if (!loading) loading = fetch(modelURL).then(async (response) => {
      if (!response.ok) throw new Error('PPO model could not be loaded');
      return new FrozenPolicy(await response.json());
    });
    const policy = await loading;
    const decisions = legalDecisions(state);
    if (!decisions.length) { self.postMessage({ id, actions: [] }); return; }
    const scores = policy.scores(encodeObservation(state), encodeCandidates(state, decisions));
    const choice = sampleScores(scores, Math.random, 0);
    self.postMessage({ id, actions: decisionActions(decisions[choice]) });
  } catch (error) {
    loading = null;
    self.postMessage({ id, error: String(error) });
  }
};
