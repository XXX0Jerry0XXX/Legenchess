import { describe, expect, it } from 'vitest';
import { getPiece, getSkill, registerPiece, registerSkill } from './registry';
import type { SkillDefinition } from './types';

describe('Mod 注册表', () => {
  it('可以注册并查询自定义棋子', () => {
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
    expect(getPiece('custom_knight')?.name).toBe('自定义骑士');
  });

  it('可以注册并查询自定义技能', () => {
    const skill: SkillDefinition = {
      id: 'custom_slash',
      name: '斩击',
      description: '测试技能',
      cost: 2,
      targetMode: 'none',
      getTargetCells: () => [],
      canUse: () => true,
      getActions: () => [],
    };
    registerSkill(skill);
    expect(getSkill('custom_slash')?.name).toBe('斩击');
  });
});
