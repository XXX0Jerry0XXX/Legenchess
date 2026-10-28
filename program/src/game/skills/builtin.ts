import { getMageSkillCells, getWarriorSkillCells } from '../ranges';
import type { SkillDefinition } from '../types';

export const BUILTIN_SKILLS: SkillDefinition[] = [
  {
    id: 'warrior',
    name: '战士技能',
    description: '对 5×5 矩形内一个敌人造成 2 点伤害。',
    cost: 2,
    targetMode: 'single',
    getTargetCells: getWarriorSkillCells,
    canUse: (state, pieceId) => state.ap >= 2 && getWarriorSkillCells(state, pieceId).length > 0,
    getActions: (_state, pieceId, targetIds) =>
      targetIds[0]
        ? [{ type: 'dealDamage', attackerId: pieceId, targetId: targetIds[0], amount: 2, counterImmune: true }]
        : [],
  },
  {
    id: 'mage',
    name: '法师技能',
    description: '对 5×5 环形上 1~3 个不同敌人各造成 2 点伤害。',
    cost: 2,
    targetMode: 'multi',
    maxTargets: 3,
    getTargetCells: getMageSkillCells,
    canUse: (state, pieceId) => state.ap >= 2 && getMageSkillCells(state, pieceId).length > 0,
    getActions: (_state, pieceId, targetIds) =>
      targetIds.map((targetId) => ({
        type: 'dealDamage',
        attackerId: pieceId,
        targetId,
        amount: 2,
        counterImmune: true,
      })),
  },
  {
    id: 'assassin',
    name: '刺客技能',
    description: '消耗 2 AP，获得一次免费移动和一次不反击的免费攻击。',
    cost: 2,
    targetMode: 'none',
    getTargetCells: () => [],
    canUse: (state) => state.ap >= 2,
    getActions: () => [],
  },
  {
    id: 'priest',
    name: '牧师技能',
    description: '复活最近回合内阵亡的己方棋子到备战区空位。',
    cost: 2,
    targetMode: 'none',
    getTargetCells: () => [],
    canUse: (state) =>
      state.ap >= 2 &&
      [...state.lastTurnDeaths, ...state.previousTurnDeaths].some(
        (id) => state.pieces[id]?.owner === state.currentPlayer && state.pieces[id]?.dead,
      ),
    getActions: () => [],
  },
  {
    id: 'promote',
    name: '新手转职',
    description: '击杀敌人后自动转职。',
    cost: 0,
    targetMode: 'none',
    getTargetCells: () => [],
    canUse: () => false,
    getActions: () => [],
  },
];
