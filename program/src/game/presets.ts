import { COLS, PREP_ROWS, ROWS, SETUP_COUNTS, TOTAL_PIECES_PER_SIDE, isPrepCell } from './constants';
import type { Owner, PieceType } from './types';

type Placement = { type: PieceType; r: number; c: number };

export function readSetupPreset(data: unknown, owner: Owner): Placement[] {
  const invalid = () => new Error('布阵文件无效：需要在己方备战区放置完整的 16 枚棋子。');
  if (!data || typeof data !== 'object' || !('placements' in data)) throw invalid();
  const { placements } = data;
  if (!Array.isArray(placements) || placements.length !== TOTAL_PIECES_PER_SIDE) throw invalid();
  if (!placements.every((p): p is Placement =>
    p !== null && typeof p === 'object' && typeof p.type === 'string' &&
    Object.prototype.hasOwnProperty.call(SETUP_COUNTS, p.type) && Number.isInteger(p.r) && Number.isInteger(p.c)
  )) throw invalid();

  let sourceRows = ROWS;
  if ('board' in data) {
    const board = data.board;
    if (!board || typeof board !== 'object' || !('rows' in board) || !('cols' in board) ||
      board.cols !== COLS || (board.rows !== ROWS && board.rows !== 10)) throw invalid();
    sourceRows = board.rows;
  } else if (owner === 1 && placements.every((p) => p.r >= 7 && p.r < 10)) {
    // 旧格式没有尺寸字段；完整的下方 16 子布局不可能只占新旧共有的一行。
    sourceRows = 10;
  }

  const counts = { ...SETUP_COUNTS };
  const seen = new Set<string>();
  return placements.map((p) => {
    const sourceStart = owner === 0 ? 0 : sourceRows - PREP_ROWS;
    if (p.r < sourceStart || p.r >= sourceStart + PREP_ROWS) throw invalid();
    const r = p.r + (owner === 1 ? ROWS - sourceRows : 0);
    const key = `${r},${p.c}`;
    if (!isPrepCell(owner, r) || p.c < 0 || p.c >= COLS || seen.has(key) || --counts[p.type] < 0) {
      throw invalid();
    }
    seen.add(key);
    return { type: p.type, r, c: p.c };
  });
}
