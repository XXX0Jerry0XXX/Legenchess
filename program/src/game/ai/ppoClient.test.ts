import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialState } from '../reducer';

class MockWorker {
  static instances: MockWorker[] = [];
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  messages: any[] = [];
  terminated = false;
  constructor() { MockWorker.instances.push(this); }
  postMessage(message: unknown) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  reply(data: unknown) { this.onmessage?.({ data }); }
}
beforeEach(() => {
  vi.resetModules(); vi.useFakeTimers(); MockWorker.instances = [];
  vi.stubGlobal('Worker', MockWorker);
  vi.stubGlobal('document', { baseURI: 'https://example.test/Legenchess/' });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('PPO Worker 请求', () => {
  it('请求有唯一编号，模型路径支持子目录部署', async () => {
    const { choosePpoActions } = await import('./ppoClient');
    const result = choosePpoActions(createInitialState());
    const worker = MockWorker.instances[0], message = worker.messages[0];
    expect(message.modelURL).toBe('https://example.test/Legenchess/models/ppo.json');
    worker.reply({ id: message.id + 1, actions: [] });
    worker.reply({ id: message.id, actions: [{ type: 'END_TURN' }] });
    await expect(result).resolves.toEqual([{ type: 'END_TURN' }]);
  });
  it('Worker 失败时拒绝请求，下次可重新创建', async () => {
    const { choosePpoActions } = await import('./ppoClient');
    const result = choosePpoActions(createInitialState());
    const rejected = expect(result).rejects.toThrow('PPO worker failed');
    const worker = MockWorker.instances[0]; worker.onerror?.();
    await rejected;
    expect(worker.terminated).toBe(true);
    const next = choosePpoActions(createInitialState());
    const second = MockWorker.instances[1];
    second.reply({ id: second.messages[0].id, actions: [] });
    await expect(next).resolves.toEqual([]);
  });
  it('超时拒绝后忽略迟到的结果', async () => {
    const { choosePpoActions } = await import('./ppoClient');
    const result = choosePpoActions(createInitialState());
    const rejected = expect(result).rejects.toThrow('timed out');
    await vi.advanceTimersByTimeAsync(10000);
    await rejected;
    const worker = MockWorker.instances[0];
    worker.reply({ id: worker.messages[0].id, actions: [{ type: 'END_TURN' }] });
    expect(vi.getTimerCount()).toBe(0);
  });
});
