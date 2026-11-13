import { ATTACK_COST, MAX_MAGE_TARGETS, MOVE_COST, PIECE_DEFS, SKILL_COST } from '../game/constants';
import { getPiece, getSkill } from '../game/registry';
import { getAttackCells, getMageSkillCells, getWarriorSkillCells } from '../game/ranges';
import { useGame } from '../state/GameProvider';
import { useLan } from '../net/LanContext';
import { canAct, localOwnerOf } from '../net/perspective';
import { t } from '../i18n';

export function ControlPanel() {
  const { state, dispatch } = useGame();
  const { role } = useLan();
  const selected = state.selectedId ? state.pieces[state.selectedId] : null;
  const ap = state.ap;
  const isFirst = state.currentPlayer === state.firstPlayer;
  const selectedDef = selected ? getPiece(selected.type) : null;
  const selectedSkill = selectedDef ? getSkill(selectedDef.skill) : null;
  const isBuiltinSkill = selectedDef
    ? ['warrior', 'mage', 'assassin', 'priest', 'promote'].includes(selectedDef.skill)
    : true;

  const hasTargets =
    selected && getAttackCells(state, selected.id).length > 0;
  const hasWarriorTargets = selected ? getWarriorSkillCells(state, selected.id).length > 0 : false;
  const hasMageTargets = selected ? getMageSkillCells(state, selected.id).length > 0 : false;
  const deathPool = [...state.lastTurnDeaths, ...state.previousTurnDeaths];
  const revivable = deathPool.some(
    (id) => state.pieces[id]?.owner === state.currentPlayer && state.pieces[id]?.dead,
  );

  if (role && !canAct(state, localOwnerOf(role))) {
    return (
      <section className="control-panel">
        <div className="action-list">
          <strong>{t('control.waiting')}</strong>
        </div>
      </section>
    );
  }

  return (
    <section className="control-panel">
      <div className="action-list">
        <strong>
          {t('control.turn', { owner: t(isFirst ? 'common.firstPlayer' : 'common.secondPlayer'), ap })}
        </strong>
        {selected ? (
          <span>
            {t('control.selected', { name: t((getPiece(selected.type) ?? PIECE_DEFS[selected.type])?.name ?? selected.type), hp: selected.hp, maxHp: selected.maxHp })}
          </span>
        ) : (
          <span>{t('control.selectHint')}</span>
        )}

        {selected && (
          <>
            <button
              className={state.actionMode === 'move' ? 'active-mode' : ''}
              disabled={ap < MOVE_COST}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'move' })}
            >
              {t('control.move')}
            </button>
            <button
              className={state.actionMode === 'attack' ? 'active-mode' : ''}
              disabled={ap < ATTACK_COST || !hasTargets}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'attack' })}
            >
              {t('control.attack')}
            </button>
            {selected.type === 'warrior' && (
              <button
                className={state.actionMode === 'warrior' ? 'active-mode' : ''}
                disabled={ap < SKILL_COST || !hasWarriorTargets}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'warrior' })}
              >
                {t('skill.warrior.name')}
              </button>
            )}
            {selected.type === 'mage' && (
              <button
                className={state.actionMode === 'mage' ? 'active-mode' : ''}
                disabled={ap < SKILL_COST || !hasMageTargets}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'mage' })}
              >
                {t('skill.mage.name')}
              </button>
            )}
            {selected.type === 'assassin' && !selected.freeMove && !selected.freeAttack && (
              <button disabled={ap < SKILL_COST} onClick={() => dispatch({ type: 'USE_ASSASSIN' })}>
                {t('skill.assassin.name')}
              </button>
            )}
            {selected.type === 'assassin' && selected.freeMove && (
              <button onClick={() => dispatch({ type: 'SET_MODE', mode: 'assassinMove' })}>{t('control.freeMove')}</button>
            )}
            {selected.type === 'assassin' && selected.freeAttack && (
              <button
                disabled={!hasTargets}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'assassinAttack' })}
              >
                {t('control.freeAttack')}
              </button>
            )}
            {selected.type === 'priest' && (
              <button disabled={ap < SKILL_COST || !revivable} onClick={() => dispatch({ type: 'SET_MODE', mode: 'revive' })}>
                {t('skill.priest.name')}
              </button>
            )}
            {selectedSkill && !isBuiltinSkill && selectedSkill.targetMode === 'none' && (
              <button
                disabled={ap < selectedSkill.cost || !selectedSkill.canUse(state, selected.id)}
                onClick={() => dispatch({ type: 'ACTIVATE_SKILL' })}
              >
                {t('control.skill')}
              </button>
            )}
            {selectedSkill && !isBuiltinSkill && selectedSkill.targetMode !== 'none' && (
              <button
                className={state.actionMode === 'skill' ? 'active-mode' : ''}
                disabled={ap < selectedSkill.cost}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'skill' })}
              >
                {t('control.skill')}
              </button>
            )}
          </>
        )}

        {state.actionMode === 'mage' && (
          <>
            <span>{t('control.selectedCount', { count: state.mageTargets.length, max: MAX_MAGE_TARGETS })}</span>
            <button
              className="primary"
              disabled={state.mageTargets.length < 1}
              onClick={() => dispatch({ type: 'CONFIRM_MAGE' })}
            >
              {t('control.confirmMage')}
            </button>
          </>
        )}

        {state.actionMode === 'skill' && selectedSkill && selectedSkill.targetMode !== 'none' && (
          <>
            <span>
              {t('control.selectedCount', { count: state.skillTargets.length, max: selectedSkill.maxTargets ?? (selectedSkill.targetMode === 'multi' ? 3 : 1) })}
            </span>
            <button
              className="primary"
              disabled={
                (selectedSkill.targetMode === 'single' && state.skillTargets.length !== 1) ||
                (selectedSkill.targetMode === 'multi' && state.skillTargets.length < 1)
              }
              onClick={() => dispatch({ type: 'CONFIRM_SKILL' })}
            >
              {t('control.confirmSkill')}
            </button>
          </>
        )}

        {state.actionMode === 'revive' && (
          <>
            {!state.pendingRevive ? (
              <>
                <span>{t('control.revivePrompt')}</span>
                {deathPool
                  .filter(
                    (id) =>
                      state.pieces[id]?.owner === state.currentPlayer &&
                      state.pieces[id]?.dead,
                  )
                  .map((id) => (
                    <button key={id} onClick={() => dispatch({ type: 'CHOOSE_REVIVE', id })}>
                      {t((getPiece(state.pieces[id].type) ?? PIECE_DEFS[state.pieces[id].type])?.name ?? state.pieces[id].type)}
                    </button>
                  ))}
              </>
            ) : (
              <span>{t('control.revivePlace')}</span>
            )}
          </>
        )}

        <button onClick={() => dispatch({ type: 'END_TURN' })}>
          {t('control.endTurn')}
        </button>
        <button className="danger" onClick={() => dispatch({ type: 'RESIGN', owner: state.currentPlayer })}>
          {t('control.resign')}
        </button>
      </div>
    </section>
  );
}
