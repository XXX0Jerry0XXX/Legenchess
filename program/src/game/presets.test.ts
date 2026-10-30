import { describe, expect, it } from 'vitest';
import { readSetupPreset } from './presets';
import { createInitialState, reducer } from './reducer';
import { randomSetupPlacements } from './setup';

describe('8×12 布阵预设兼容', () => {
  it.each([false, true])('旧下方布阵迁移后仍可导入（尺寸字段：%s）', (withDimensions) => {
    const placements = randomSetupPlacements(1);
    const legacy = placements.map((p) => ({ ...p, r: p.r - 2 }));
    const data = { placements: legacy, ...(withDimensions ? { board: { rows: 10, cols: 8 } } : {}) };
    const normalized = readSetupPreset(data, 1);
    expect(normalized).toEqual(placements);
    let state = reducer(createInitialState(), { type: 'START_SETUP', firstPlayer: 0 });
    state = reducer(state, { type: 'NEXT_SETUP' });
    state = reducer(state, { type: 'IMPORT_PRESET', owner: 1, placements: normalized });
    expect(state.board.slice(9).flat().filter(Boolean)).toHaveLength(16);
    expect(Object.values(state.setupTray[1]).every((count) => count === 0)).toBe(true);
  });

  it.each([0, 1] as const)('新格式和无尺寸的新布局均保留玩家 %s 的坐标', (owner) => {
    const placements = randomSetupPlacements(owner);
    expect(readSetupPreset({ board: { rows: 12, cols: 8 }, placements }, owner)).toEqual(placements);
    expect(readSetupPreset({ placements }, owner)).toEqual(placements);
  });

  it('拒绝重复坐标、错误棋子数量和错误尺寸', () => {
    const placements = randomSetupPlacements(1);
    const duplicate = placements.map((p) => ({ ...p, r: 11, c: 7 }));
    const wrongTypes = placements.map((p) => ({ ...p, type: 'novice' }));
    for (const data of [null, { placements: [] }, { placements: duplicate }, { placements: wrongTypes },
      { placements, board: { rows: 12, cols: 10 } },
      { placements: placements.map((p) => ({ ...p, r: p.r + 0.5 })) },
    ]) {
      expect(() => readSetupPreset(data, 1)).toThrow();
    }
  });
});
