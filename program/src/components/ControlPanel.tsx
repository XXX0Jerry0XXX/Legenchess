import { PIECE_DEFS } from '../game/constants';
import { getAttackCells, getMageSkillCells, getWarriorSkillCells } from '../game/ranges';
import { useGame } from '../state/GameProvider';

export function ControlPanel() {
  const { state, dispatch } = useGame();
  const selected = state.selectedId ? state.pieces[state.selectedId] : null;
  const ap = state.ap;

  const hasTargets =
    selected && getAttackCells(state, selected.id).length > 0;
  const hasWarriorTargets = selected ? getWarriorSkillCells(state, selected.id).length > 0 : false;
  const hasMageTargets = selected ? getMageSkillCells(state, selected.id).length > 0 : false;
  const revivable = state.lastTurnDeaths.some(
    (id) => state.pieces[id]?.owner === state.currentPlayer && state.pieces[id]?.dead && state.pieces[id].type !== 'chairman',
  );

  return (
    <section className="control-panel">
      <div className="action-list">
        <strong>
          {state.currentPlayer === 0 ? 'A' : 'B'} 回合 · AP {ap}
        </strong>
        {selected ? (
          <span>
            已选：{PIECE_DEFS[selected.type].name}（HP {selected.hp}/{selected.maxHp}）
          </span>
        ) : (
          <span>点击己方棋子选择</span>
        )}

        {selected && (
          <>
            <button disabled={ap < 1} onClick={() => dispatch({ type: 'SET_MODE', mode: 'move' })}>
              移动
            </button>
            <button disabled={ap < 1 || !hasTargets} onClick={() => dispatch({ type: 'SET_MODE', mode: 'attack' })}>
              攻击
            </button>
            {selected.type === 'warrior' && (
              <button disabled={ap < 2 || !hasWarriorTargets} onClick={() => dispatch({ type: 'SET_MODE', mode: 'warrior' })}>
                战士技能
              </button>
            )}
            {selected.type === 'mage' && (
              <button disabled={ap < 2 || !hasMageTargets} onClick={() => dispatch({ type: 'SET_MODE', mode: 'mage' })}>
                法师技能
              </button>
            )}
            {selected.type === 'assassin' && !selected.freeMove && !selected.freeAttack && (
              <button disabled={ap < 2} onClick={() => dispatch({ type: 'USE_ASSASSIN' })}>
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
              <button disabled={ap < 2 || !revivable} onClick={() => dispatch({ type: 'SET_MODE', mode: 'revive' })}>
                牧师技能
              </button>
            )}
          </>
        )}

        {state.actionMode === 'mage' && (
          <>
            <span>已选 {state.mageTargets.length}/3</span>
            <button
              className="primary"
              disabled={state.mageTargets.length < 1}
              onClick={() => dispatch({ type: 'CONFIRM_MAGE' })}
            >
              确认施法
            </button>
          </>
        )}

        {state.actionMode === 'revive' && (
          <>
            {!state.pendingRevive ? (
              <>
                <span>选择要复活的棋子：</span>
                {state.lastTurnDeaths
                  .filter(
                    (id) =>
                      state.pieces[id]?.owner === state.currentPlayer &&
                      state.pieces[id]?.dead &&
                      state.pieces[id].type !== 'chairman',
                  )
                  .map((id) => (
                    <button key={id} onClick={() => dispatch({ type: 'CHOOSE_REVIVE', id })}>
                      {PIECE_DEFS[state.pieces[id].type].name}
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
      </div>
    </section>
  );
}
