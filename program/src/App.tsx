import { Board } from './components/Board';
import { ControlPanel } from './components/ControlPanel';
import { Modal } from './components/Modal';
import { RulesButton } from './components/RulesButton';
import { SetupScreen } from './components/SetupScreen';
import { SidePanel } from './components/SidePanel';
import { StartScreen } from './components/StartScreen';
import { PROMOTABLE, PIECE_DEFS } from './game/constants';
import { createInitialState } from './game/reducer';
import { GameProvider, useGame } from './state/GameProvider';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Game() {
  const { state, dispatch } = useGame();

  if (state.phase === 'start') {
    return <StartScreen />;
  }

  const phaseLabel =
    state.phase === 'setup'
      ? `${state.setupOwner === 0 ? '上方 A' : '下方 B'} 布阵`
      : state.phase === 'observe'
        ? '双方观察'
        : state.phase === 'finished'
          ? '对局结束'
          : `${state.currentPlayer === 0 ? '上方 A' : '下方 B'} 回合`;

  const round = state.turn > 0 ? Math.ceil(state.turn / 2) : 0;

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">L</span>
          <h1>传奇棋</h1>
        </div>
        <div className="turn-info">
          <strong>{phaseLabel}</strong>
          {state.phase === 'play' && <span>第 {round} 轮 · 回合 {state.turn}</span>}
        </div>
        <div className="clocks">
          <div className={`clock ${state.phase === 'play' && state.currentPlayer === 0 ? 'active' : ''}`}>
            A {formatTime(state.times[0])}
          </div>
          <div className={`clock ${state.phase === 'play' && state.currentPlayer === 1 ? 'active' : ''}`}>
            B {formatTime(state.times[1])}
          </div>
        </div>
        <RulesButton />
      </header>

      <section className="layout">
        <SidePanel owner={0} label="上方 A" />
        <div className="board-wrap">
          <Board />
        </div>
        <SidePanel owner={1} label="下方 B" />
      </section>

      {state.phase === 'setup' && <SetupScreen />}
      {state.phase === 'play' && <ControlPanel />}

      {state.phase === 'observe' && (
        <Modal title="双方观察布局">
          <p>
            先手方为 {state.firstPlayer === 0 ? '上方 A' : '下方 B'}。双方可在 {formatTime(state.observationRemaining)}{' '}
            内查看棋盘，先手方可在计时结束前开始第一回合。
          </p>
          <div className="choice-row">
            <button className="primary" onClick={() => dispatch({ type: 'START_PLAY' })}>
              开始第一回合
            </button>
          </div>
        </Modal>
      )}

      {state.pendingPromotion && state.phase !== 'finished' && (
        <Modal title="新手转职">
          <p>请选择转职方向：</p>
          <div className="choice-row">
            {PROMOTABLE.map((type) => (
              <button key={type} onClick={() => dispatch({ type: 'CHOOSE_PROMOTION', pieceType: type })}>
                {PIECE_DEFS[type].name}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {state.phase === 'finished' && state.winner !== null && (
        <Modal title="对局结束">
          <p>
            {state.winner === 'draw'
              ? '平局。'
              : `${state.winner === 0 ? '上方 A' : '下方 B'} 获胜。`}
          </p>
          <div className="choice-row">
            <button
              className="primary"
              onClick={() => dispatch({ type: 'RESTORE', state: createInitialState() })}
            >
              返回主菜单
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

export function App() {
  return (
    <GameProvider>
      <Game />
    </GameProvider>
  );
}
