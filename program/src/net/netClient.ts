import type { Action, GameState } from '../game/types';

export type LanStatus = 'idle' | 'connecting' | 'waiting' | 'ready' | 'disconnected' | 'error';

export type ServerOp =
  | { op: 'created'; room: string }
  | { op: 'joined'; room: string }
  | { op: 'peer'; status: 'joined' | 'left' }
  | { op: 'error'; message: string };

export type AppMessage =
  | { kind: 'state'; state: GameState }
  | { kind: 'action'; action: Action };

function normalizeUrl(address: string): string {
  const trimmed = address.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const hasPort = /:\d+$/.test(trimmed);
  return `ws://${trimmed}${hasPort ? '' : ':8088'}`;
}

export class LanClient {
  private socket: WebSocket | null = null;

  onStatus: (status: LanStatus) => void = () => {};
  onOp: (op: ServerOp) => void = () => {};
  onMessage: (message: AppMessage) => void = () => {};

  get connected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  create(): void {
    this.open(undefined, undefined);
  }

  join(address: string, room: string): void {
    this.open(address, room);
  }

  private open(address?: string, room?: string): void {
    this.close();
    const host = address?.trim() || (typeof location !== 'undefined' ? location.hostname : '127.0.0.1');
    const ws = new WebSocket(normalizeUrl(host));
    this.socket = ws;
    this.onStatus('connecting');
    ws.onopen = () => {
      ws.send(JSON.stringify(room ? { op: 'join', room: room.trim().toUpperCase() } : { op: 'create' }));
      this.onStatus('waiting');
    };
    ws.onmessage = (event) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(event.data));
      } catch {
        return;
      }
      const message = parsed as { op?: string; kind?: string } & Record<string, unknown>;
      if (message.op) this.onOp(message as unknown as ServerOp);
      else if (message.kind) this.onMessage(message as unknown as AppMessage);
    };
    ws.onerror = () => this.onStatus('error');
    ws.onclose = () => this.onStatus('disconnected');
  }

  send(message: AppMessage): void {
    if (this.connected) this.socket!.send(JSON.stringify({ op: 'relay', data: message }));
  }

  close(): void {
    const ws = this.socket;
    this.socket = null;
    if (ws) {
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      try {
        ws.close();
      } catch {
        // 连接可能已经关闭。
      }
    }
    this.onStatus('idle');
  }
}
