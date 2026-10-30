import { useRef, useState } from 'react';
import { COLS, ROWS } from '../game/constants';
import { readSetupPreset } from '../game/presets';
import { useGame } from '../state/GameProvider';
import type { PieceType } from '../game/types';

export function PresetManager() {
  const { state, dispatch } = useGame();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const exportPreset = () => {
    const placements: { type: PieceType; r: number; c: number }[] = [];
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < COLS; c += 1) {
        const id = state.board[r][c];
        if (id && state.pieces[id].owner === state.setupOwner) {
          placements.push({ type: state.pieces[id].type, r, c });
        }
      }
    }
    const blob = new Blob([JSON.stringify({ name: 'legenchess-preset', board: { rows: ROWS, cols: COLS }, placements }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legenchess-preset-${state.setupOwner === state.firstPlayer ? 'first' : 'second'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPreset = async (file: File) => {
    try {
      const data: unknown = JSON.parse(await file.text());
      const placements = readSetupPreset(data, state.setupOwner);
      dispatch({ type: 'IMPORT_PRESET', owner: state.setupOwner, placements });
      setError(null);
    } catch {
      setError('无法导入布阵：请选择包含完整 16 枚棋子的有效布阵 JSON 文件。');
    }
  };

  return (
    <div className="action-list">
      <button onClick={exportPreset}>导出当前布阵 JSON</button>
      <button onClick={() => fileRef.current?.click()}>导入布阵 JSON</button>
      {error && <span role="alert">{error}</span>}
      <input
        ref={fileRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) importPreset(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
