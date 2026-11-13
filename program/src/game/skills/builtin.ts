import { getMageSkillCells, getWarriorSkillCells } from '../ranges';
import type { SkillDefinition } from '../types';

export const BUILTIN_SKILLS: SkillDefinition[] = [
  {
    id: 'warrior',
    name: 'skill.warrior.name',
    description: 'skill.warrior.desc',
    cost: 2,
    targetMode: 'single',
    getTargetCells: getWarriorSkillCells,
    canUse: (state, pieceId) => state.ap >= 2 && getWarriorSkillCells(state, pieceId).length > 0,
    getActions: (_state, pieceId, targetIds) =>
      targetIds[0]
        ? [{ type: 'dealDamage', attackerId: pieceId, targetId: targetIds[0], amount: 4, counterImmune: true }]
        : [],
  },
  {
    id: 'mage',
    name: 'skill.mage.name',
    description: 'skill.mage.desc',
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
    name: 'skill.assassin.name',
    description: 'skill.assassin.desc',
    cost: 2,
    targetMode: 'none',
    getTargetCells: () => [],
    canUse: (state) => state.ap >= 2,
    getActions: () => [],
  },
  {
    id: 'priest',
    name: 'skill.priest.name',
    description: 'skill.priest.desc',
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
    name: 'skill.promote.name',
    description: 'skill.promote.desc',
    cost: 0,
    targetMode: 'none',
    getTargetCells: () => [],
    canUse: () => false,
    getActions: () => [],
  },
];
