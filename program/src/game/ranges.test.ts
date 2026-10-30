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

  it('新增的右下角可达，范围在第 12 行和第 8 列边缘裁剪', () => {
    expect(cellsForMoveKind('rect1', { r: 11, c: 7 })).toEqual([
      { r: 10, c: 6 },
      { r: 10, c: 7 },
      { r: 11, c: 6 },
    ]);
  });
});
