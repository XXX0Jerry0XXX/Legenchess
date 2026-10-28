/**
 * 传奇棋 Mod 公共 API。
 * 外部代码应从该入口导入 Legenchess 和公开类型。
 */
export { Legenchess } from './api';
export { createInitialState, reducer } from './reducer';
export type { Action } from './reducer';
export type {
  ActionMode,
  AiLevel,
  AttackKind,
  Cell,
  GameAction,
  GameMode,
  GameState,
  MoveKind,
  Owner,
  Phase,
  Piece,
  PieceDef,
  PieceType,
  SkillDefinition,
  SkillId,
  SkillKind,
  Winner,
} from './types';
