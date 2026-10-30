import type { Action, GameState } from '../types';

let worker: Worker | null = null;
let sequence = 0;
const pending = new Map<number, { resolve: (actions: Action[]) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();

export function choosePpoActions(state: GameState): Promise<Action[]> {
  if (!worker) {
    worker = new Worker(new URL('./ppo.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<{ id: number; actions?: Action[]; error?: string }>) => {
      const request = pending.get(event.data.id);
      if (!request) return;
      clearTimeout(request.timer); pending.delete(event.data.id);
      if (event.data.error) request.reject(new Error(event.data.error));
      else request.resolve(event.data.actions ?? []);
    };
    worker.onerror = () => {
      for (const request of pending.values()) { clearTimeout(request.timer); request.reject(new Error('PPO worker failed')); }
      pending.clear(); worker?.terminate(); worker = null;
    };
  }
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('PPO inference timed out')); }, 10000);
    pending.set(id, { resolve, reject, timer });
    worker!.postMessage({ id, state, modelURL: new URL('models/ppo.json', document.baseURI).href });
  });
}
