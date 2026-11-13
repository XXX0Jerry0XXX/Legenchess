import { useState } from 'react';
import { COLS, PREP_ROWS, ROWS } from '../game/constants';
import { Modal } from './Modal';
import { t } from '../i18n';

function RulesContent() {
  return (
    <div className="rules-text">
      <h3>{t('rules.game.heading')}</h3>
      <p>{t('rules.game.setup', { cols: COLS, prep: PREP_ROWS })}</p>
      <p>{t('rules.game.turns')}</p>
      <p>{t('rules.game.actions')}</p>

      <h3>{t('rules.win.heading')}</h3>
      <ul>
        <li>{t('rules.win.eliminate')}</li>
        <li>{t('rules.win.resign')}</li>
        <li>{t('rules.win.mutual')}</li>
        <li>{t('rules.win.timeout')}</li>
      </ul>
      <p>{t('rules.win.clock')}</p>

      <h3>{t('rules.range.heading')}</h3>
      <ul>
        <li>{t('rules.range.rect3')}</li>
        <li>{t('rules.range.rect5')}</li>
        <li>{t('rules.range.cross5')}</li>
        <li>{t('rules.range.ring5')}</li>
        <li>{t('rules.range.clip')}</li>
      </ul>
      <p>{t('rules.range.block')}</p>

      <h3>{t('rules.action.heading')}</h3>
      <ul>
        <li>{t('rules.action.move')}</li>
        <li>{t('rules.action.attack')}</li>
        <li>{t('rules.action.skill')}</li>
      </ul>

      <h3>{t('rules.piece.heading')}</h3>
      <ul>
        <li>{t('rules.piece.novice')}</li>
        <li>{t('rules.piece.warrior')}</li>
        <li>{t('rules.piece.mage')}</li>
        <li>{t('rules.piece.assassin')}</li>
        <li>{t('rules.piece.priest')}</li>
        <li>{t('rules.piece.chairman')}</li>
      </ul>

      <h3>{t('rules.board.heading')}</h3>
      <p>{t('rules.board.desc', { cols: COLS, rows: ROWS, prep: PREP_ROWS, battle: ROWS - 2 * PREP_ROWS })}</p>
    </div>
  );
}

export function RulesButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>{t('rules.button')}</button>
      {open && (
        <Modal title={t('rules.title')}>
          <RulesContent />
          <div className="choice-row">
            <button onClick={() => setOpen(false)}>
              {t('common.close')}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
