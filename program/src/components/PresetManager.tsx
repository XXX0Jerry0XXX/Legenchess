import { useRef } from 'react';
import { useGame } from '../state/GameProvider';
import type { PieceType } from '../game/types';

export function PresetManager() {
  const { state, dispatch } = useGame();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportPreset = () => {
    const placements: { type: PieceType; r: number; c: number }[] = [];
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const id = state.board[r][c];
        if (id && state.pieces[id].owner === state.setupOwner) {
          placements.push({ type: state.pieces[id].type, r, c });
        }
      }
    }
    const blob = new Blob([JSON.stringify({ name: 'legenchess-preset', placements }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legenchess-preset-${state.setupOwner === 0 ? 'A' : 'B'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importPreset = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text) as { placements: { type: PieceType; r: number; c: number }[] };
    dispatch({ type: 'IMPORT_PRESET', owner: state.setupOwner, placements: data.placements });
  };

  return (
    <div className="action-list">
      <button onClick={exportPreset}>导出当前布阵 JSON</button>
      <button onClick={() => fileRef.current?.click()}>导入布阵 JSON</button>
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
