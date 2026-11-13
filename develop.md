# 传奇棋 Legenchess · 开发文档

本文档面向开发者，介绍项目结构、开发环境、构建打包、测试、Mod API 与 AI 训练。一般玩家请阅读 [README.md](./README.md)。

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发环境](#开发环境)
- [构建与打包](#构建与打包)
- [局域网联机](#局域网联机)
- [测试](#测试)
- [Mod API](#mod-api)
- [API 文档](#api-文档)
- [强化学习人机方案](#强化学习人机方案)
- [CI/CD](#cicd)
- [规则历史](#规则历史)

## 技术栈

基于 React + Vite + TypeScript 的网页游戏，支持自定义 Mod API 与自动生成的 API 文档。游戏规则逻辑在 `program/src/game`，界面在 `program/src/components`，网络层在 `program/src/net`。

## 项目结构

```text
program/
  package.json
  vite.config.ts
  tsconfig.json
  scripts/
    lan-server.mjs
    server.mjs
    rl-server.ts
  src/
    App.tsx
    main.tsx
    i18n.ts
    game/
    net/
    state/
    components/
    styles/
installer/
  setup.iss
  launcher.vbs
.github/workflows/
  ci.yml
  deploy.yml
  release.yml
start.bat
```

## 开发环境

- Node.js 22，npm。
- 安装依赖：`cd program && npm install`。
- 启动开发服务器：`npm run dev`，打开终端显示的地址（通常 `http://localhost:5173`），已集成局域网中继。

## 构建与打包

- 前端构建：`npm run build`，输出 `program/dist`。
- 服务打包：`npm run build:server`，把 `scripts/server.mjs` 与 `ws` 打成单文件 `release/server.cjs`。
- 桌面安装包：`installer/setup.iss`（Inno Setup）+ `installer/launcher.vbs`；CI 在 Windows runner 下载便携 Node、打包 `release/` 并编译 `setup.exe`。
- 本地一键启动：`start.bat`（自动装依赖、后台启动、打开浏览器）。

## 局域网联机

局域网联机采用「主机权威 + WebSocket 中继」架构。

### 架构

- 主机持有唯一正确状态并本地运行 reducer；客机只渲染并把输入回传主机。
- 主机每次状态变化后向客机广播完整 `GameState`；客机收到后 `RESTORE` 对齐。
- 客机把 UI 意图以 `{kind:'action'}` 转发给主机，由主机用 reducer 应用；客机不运行计时 / 观察 / 自动布阵 / AI 等驱动 effect。
- 主机恒为 0 号先手，客机为 1 号后手；`GameProvider` 的 dispatch 封装用 `canAct` 门控，避免替对方行动。

### 中继协议

`program/scripts/lan-server.mjs` 导出 `attachLanRelay(server, path)`（挂到已有 HTTP 服务）与 `createLanRelay(port, host)`（独立监听，供测试与独立运行）。

- 客户端 op：`create`、`join`、`relay`、`leave`。
- 服务端回包：`created`、`joined`、`peer`（`joined` / `left`）、`error`（`code` + `message`）。
- 房间为 4 位码（`A-Z0-9`，去掉易混淆字符），`Map<room, socket[]>` 最多配对两人，`relay` 原样转发给对端。
- 错误码：`bad_message`、`room_not_found`、`unknown_op`。

### 应用层消息

- `{kind:'state', state}`：主机 → 客机，完整 `GameState`。
- `{kind:'action', action}`：客机 → 主机，单个 `Action`。

### 前端网络层

- `src/net/netClient.ts`：浏览器 `WebSocket` 封装，`create()` / `join(address, room)`，连接 `ws://<host>/lan`。
- `src/net/LanContext.tsx`：连接状态、角色、房间码、错误与 `createRoom` / `joinRoom` / `leave` / `send`。
- `src/net/perspective.ts`：`localOwnerOf`（角色 → 玩家编号）、`maskState`（布阵阶段隐藏对手棋子）、`canAct`（是否轮到本地玩家）。

### 开发与生产接入

- 开发：`vite.config.ts` 插件在 Vite dev server 上挂 `/lan` 中继，并提供 `/lan/ips` 返回本机局域网 IPv4。
- 生产：`scripts/server.mjs` 提供静态站点 + `/lan` 中继 + `/lan/ips`，启动后自动打开浏览器，默认端口 `16250`。

## 测试

```bash
cd program
npm test
```

## Mod API

外部代码从 `src/game/index.ts` 导入类型和函数：

```ts
import {
  registerPiece,
  registerSkill,
  createInitialState,
  reducer,
} from './program/src/game/index';

registerPiece({
  type: 'custom_knight',
  name: '自定义骑士',
  short: '骑',
  atk: 2,
  hp: 3,
  move: 'rect2',
  attack: 'rect1',
  skill: 'custom_slash',
});
```

自定义技能需要实现 `SkillDefinition`，可提供目标范围、使用条件和 `apply` 状态变换。

## API 文档

```bash
cd program
npm run docs
```

TypeDoc 会从 `src/game/index.ts` 自动生成 HTML 文档到 `program/docs/api-html`。命名规范见 `program/docs/naming.md`。

## 强化学习人机方案

已实现基于原规则的无界面环境、合法候选动作 PPO、历史快照对手池及网页 Worker 推理。训练、续训与独立评测命令见 `training/README.md`，设计和后续方向见 `program/docs/rl-ai-plan.md`，本轮结果见 `training/RESULTS.md`。

## CI/CD

- `.github/workflows/ci.yml`：安装依赖、构建、测试，并校验 API 文档是否同步。
- `.github/workflows/deploy.yml`：push 到 `main` 时构建并部署到 GitHub Pages。
- `.github/workflows/release.yml`：推送 `v*` 标签时构建 Windows 安装包并发布到 Releases。

## 规则历史

- `现行规则.md`：现行完整规则，包含范围定义、后手补偿、计时、转职和复活。
- `初版规则.md`：已弃用的原始版本，仅供历史参考。
