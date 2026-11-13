# 传奇棋 Legenchess · 开发文档

本文档面向开发者，介绍项目结构、开发环境、构建打包、测试、Mod API 与 AI 训练。一般玩家请阅读 [README.md](./README.md)。

## 目录

- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [开发环境](#开发环境)
- [构建与打包](#构建与打包)
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
