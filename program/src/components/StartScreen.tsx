import { resumeGame, useGame } from '../state/GameProvider';

export function StartScreen() {
  const { dispatch, canResume } = useGame();

  return (
    <div className="start-screen">
      <h1>传奇棋</h1>
      <p>本地双人热座对战。选择先手方后，双方轮流隐藏布阵并开始对局。</p>
      <div className="start-actions">
        <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 0 })}>
          上方 A 先手
        </button>
        <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 1 })}>
          下方 B 先手
        </button>
        {canResume && (
          <button
            onClick={() => {
              const saved = resumeGame();
              if (saved) dispatch({ type: 'RESTORE', state: saved });
            }}
          >
            继续上一局
          </button>
        )}
      </div>
    </div>
  );
}
