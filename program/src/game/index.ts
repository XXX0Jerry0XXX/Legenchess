/**
 * 传奇棋 Mod 公共 API。
 * 外部代码应从该入口导入类型、常量和游戏规则函数。
 */
export * from './types';
export * from './constants';
export * from './engine';
export * from './ranges';
export * from './rules';
export * from './registry';
export { createInitialState, reducer } from './reducer';
export type { Action } from './reducer';
