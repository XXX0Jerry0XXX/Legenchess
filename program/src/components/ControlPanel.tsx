import { ATTACK_COST, MAX_MAGE_TARGETS, MOVE_COST, PIECE_DEFS, SKILL_COST } from '../game/constants';
import { getPiece, getSkill } from '../game/registry';
import { getAttackCells, getMageSkillCells, getWarriorSkillCells } from '../game/ranges';
import { useGame } from '../state/GameProvider';

export function ControlPanel() {
  const { state, dispatch } = useGame();
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
    (id) => state.pieces[id]?.owner === state.currentPlayer && state.pieces[id]?.dead && state.pieces[id].type !== 'chairman',
  );

  return (
    <section className="control-panel">
      <div className="action-list">
        <strong>
          {isFirst ? '先手方' : '后手方'} 回合 · AP {ap}
        </strong>
        {selected ? (
          <span>
            已选：{(getPiece(selected.type) ?? PIECE_DEFS[selected.type])?.name ?? selected.type}（HP {selected.hp}/{selected.maxHp}）
          </span>
        ) : (
          <span>点击己方棋子选择</span>
        )}

        {selected && (
          <>
            <button
              className={state.actionMode === 'move' ? 'active-mode' : ''}
              disabled={ap < MOVE_COST}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'move' })}
            >
              移动
            </button>
            <button
              className={state.actionMode === 'attack' ? 'active-mode' : ''}
              disabled={ap < ATTACK_COST || !hasTargets}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'attack' })}
            >
              攻击
            </button>
            {selected.type === 'warrior' && (
              <button
                className={state.actionMode === 'warrior' ? 'active-mode' : ''}
                disabled={ap < SKILL_COST || !hasWarriorTargets}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'warrior' })}
              >
                战士技能
              </button>
            )}
            {selected.type === 'mage' && (
              <button
                className={state.actionMode === 'mage' ? 'active-mode' : ''}
                disabled={ap < SKILL_COST || !hasMageTargets}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'mage' })}
              >
                法师技能
              </button>
            )}
            {selected.type === 'assassin' && !selected.freeMove && !selected.freeAttack && (
              <button disabled={ap < SKILL_COST} onClick={() => dispatch({ type: 'USE_ASSASSIN' })}>
                刺客技能
              </button>
            )}
            {selected.type === 'assassin' && selected.freeMove && (
              <button onClick={() => dispatch({ type: 'SET_MODE', mode: 'assassinMove' })}>免费移动</button>
            )}
            {selected.type === 'assassin' && selected.freeAttack && (
              <button
                disabled={!hasTargets}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'assassinAttack' })}
              >
                免费攻击
              </button>
            )}
            {selected.type === 'priest' && (
              <button disabled={ap < SKILL_COST || !revivable} onClick={() => dispatch({ type: 'SET_MODE', mode: 'revive' })}>
                牧师技能
              </button>
            )}
            {selectedSkill && !isBuiltinSkill && selectedSkill.targetMode === 'none' && (
              <button
                disabled={ap < selectedSkill.cost || !selectedSkill.canUse(state, selected.id)}
                onClick={() => dispatch({ type: 'ACTIVATE_SKILL' })}
              >
                技能
              </button>
            )}
            {selectedSkill && !isBuiltinSkill && selectedSkill.targetMode !== 'none' && (
              <button
                className={state.actionMode === 'skill' ? 'active-mode' : ''}
                disabled={ap < selectedSkill.cost}
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'skill' })}
              >
                技能
              </button>
            )}
          </>
        )}

        {state.actionMode === 'mage' && (
          <>
            <span>已选 {state.mageTargets.length}/{MAX_MAGE_TARGETS}</span>
            <button
              className="primary"
              disabled={state.mageTargets.length < 1}
              onClick={() => dispatch({ type: 'CONFIRM_MAGE' })}
            >
              确认施法
            </button>
          </>
        )}

        {state.actionMode === 'skill' && selectedSkill && selectedSkill.targetMode !== 'none' && (
          <>
            <span>
              已选 {state.skillTargets.length}/{selectedSkill.maxTargets ?? (selectedSkill.targetMode === 'multi' ? 3 : 1)}
            </span>
            <button
              className="primary"
              disabled={
                (selectedSkill.targetMode === 'single' && state.skillTargets.length !== 1) ||
                (selectedSkill.targetMode === 'multi' && state.skillTargets.length < 1)
              }
              onClick={() => dispatch({ type: 'CONFIRM_SKILL' })}
            >
              确认技能
            </button>
          </>
        )}

        {state.actionMode === 'revive' && (
          <>
            {!state.pendingRevive ? (
              <>
                <span>选择要复活的棋子：</span>
                {deathPool
                  .filter(
                    (id) =>
                      state.pieces[id]?.owner === state.currentPlayer &&
                      state.pieces[id]?.dead &&
                      state.pieces[id].type !== 'chairman',
                  )
                  .map((id) => (
                    <button key={id} onClick={() => dispatch({ type: 'CHOOSE_REVIVE', id })}>
                      {(getPiece(state.pieces[id].type) ?? PIECE_DEFS[state.pieces[id].type])?.name ?? state.pieces[id].type}
                    </button>
                  ))}
              </>
            ) : (
              <span>点击己方备战区空位放置复活棋子</span>
            )}
          </>
        )}

        <button className="danger" onClick={() => dispatch({ type: 'END_TURN' })}>
          结束回合
        </button>
        <button className="danger" onClick={() => dispatch({ type: 'RESIGN', owner: state.currentPlayer })}>
          投降
        </button>
      </div>
    </section>
  );
}
