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
import { LanProvider, useLan } from './net/LanContext';
import { canAct, localOwnerOf } from './net/perspective';
import { t } from './i18n';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function Game() {
  const { state, dispatch } = useGame();
  const { role, leave } = useLan();
  const localOwner = localOwnerOf(role);
  const canActNow = canAct(state, localOwner);
  const backToMenu = () => {
    if (role) leave();
    dispatch({ type: 'RESTORE', state: createInitialState() });
  };

  if (state.phase === 'start') {
    return <StartScreen />;
  }

  const ownerName = (owner: 0 | 1) => t(owner === state.firstPlayer ? 'common.firstPlayer' : 'common.secondPlayer');

  const phaseLabel =
    state.phase === 'setup'
      ? t('phase.setup', { owner: ownerName(state.setupOwner) })
      : state.phase === 'observe'
        ? t('phase.observe')
        : state.phase === 'finished'
          ? t('phase.finished')
          : t('phase.turn', { owner: ownerName(state.currentPlayer) });

  const round = state.turn > 0 ? Math.ceil(state.turn / 2) : 0;

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">L</span>
          <h1>{t('app.title')}</h1>
        </div>
        <div className="turn-info">
          <strong>{phaseLabel}</strong>
          {state.phase === 'play' && <span>{t('round.turn', { round, turn: state.turn })}</span>}
        </div>
        <div className="clocks">
          <div className={`clock ${state.phase === 'play' && state.currentPlayer === 0 ? 'active' : ''}`}>
            {ownerName(0)} {formatTime(state.times[0])}
          </div>
          <div className={`clock ${state.phase === 'play' && state.currentPlayer === 1 ? 'active' : ''}`}>
            {ownerName(1)} {formatTime(state.times[1])}
          </div>
        </div>
        <RulesButton />
      </header>

      <section className="layout">
        <SidePanel owner={0} label={ownerName(0)} />
        <div className="board-wrap">
          <Board />
        </div>
        <SidePanel owner={1} label={ownerName(1)} />
      </section>

      {state.phase === 'setup' && <SetupScreen />}
      {state.phase === 'play' && <ControlPanel />}

      {state.phase === 'observe' && (
        <Modal title={t('observe.title')}>
          <p>
            {t('observe.text', { owner: ownerName(state.firstPlayer), time: formatTime(state.observationRemaining) })}
          </p>
          <div className="choice-row">
            {canActNow ? (
              <button className="primary" onClick={() => dispatch({ type: 'START_PLAY' })}>
                {t('observe.start')}
              </button>
            ) : (
              <span>{t('observe.waiting')}</span>
            )}
          </div>
        </Modal>
      )}

      {state.pendingPromotion && state.phase !== 'finished' && canActNow && (
        <Modal title={t('promotion.title')}>
          <p>{t('promotion.prompt')}</p>
          <div className="choice-row">
            {PROMOTABLE.map((type) => (
              <button key={type} className="primary" onClick={() => dispatch({ type: 'CHOOSE_PROMOTION', pieceType: type })}>
                {t(PIECE_DEFS[type].name)}
              </button>
            ))}
          </div>
        </Modal>
      )}

      {state.phase === 'finished' && state.winner !== null && (
        <Modal title={t('finish.title')}>
          <p>
            {state.winner === 'draw'
              ? t('finish.draw')
              : t('finish.win', { owner: ownerName(state.winner) })}
          </p>
          <div className="choice-row">
            <button className="primary" onClick={backToMenu}>
              {t('finish.back')}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

export function App() {
  return (
    <LanProvider>
      <GameProvider>
        <Game />
      </GameProvider>
    </LanProvider>
  );
}
