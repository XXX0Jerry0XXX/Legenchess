import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import WebSocket, { WebSocketServer } from 'ws';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode() {
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export function attachLanRelay(server, path) {
  const rooms = new Map();
  const wss = new WebSocketServer({ noServer: true });

  const send = (socket, payload) => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  };

  const closeRoom = (socket) => {
    const room = socket.room;
    if (!room) return;
    const pair = rooms.get(room);
    rooms.delete(room);
    if (pair) {
      const peer = pair.find((item) => item !== socket);
      if (peer) {
        peer.room = null;
        send(peer, { op: 'peer', status: 'left' });
      }
    }
    socket.room = null;
  };

  wss.on('connection', (socket) => {
    socket.room = null;
    socket.on('message', (raw) => {
      let message;
      try {
        message = JSON.parse(String(raw));
      } catch {
        send(socket, { op: 'error', message: '消息格式无效' });
        return;
      }
      switch (message.op) {
        case 'create': {
          if (socket.room) return;
          let room = generateCode();
          while (rooms.has(room)) room = generateCode();
          rooms.set(room, [socket]);
          socket.room = room;
          send(socket, { op: 'created', room });
          break;
        }
        case 'join': {
          if (socket.room) return;
          const room = String(message.room ?? '').toUpperCase();
          const pair = rooms.get(room);
          if (!pair || pair.length >= 2) {
            send(socket, { op: 'error', message: '房间不存在或已满' });
            return;
          }
          pair.push(socket);
          socket.room = room;
          send(socket, { op: 'joined', room });
          send(pair[0], { op: 'peer', status: 'joined' });
          break;
        }
        case 'relay': {
          if (!socket.room) return;
          const pair = rooms.get(socket.room);
          const peer = pair?.find((item) => item !== socket);
          if (peer) send(peer, { op: 'relay', data: message.data });
          break;
        }
        case 'leave':
          closeRoom(socket);
          break;
        default:
          send(socket, { op: 'error', message: '未知操作' });
      }
    });
    socket.on('close', () => closeRoom(socket));
    socket.on('error', () => {});
  });

  server.on('upgrade', (req, socket, head) => {
    if (path) {
      const pathname = new URL(req.url ?? '', 'http://localhost').pathname;
      if (pathname !== path) return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  return wss;
}

export function createLanRelay(port = 8088, host = '0.0.0.0') {
  const server = createServer();
  const wss = attachLanRelay(server);

  return new Promise((resolve) => {
    server.listen(port, host, () => {
      const address = server.address();
      const boundPort = typeof address === 'object' && address ? address.port : port;
      resolve({
        port: boundPort,
        close: () => new Promise((done) => {
          for (const socket of wss.clients) socket.terminate();
          wss.close(() => server.close(() => done()));
        }),
      });
    });
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.LAN_PORT ?? 8088);
  createLanRelay(port)
    .then(({ port: boundPort }) => {
      console.log(`Legenchess LAN relay listening on 0.0.0.0:${boundPort}`);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
