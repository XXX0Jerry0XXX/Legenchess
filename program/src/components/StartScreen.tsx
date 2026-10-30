import { resumeGame, useGame } from '../state/GameProvider';
import { useState } from 'react';
import { Modal } from './Modal';
import { RulesButton } from './RulesButton';
import type { AiLevel } from '../game/types';

export function StartScreen() {
  const { dispatch, canResume } = useGame();
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showLocalMenu, setShowLocalMenu] = useState(false);

  const startAi = (aiLevel: AiLevel, humanOwner: 0 | 1) => {
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
        <button className="primary" onClick={() => setShowLocalMenu(true)}>
          本地双人
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
      {showLocalMenu && (
        <Modal title="本地双人">
          <p>请选择先手方。</p>
          <div className="choice-row">
            <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 0 })}>
              先手方
            </button>
            <button onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 1 })}>
              后手方
            </button>
          </div>
          <div className="choice-row">
            <button onClick={() => setShowLocalMenu(false)}>取消</button>
          </div>
        </Modal>
      )}
      {showAiMenu && (
        <Modal title="人机对战">
          <p>选择 AI 强度和你的执棋方。</p>
          <div className="choice-row">
            <button className="primary" onClick={() => startAi('beginner', 0)}>
              初学者 · 我先手
            </button>
            <button className="primary" onClick={() => startAi('expert', 0)}>
              高手 · 我先手
            </button>
          </div>
          <div className="choice-row">
            <button onClick={() => startAi('beginner', 1)}>
              初学者 · 我后手
            </button>
            <button onClick={() => startAi('expert', 1)}>
              高手 · 我后手
            </button>
          </div>
          <div className="choice-row">
            <button onClick={() => startAi('ppo', 0)}>PPO 实验版 · 我先手</button>
            <button onClick={() => startAi('ppo', 1)}>PPO 实验版 · 我后手</button>
          </div>
          <div className="choice-row">
            <button onClick={() => setShowAiMenu(false)}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
