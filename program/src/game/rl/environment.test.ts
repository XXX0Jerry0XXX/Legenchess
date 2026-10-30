import { describe, expect, it } from 'vitest';
import { createTrainingState, seededRandom, TrainingEnvironment, type EnvironmentConfig } from './environment';
import { CANDIDATE_FEATURES, OBSERVATION_SIZE, encodeObservation } from './features';

const config = (seed: number): EnvironmentConfig => ({ seed, learner: 0, opponent: 'tactical', skirmishProbability: 0.5,
  secondsPerDecision: 10, maxDecisions: 1024, gamma: 0.995, shaping: 0.2 });

describe('无界面训练环境', () => {
  it('固定种子产生完全一致的棋子 ID 和合法完整开局', () => {
    const a = createTrainingState(1337), b = createTrainingState(1337);
    expect(a).toEqual(b);
    expect(a.board.flat().filter(Boolean)).toHaveLength(32);
    expect(a.board.slice(3, 9).flat().every((id) => !id)).toBe(true);
    expect(createTrainingState(1338).board).not.toEqual(a.board);
  });

  it.each(['tactical', 'random', 'beginner', 'expert'] as const)('相同决策回放一致，%s 对手不修改输入或输出非法状态', (opponent) => {
    const a = new TrainingEnvironment({ ...config(42), opponent });
    const b = new TrainingEnvironment({ ...config(42), opponent });
    const rng = seededRandom(900);
    for (let step = 0; step < 40 && a.state.phase === 'play'; step++) {
      const before = JSON.stringify(a.state);
      expect(a.observation).toHaveLength(OBSERVATION_SIZE);
      expect(a.features.every((f) => f.length === CANDIDATE_FEATURES && f.every(Number.isFinite))).toBe(true);
      const snapshot = a.state;
      const choice = Math.floor(rng() * a.decisions.length);
      expect(a.step(choice)).toEqual(b.step(choice));
      expect(a.state).toEqual(b.state);
      expect(JSON.stringify(snapshot)).toBe(before);
      const ids = a.state.board.flat().filter((id): id is string => !!id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(a.state.ap).toBeGreaterThanOrEqual(0);
      for (const p of Object.values(a.state.pieces)) {
        expect(ids.includes(p.id)).toBe(!p.dead);
      }
    }
  });

  it('虚拟耗时只扣行动方时钟，并依照剩余子数判定超时结果', () => {
    const env = new TrainingEnvironment({ ...config(5), skirmishProbability: 0, secondsPerDecision: 1500 });
    const result = env.step(env.decisions.findIndex((d) => d.kind === 'move'));
    expect(env.state.times).toEqual({ 0: 0, 1: 1500 });
    expect(result.terminated).toBe(true);
    expect(result.truncated).toBe(false);
    expect(env.state.winner).toBe('draw');
  });

  it('采样上限属于截断，返回学习方视角的非终局状态供 bootstrap', () => {
    const env = new TrainingEnvironment({ ...config(3), skirmishProbability: 0, maxDecisions: 1, secondsPerDecision: 0 });
    const result = env.step(env.decisions.findIndex((d) => d.kind === 'end'));
    expect(result.terminated).toBe(false);
    expect(result.truncated).toBe(true);
    expect(env.state.currentPlayer).toBe(env.config.learner);
    expect(env.state.winner).toBe(null);
    expect(env.observation).toEqual(encodeObservation(env.state, env.config.learner));
    expect(() => env.step(-1)).toThrow();
  });
});
