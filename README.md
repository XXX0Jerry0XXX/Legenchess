# 传奇棋 Legenchess

传奇棋是一款原创对称双人棋类游戏。双方先隐藏布阵，再在 `8 x 10` 棋盘上轮流消耗行动点（AP）移动、攻击和释放技能，最终消灭对方全部棋子，或通过计时、投降决定胜负。

本项目包含完整规则文档和一个基于 React + Vite + TypeScript 的本地双人热座网页游戏。

## 目录

- [规则文档](#规则文档)
- [快速开始](#快速开始)
- [操作说明](#操作说明)
- [项目结构](#项目结构)
- [存档与布阵预设](#存档与布阵预设)
- [测试](#测试)

## 规则文档

- [规则.md](./规则.md)：原始规则。
- [规则_v2.md](./规则_v2.md)：最新完整规则，包含范围定义、后手补偿、计时、转职和复活等补充说明。

## 快速开始

游戏代码位于 `program/`。

```bash
cd program
npm install
npm run dev
```

打开终端中显示的地址，通常为 `http://localhost:5173`。

生产构建：

```bash
cd program
npm run build
```

## 操作说明

1. 在开始页选择先手方，或继续上一局。
2. 双方轮流在己方备战区摆放 16 枚棋子，每格最多 1 枚。
3. 布阵完成后进入 2 分钟观察阶段，先手方可在计时结束前开始第一回合。
4. 每回合获得 AP，会长存活时额外获得 4 AP，后手第一回合额外获得 1 AP。
5. 点击己方棋子选择，再选择移动、攻击或技能；同一操作模式会保留到玩家切换。
6. 回合结束切换玩家，双方各有 25 分钟独立计时。

## 项目结构

```text
program/
  index.html
  package.json
  vite.config.ts
  tsconfig.json
  src/
    App.tsx
    main.tsx
    game/
      constants.ts
      engine.ts
      ranges.ts
      reducer.ts
      types.ts
    state/
      GameProvider.tsx
      storage.ts
    components/
      Board.tsx
      ControlPanel.tsx
      Piece.tsx
      SetupScreen.tsx
      StartScreen.tsx
      SidePanel.tsx
      PresetManager.tsx
      Modal.tsx
    styles/
      global.css
```

## 存档与布阵预设

- 对局状态会自动保存到浏览器 `localStorage`，刷新后可继续。
- 布阵阶段可导出当前布局为 JSON 文件，也可导入之前导出的 JSON 预设。

## 测试

```bash
cd program
npm test
```

当前测试覆盖范围裁剪、十字/环形定义和后手 AP 补偿。
