import { CANDIDATE_FEATURES, GLOBAL_FEATURES, OBSERVATION_SIZE, PIECE_FEATURES, RULES_VERSION } from './features';

export interface DenseWeights { weight: number[][]; bias: number[] }
export interface PolicyWeights {
  rulesVersion: string;
  observationSize: number;
  candidateFeatures: number;
  steps: number;
  layers: Record<'piece1' | 'piece2' | 'state1' | 'state2' | 'candidate' | 'actor' | 'value', DenseWeights>;
}

function dense(input: number[], layer: DenseWeights, activate = true): number[] {
  return layer.weight.map((row, i) => {
    let value = layer.bias[i];
    for (let j = 0; j < row.length; j++) value += row[j] * input[j];
    return activate ? Math.tanh(value) : value;
  });
}

/** Small exported PyTorch network. No framework dependency is needed for inference. */
export class FrozenPolicy {
  constructor(readonly weights: PolicyWeights) {
    if (weights.rulesVersion !== RULES_VERSION || weights.observationSize !== OBSERVATION_SIZE || weights.candidateFeatures !== CANDIDATE_FEATURES) {
      throw new Error('Incompatible PPO policy');
    }
    const shapes: Record<keyof PolicyWeights['layers'], [number, number]> = {
      piece1: [32, PIECE_FEATURES], piece2: [32, 32], state1: [64, GLOBAL_FEATURES + 128], state2: [32, 64],
      candidate: [32, CANDIDATE_FEATURES], actor: [1, CANDIDATE_FEATURES], value: [1, 32],
    };
    for (const [name, [out, input]] of Object.entries(shapes)) {
      const layer = weights.layers[name as keyof PolicyWeights['layers']];
      if (!layer || layer.bias.length !== out || layer.weight.length !== out ||
        !layer.weight.every((row) => row.length === input && row.every(Number.isFinite)) || !layer.bias.every(Number.isFinite)) {
        throw new Error('Invalid PPO layer: ' + name);
      }
    }
  }
  encode(observation: number[]): number[] {
    const l = this.weights.layers;
    const input = observation.slice(0, GLOBAL_FEATURES);
    for (let side = 0; side < 2; side++) {
      const mean = Array(32).fill(0), max = Array(32).fill(-Infinity);
      for (let slot = 0; slot < 16; slot++) {
        const start = GLOBAL_FEATURES + (side * 16 + slot) * PIECE_FEATURES;
        const hidden = dense(dense(observation.slice(start, start + PIECE_FEATURES), l.piece1), l.piece2);
        for (let j = 0; j < 32; j++) { mean[j] += hidden[j] / 16; max[j] = Math.max(max[j], hidden[j]); }
      }
      input.push(...mean, ...max);
    }
    return dense(dense(input, l.state1), l.state2);
  }
  scores(observation: number[], candidates: number[][]): number[] {
    const context = this.encode(observation), l = this.weights.layers;
    return candidates.map((f) => {
      const hidden = dense(f, l.candidate);
      let score = dense(f, l.actor, false)[0];
      for (let j = 0; j < 32; j++) score += hidden[j] * context[j] / Math.sqrt(32);
      return score;
    });
  }
  value(observation: number[]): number { return dense(this.encode(observation), this.weights.layers.value, false)[0]; }
}

export function sampleScores(scores: number[], random: () => number, temperature = 1): number {
  if (!scores.length) throw new Error('Cannot select from an empty action list');
  if (temperature === 0) return scores.reduce((best, score, i) => score > scores[best] ? i : best, 0);
  const max = Math.max(...scores);
  const probabilities = scores.map((s) => Math.exp((s - max) / temperature));
  let cutoff = random() * probabilities.reduce((a, b) => a + b, 0);
  for (let i = 0; i < probabilities.length; i++) { cutoff -= probabilities[i]; if (cutoff <= 0) return i; }
  return probabilities.length - 1;
}
