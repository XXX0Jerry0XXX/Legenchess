import { PIECE_DEFS, SETUP_COUNTS } from '../game/constants';
import { useGame } from '../state/GameProvider';
import type { PieceType } from '../game/types';
import { PresetManager } from './PresetManager';
import { useLan } from '../net/LanContext';
import { canAct, localOwnerOf } from '../net/perspective';
import { t } from '../i18n';

const ORDER: PieceType[] = ['novice', 'warrior', 'mage', 'assassin', 'priest', 'chairman'];

export function SetupScreen() {
  const { state, dispatch } = useGame();
  const { role } = useLan();
  const tray = state.setupTray[state.setupOwner];
  const total = Object.values(tray).reduce((a, b) => a + b, 0);
  const ownerName = t(state.setupOwner === state.firstPlayer ? 'common.firstPlayer' : 'common.secondPlayer');

  if (!canAct(state, localOwnerOf(role))) {
    return (
      <section className="control-panel">
        <div className="action-list">
          <strong>{t('setup.waiting.title')}</strong>
          <span>{t('setup.waiting.text')}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="control-panel">
      <div className="action-list">
        <strong>{t('phase.setup', { owner: ownerName })}</strong>
        <span>
          {t('setup.remaining', { total })}
        </span>
        {state.setupOwner === 0 && (
          <button onClick={() => dispatch({ type: 'SELECT_SETUP', pieceType: null })}>{t('setup.cancelSelection')}</button>
        )}
      </div>
      <div className="tray" style={{ marginTop: 10 }}>
        {ORDER.map((type) => (
          <div
            key={type}
            className={`tray-piece ${state.selectedSetupType === type ? 'selected' : ''}`}
            onClick={() => dispatch({ type: 'SELECT_SETUP', pieceType: type })}
          >
            <div>{t(PIECE_DEFS[type].short)}</div>
            <div>{t(PIECE_DEFS[type].name)}</div>
            <div className="count">{t('setup.count', { count: tray[type] })}</div>
          </div>
        ))}
      </div>
      <div className="action-list" style={{ marginTop: 12 }}>
        <PresetManager />
        <button className="primary" disabled={total !== 0} onClick={() => dispatch({ type: 'NEXT_SETUP' })}>
          {state.setupOwner === 0 ? t('setup.nextFirst') : t('setup.nextSecond')}
        </button>
      </div>
    </section>
  );
}
