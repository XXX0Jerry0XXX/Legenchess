import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin, ViteDevServer } from 'vite';
import os from 'node:os';
import { attachLanRelay } from './scripts/lan-server.mjs';

function lanDevPlugin(): Plugin {
  return {
    name: 'legenchess-lan-dev',
    configureServer(server: ViteDevServer) {
      if (server.httpServer) {
        attachLanRelay(server.httpServer, '/lan');
      }
      server.middlewares.use('/lan/ips', (_req, res) => {
        const ips: string[] = [];
        for (const list of Object.values(os.networkInterfaces())) {
          for (const info of list ?? []) {
            if (info.family === 'IPv4' && !info.internal) ips.push(info.address);
          }
        }
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ips }));
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), lanDevPlugin()],
  test: {
    environment: 'node',
  },
});
