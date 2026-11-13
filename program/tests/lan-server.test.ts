import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createLanRelay } from '../scripts/lan-server.mjs';

let closeRelay: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (closeRelay) {
    await closeRelay();
    closeRelay = null;
  }
});

function connect(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.on('open', () => resolve(socket));
    socket.on('error', reject);
  });
}

function nextMessage(socket: WebSocket): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    socket.once('message', (data) => resolve(JSON.parse(String(data)) as Record<string, unknown>));
  });
}

describe('lan relay', () => {
  it('pairs two clients and relays messages', async () => {
    const relay = await createLanRelay(0);
    closeRelay = relay.close;
    const url = `ws://127.0.0.1:${relay.port}`;

    const host = await connect(url);
    const guest = await connect(url);

    const createdPromise = nextMessage(host);
    host.send(JSON.stringify({ op: 'create' }));
    const created = await createdPromise;
    expect(created.op).toBe('created');
    const room = created.room as string;

    const joinedPromise = nextMessage(guest);
    guest.send(JSON.stringify({ op: 'join', room }));
    const joined = await joinedPromise;
    expect(joined.op).toBe('joined');
    const peerJoined = await nextMessage(host);
    expect(peerJoined).toEqual({ op: 'peer', status: 'joined' });

    const relayedPromise = nextMessage(guest);
    host.send(JSON.stringify({ op: 'relay', data: { kind: 'state', state: { x: 1 } } }));
    const relayed = await relayedPromise;
    expect(relayed).toEqual({ op: 'relay', data: { kind: 'state', state: { x: 1 } } });

    const peerLeftPromise = nextMessage(guest);
    host.close();
    const peerLeft = await peerLeftPromise;
    expect(peerLeft).toEqual({ op: 'peer', status: 'left' });

    guest.close();
  });
});
