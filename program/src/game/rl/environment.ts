import { chooseBeginnerAiActions } from '../ai';
import { applyListedDecision, decisionActions, legalDecisions, type Decision } from '../decisions';
import { aliveCount, computeAp, emptyBoard } from '../engine';
import { chooseExpertAiActions } from '../expertAi';
import { createInitialState, reducer } from '../reducer';
import { randomSetupPlacements, shuffled } from '../setup';
import type { GameState, Owner } from '../types';
import { encodeCandidates, encodeObservation, potential, tacticalScores } from './features';
import { FrozenPolicy, sampleScores } from './policy';

export type OpponentKind = 'random' | 'beginner' | 'expert' | 'tactical' | 'snapshot' | 'mixed';
export interface EnvironmentConfig {
  seed: number;
  learner: Owner;
  opponent: OpponentKind;
  skirmishProbability: number;
  secondsPerDecision: number;
  maxDecisions: number;
  gamma: number;
  shaping: number;
}
export function seededRandom(seed: number): () => number {
  let x = seed >>> 0;
  return () => {
    x += 0x6D2B79F5;
    let t = Math.imul(x ^ (x >>> 15), 1 | x);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTrainingState(seed: number, skirmish = false): GameState {
  const random = seededRandom(seed);
  let state = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 0 });
  for (const owner of [0, 1] as const) {
    state = reducer(state, { type: 'IMPORT_PRESET', owner, placements: randomSetupPlacements(owner, random) });
    state = reducer(state, { type: 'NEXT_SETUP' });
  }
  state = reducer(state, { type: 'START_PLAY' });
  const ids = new Map<string, string>();
  let index = 0;
  const pieces: GameState['pieces'] = {};
  for (const p of Object.values(state.pieces)) {
    const id = `piece-${index++}`;
    ids.set(p.id, id); pieces[id] = { ...p, id };
  }
  state = { ...state, pieces, board: state.board.map((row) => row.map((id) => id ? ids.get(id)! : null)) };
  if (skirmish) {
    state.board = emptyBoard();
    for (const owner of [0, 1] as const) {
      const own = Object.values(pieces).filter((p) => p.owner === owner);
      const keep = new Set<string>();
      for (const type of ['chairman', 'warrior', 'novice']) keep.add(own.find((p) => p.type === type)!.id);
      const extras = shuffled(own.filter((p) => !keep.has(p.id)), random).slice(0, 1 + Math.floor(random() * 3));
      extras.forEach((p) => keep.add(p.id));
      const cells = shuffled(Array.from({ length: 24 }, (_, i) => ({ r: (owner === 0 ? 3 : 6) + Math.floor(i / 8), c: i % 8 })), random);
      let cell = 0;
      for (const p of own) {
        if (!keep.has(p.id)) { p.dead = true; p.hp = 0; }
        else { const c = cells[cell++]; state.board[c.r][c.c] = p.id; }
      }
    }
    state.ap = computeAp(state);
  }
  return state;
}

export class TrainingEnvironment {
  state: GameState;
  random: () => number;
  decisions: Decision[] = [];
  observation: number[] = [];
  features: number[][] = [];
  count = 0;
  skirmish = false;
  opponent: OpponentKind;
  snapshot: FrozenPolicy | null = null;
  baselineFallbacks = 0;
  constructor(readonly config: EnvironmentConfig, pool: FrozenPolicy[] = []) {
    this.random = seededRandom(config.seed ^ 0x5bd1e995);
    this.skirmish = this.random() < config.skirmishProbability;
    this.state = createTrainingState(config.seed, this.skirmish);
    const draw = this.random();
    this.opponent = config.opponent === 'mixed' ? (pool.length && draw < 0.25 ? 'snapshot' : draw < 0.75 ? 'tactical' : 'random') : config.opponent;
    if (this.opponent === 'snapshot') this.snapshot = pool[Math.floor(this.random() * pool.length)] ?? null;
    if (this.opponent === 'snapshot' && !this.snapshot) this.opponent = 'tactical';
    this.advanceOpponent();
    this.prepare();
  }
  prepare(): void {
    this.observation = encodeObservation(this.state, this.config.learner);
    this.decisions = legalDecisions(this.state);
    this.features = encodeCandidates(this.state, this.decisions);
  }
  private perform(d: Decision): void {
    const actor = this.state.currentPlayer;
    this.state = applyListedDecision(this.state, d);
    this.count++;
    if (this.state.winner !== null || !this.config.secondsPerDecision) return;
    const remaining = Math.max(0, this.state.times[actor] - this.config.secondsPerDecision);
    this.state = { ...this.state, times: { ...this.state.times, [actor]: remaining } };
    if (!remaining) {
      const a = aliveCount(this.state, 0), b = aliveCount(this.state, 1);
      this.state = { ...this.state, phase: 'finished', winner: a === b ? 'draw' : a > b ? 0 : 1, clockRunning: false, turnStarted: false };
    }
  }
  private advanceOpponent(): void {
    let guard = 0;
    while (this.state.phase === 'play' && this.state.currentPlayer !== this.config.learner) {
      if (++guard > 128) throw new Error('Opponent exceeded a bounded turn');
      const decisions = legalDecisions(this.state);
      let choice: number;
      if (this.opponent === 'random') choice = Math.floor(this.random() * decisions.length);
      else if (this.opponent === 'snapshot' && this.snapshot) {
        choice = sampleScores(this.snapshot.scores(encodeObservation(this.state), encodeCandidates(this.state, decisions)), this.random);
      } else if (this.opponent === 'beginner' || this.opponent === 'expert') {
        const view = { ...this.state, mode: 'ai' as const, aiPlayer: this.state.currentPlayer };
        const actions = this.opponent === 'expert' ? chooseExpertAiActions(view, reducer, this.random) : chooseBeginnerAiActions(view, this.random);
        const key = JSON.stringify(actions);
        choice = decisions.findIndex((d) => JSON.stringify(decisionActions(d)) === key);
        if (choice < 0) { this.baselineFallbacks++; choice = decisions.findIndex((d) => d.kind === 'end' || d.kind === 'promote'); }
      } else {
        const scores = tacticalScores(encodeCandidates(this.state, decisions));
        choice = this.random() < 0.05 ? Math.floor(this.random() * decisions.length) : sampleScores(scores, this.random, 0.15);
      }
      if (choice < 0) throw new Error('No legal opponent continuation');
      this.perform(decisions[choice]);
    }
  }
  step(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.decisions.length) throw new Error('Illegal candidate index');
    const before = potential(this.state, this.config.learner);
    this.perform(this.decisions[index]);
    this.advanceOpponent();
    const terminated = this.state.phase === 'finished';
    const truncated = !terminated && this.count >= this.config.maxDecisions;
    const outcome = !terminated || this.state.winner === 'draw' ? 0 : this.state.winner === this.config.learner ? 1 : -1;
    const phi = terminated ? 0 : potential(this.state, this.config.learner);
    const reward = outcome + this.config.shaping * (this.config.gamma * phi - before);
    this.prepare();
    return { reward, terminated, truncated, info: { seed: this.config.seed, learner: this.config.learner, opponent: this.opponent,
      scenario: this.skirmish ? 'skirmish' : 'full', decisions: this.count, winner: this.state.winner, outcome,
      timeout: terminated && (this.state.times[0] === 0 || this.state.times[1] === 0), baselineFallbacks: this.baselineFallbacks,
      pieces: [aliveCount(this.state, 0), aliveCount(this.state, 1)] } };
  }
}
