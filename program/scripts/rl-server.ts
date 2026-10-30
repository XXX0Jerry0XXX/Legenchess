import { createInterface } from 'node:readline';
import { TrainingEnvironment, type EnvironmentConfig } from '../src/game/rl/environment';
import { CANDIDATE_FEATURES, FEATURE_SCALE, OBSERVATION_SIZE, RULES_VERSION } from '../src/game/rl/features';
import { FrozenPolicy } from '../src/game/rl/policy';

let envs: (TrainingEnvironment | null)[] = [];
let pool: FrozenPolicy[] = [];
let config: any = {};
let episodes: number[] = [];
function encode(values: number[]): string {
  const array = Int16Array.from(values, (v) => Math.round(v * FEATURE_SCALE));
  return Buffer.from(array.buffer).toString('base64');
}
function packed(env: TrainingEnvironment | null) {
  return !env ? null : { obs: encode(env.observation), candidates: encode(env.features.flat()), count: env.decisions.length };
}
function reset(index: number): TrainingEnvironment {
  const paired = config.paired !== false;
  const envConfig: EnvironmentConfig = {
    seed: config.seed + (paired ? Math.floor(index / 2) + episodes[index] * Math.ceil(envs.length / 2) : index + episodes[index] * envs.length),
    learner: index % 2 as 0 | 1, opponent: config.opponent ?? 'mixed', skirmishProbability: config.skirmishProbability ?? 0,
    secondsPerDecision: config.secondsPerDecision ?? 10, maxDecisions: config.maxDecisions ?? 1024, gamma: config.gamma ?? 0.995, shaping: config.shaping ?? 0.2,
  };
  episodes[index]++;
  return new TrainingEnvironment(envConfig, pool);
}
function handle(request: any): any {
  if (request.command === 'init') {
    config = request; episodes = Array(request.numEnvs).fill(0); envs = Array(request.numEnvs).fill(null);
    envs = envs.map((_, i) => reset(i));
    return { rulesVersion: RULES_VERSION, observationSize: OBSERVATION_SIZE, candidateFeatures: CANDIDATE_FEATURES, observations: envs.map(packed) };
  }
  if (request.command === 'configure') { Object.assign(config, request); return { ok: true }; }
  if (request.command === 'opponent') {
    pool.push(new FrozenPolicy(request.policy)); pool = pool.slice(-4); return { pool: pool.length };
  }
  if (request.command === 'scores') {
    const policy = new FrozenPolicy(request.policy);
    return envs.map((env) => env ? { scores: policy.scores(env.observation, env.features), value: policy.value(env.observation) } : null);
  }
  if (request.command === 'step') {
    if (request.actions?.length !== envs.length) throw new Error('Wrong action batch size');
    const results = envs.map((env, i) => {
      if (!env) return null;
      const result = env.step(request.actions[i]);
      const finalObservation = result.truncated ? encode(env.observation) : null;
      if (result.terminated || result.truncated) envs[i] = config.autoReset === false ? null : reset(i);
      return { ...result, finalObservation };
    });
    return { observations: envs.map(packed), results };
  }
  throw new Error('Unknown RL command');
}
const reader = createInterface({ input: process.stdin, crlfDelay: Infinity });
for await (const line of reader) {
  try { process.stdout.write(JSON.stringify(handle(JSON.parse(line))) + '\n'); }
  catch (error) { process.stdout.write(JSON.stringify({ error: String(error), stack: (error as Error).stack }) + '\n'); }
}
