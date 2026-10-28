import { resumeGame, useGame } from '../state/GameProvider';
import { useState } from 'react';
import { Modal } from './Modal';
import { RulesButton } from './RulesButton';

export function StartScreen() {
  const { dispatch, canResume } = useGame();
  const [showAiMenu, setShowAiMenu] = useState(false);

  const startAi = (aiLevel: 'beginner' | 'expert', humanOwner: 0 | 1) => {
    dispatch({
      type: 'START_SETUP',
      firstPlayer: humanOwner === 0 ? 0 : 0,
      mode: 'ai',
      aiPlayer: humanOwner === 0 ? 1 : 0,
      aiLevel,
    });
  };

  return (
    <div className="start-screen">
      <h1>传奇棋</h1>
      <p>本地双人热座对战。选择先手方后，双方轮流隐藏布阵并开始对局。</p>
      <div className="start-actions">
        <RulesButton />
        <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 0 })}>
          本地双人 · 上方 A 先手
        </button>
        <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 1 })}>
          本地双人 · 下方 B 先手
        </button>
        <button onClick={() => setShowAiMenu(true)}>
          人机对战
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
      {showAiMenu && (
        <Modal title="人机对战">
          <p>选择 AI 强度和你的执棋方。</p>
          <div className="choice-row">
            <button className="primary" onClick={() => startAi('beginner', 0)}>
              初学者 · 我执 A（先手）
            </button>
            <button className="primary" onClick={() => startAi('expert', 0)}>
              高手 · 我执 A（先手）
            </button>
          </div>
          <div className="choice-row">
            <button onClick={() => startAi('beginner', 1)}>
              初学者 · 我执 B（AI 先手）
            </button>
            <button onClick={() => startAi('expert', 1)}>
              高手 · 我执 B（AI 先手）
            </button>
          </div>
          <div className="choice-row">
            <button onClick={() => setShowAiMenu(false)}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
