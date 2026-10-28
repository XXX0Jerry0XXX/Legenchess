# 命名规范

## 通用

- 使用 `camelCase` 命名变量、函数、状态字段和普通常量实例。
- 使用 `PascalCase` 命名类型、接口、React 组件和枚举式联合类型的成员。
- 使用 `UPPER_SNAKE_CASE` 命名导出常量，例如 `MOVE_COST`、`ROWS`。
- 布尔值优先使用 `is`、`has`、`can` 前缀，例如 `isPrepCell`、`hasChairmanAlive`。

## 文件与模块

- 文件使用 `kebab-case` 或简短小写名，例如 `reducer.ts`、`rules.ts`。
- 公共入口统一从 `game/index.ts` 导出，外部 mod 不应直接深路径导入。

## 类型与接口

- 领域模型使用 `PascalCase`：`GameState`、`Piece`、`PieceDef`、`SkillDefinition`。
- 联合类型使用有意义的字符串字面量，不用裸数字表达状态。
- 玩家身份 `Owner` 保持 `0 | 1`，但展示层通过 `playerLabel()` 转换，不在 UI 中写死 `0 === A`。

## 状态与 Action

- `GameState` 字段使用名词，例如 `ap`、`board`、`deadThisTurn`。
- 动作类型使用 `UPPER_SNAKE_CASE`：`SELECT_PIECE`、`CONFIRM_SKILL`、`END_TURN`。
- 新动作优先使用通用技能动作，避免为每个技能新增专用动作。

## 棋子与技能

- 棋子类型使用字符串 ID，例如 `novice`、`warrior`。
- 技能 ID 使用字符串 ID，例如 `warrior`、`mage`、`custom_heal`。
- 注册函数统一命名为 `registerPiece`、`registerSkill`，查询函数为 `getPiece`、`getSkill`。

## AI 与计时

- AI 相关常量使用 `AI_` 前缀，例如 `AI_STEP_DELAY_MS`。
- 时间相关常量带单位后缀，例如 `TICK_MS`、`PLAYER_TIME_SECONDS`。

## 公共 API

- 公共入口统一使用 `Legenchess` 命名空间，不直接深路径导入内部模块。
- 原子动作使用 `UPPER_SNAKE_CASE` 字符串类型，例如 `dealDamage`、`APPLY_GAME_ACTIONS`。
- 注册表函数保持 `register`、`get`、`list`、`reset` 前缀。
