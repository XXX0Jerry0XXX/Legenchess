import { PIECE_DEFS, SETUP_COUNTS } from '../game/constants';
import { useGame } from '../state/GameProvider';
import type { PieceType } from '../game/types';
import { PresetManager } from './PresetManager';

const ORDER: PieceType[] = ['novice', 'warrior', 'mage', 'assassin', 'priest', 'chairman'];

export function SetupScreen() {
  const { state, dispatch } = useGame();
  const tray = state.setupTray[state.setupOwner];
  const total = Object.values(tray).reduce((a, b) => a + b, 0);
  const ownerName = state.setupOwner === 0 ? '上方 A' : '下方 B';

  return (
    <section className="control-panel">
      <div className="action-list">
        <strong>{ownerName} 布阵</strong>
        <span>
          剩余 {total} 枚棋子 · 点击棋子类型后，点击己方备战区空格放置；点击已放置棋子可撤回。
        </span>
        {state.setupOwner === 0 && (
          <button onClick={() => dispatch({ type: 'SELECT_SETUP', pieceType: null })}>取消选择</button>
        )}
      </div>
      <div className="tray" style={{ marginTop: 10 }}>
        {ORDER.map((type) => (
          <div
            key={type}
            className={`tray-piece ${state.selectedSetupType === type ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'SELECT_SETUP', pieceType: type })}
          >
            <div>{PIECE_DEFS[type].short}</div>
            <div>{PIECE_DEFS[type].name}</div>
            <div className="count">剩余 {tray[type]}</div>
          </div>
        ))}
      </div>
      <div className="action-list" style={{ marginTop: 12 }}>
        <PresetManager />
        <button className="primary" disabled={total !== 0} onClick={() => dispatch({ type: 'NEXT_SETUP' })}>
          {state.setupOwner === 0 ? '完成布阵，交给下方 B' : '完成布阵，开始观察'}
        </button>
      </div>
    </section>
  );
}
