import { describe, expect, it } from 'vitest';
import { cellsForMoveKind, ring2Cells } from './ranges';

describe('范围裁剪', () => {
  it('3x3 矩形在角落只保留棋盘内格', () => {
    expect(cellsForMoveKind('rect1', { r: 0, c: 0 })).toEqual([
      { r: 0, c: 1 },
      { r: 1, c: 0 },
      { r: 1, c: 1 },
    ]);
  });

  it('5x5 十字共 8 格', () => {
    expect(cellsForMoveKind('cross2', { r: 4, c: 4 })).toHaveLength(8);
  });

  it('5x5 环形共 16 格', () => {
    expect(ring2Cells({ r: 4, c: 4 })).toHaveLength(16);
  });
});
