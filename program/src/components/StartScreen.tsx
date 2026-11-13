import { resumeGame, useGame } from '../state/GameProvider';
import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { RulesButton } from './RulesButton';
import type { AiLevel } from '../game/types';
import { useLan } from '../net/LanContext';

export function StartScreen() {
  const { dispatch, canResume } = useGame();
  const { role, room, error, peerConnected, createRoom, joinRoom, leave } = useLan();
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [showLocalMenu, setShowLocalMenu] = useState(false);
  const [showLanMenu, setShowLanMenu] = useState(false);
  const [lanAddress, setLanAddress] = useState('');
  const [lanRoom, setLanRoom] = useState('');
  const [hostIps, setHostIps] = useState<string[]>([]);

  useEffect(() => {
    if (role !== 'host') return;
    fetch('/lan/ips')
      .then((response) => response.json())
      .then((data) => setHostIps((data.ips as string[]) ?? []))
      .catch(() => {});
  }, [role]);

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
        <button onClick={() => setShowLanMenu(true)}>
          局域网联机
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
      {showLanMenu && (
        <Modal title="局域网联机">
          {error && <p role="alert">{error}</p>}
          {!role && (
            <>
              <p>创建房间后，把房间码与连接地址告诉对方，对方填写地址与房间码即可加入。</p>
              <div className="choice-row">
                <button className="primary" onClick={createRoom}>创建房间（主机）</button>
              </div>
              <div className="choice-row">
                <input
                  placeholder="主机地址:端口，如 192.168.1.10:5173"
                  value={lanAddress}
                  onChange={(event) => setLanAddress(event.target.value)}
                />
                <input
                  placeholder="房间码"
                  maxLength={4}
                  value={lanRoom}
                  onChange={(event) => setLanRoom(event.target.value.toUpperCase())}
                />
                <button
                  disabled={!lanAddress.trim() || lanRoom.length !== 4}
                  onClick={() => joinRoom(lanAddress, lanRoom)}
                >
                  加入房间（客机）
                </button>
              </div>
            </>
          )}
          {role === 'host' && (
            <>
              <p>房间码：<strong>{room}</strong></p>
              {hostIps.length > 0 && (
                <p>连接地址：{hostIps.map((ip) => `${ip}:${location.port || '5173'}`).join('、')}</p>
              )}
              <p>{peerConnected ? '对手已连接。' : '等待对手加入…'}</p>
              <div className="choice-row">
                <button
                  className="primary"
                  disabled={!peerConnected}
                  onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 0, mode: 'lan' })}
                >
                  开始对战
                </button>
              </div>
            </>
          )}
          {role === 'guest' && <p>已连接房间 {room}，等待主机开始…</p>}
          <div className="choice-row">
            <button onClick={() => { leave(); setShowLanMenu(false); }}>取消</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
