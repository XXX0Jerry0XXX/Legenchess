import { resumeGame, useGame } from '../state/GameProvider';
import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { RulesButton } from './RulesButton';
import type { AiLevel } from '../game/types';
import { useLan } from '../net/LanContext';
import { t } from '../i18n';

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
      <h1>{t('app.title')}</h1>
      <p>{t('start.subtitle')}</p>
      <div className="start-actions">
        <RulesButton />
        <button className="primary" onClick={() => setShowLocalMenu(true)}>
          {t('start.local')}
        </button>
        <button className="primary" onClick={() => setShowAiMenu(true)}>
          {t('start.ai')}
        </button>
        <button className="primary" onClick={() => setShowLanMenu(true)}>
          {t('start.lan')}
        </button>
        {canResume && (
          <button
            className="primary"
            onClick={() => {
              const saved = resumeGame();
              if (saved) dispatch({ type: 'RESTORE', state: saved });
            }}
          >
            {t('start.resume')}
          </button>
        )}
      </div>
      {showLocalMenu && (
        <Modal title={t('local.title')}>
          <p>{t('local.prompt')}</p>
          <div className="choice-row">
            <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 0 })}>
              {t('common.firstPlayer')}
            </button>
            <button className="primary" onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 1 })}>
              {t('common.secondPlayer')}
            </button>
          </div>
          <div className="choice-row">
            <button onClick={() => setShowLocalMenu(false)}>{t('common.cancel')}</button>
          </div>
        </Modal>
      )}
      {showAiMenu && (
        <Modal title={t('ai.title')}>
          <p>{t('ai.prompt')}</p>
          <div className="choice-row">
            <button className="primary" onClick={() => startAi('beginner', 0)}>
              {t('ai.beginnerFirst')}
            </button>
            <button className="primary" onClick={() => startAi('expert', 0)}>
              {t('ai.expertFirst')}
            </button>
          </div>
          <div className="choice-row">
            <button className="primary" onClick={() => startAi('beginner', 1)}>
              {t('ai.beginnerSecond')}
            </button>
            <button className="primary" onClick={() => startAi('expert', 1)}>
              {t('ai.expertSecond')}
            </button>
          </div>
          <div className="choice-row">
            <button className="primary" onClick={() => startAi('ppo', 0)}>{t('ai.ppoFirst')}</button>
            <button className="primary" onClick={() => startAi('ppo', 1)}>{t('ai.ppoSecond')}</button>
          </div>
          <div className="choice-row">
            <button onClick={() => setShowAiMenu(false)}>{t('common.cancel')}</button>
          </div>
        </Modal>
      )}
      {showLanMenu && (
        <Modal title={t('lan.title')}>
          {error && <p role="alert">{error}</p>}
          {!role && (
            <>
              <p>{t('lan.intro')}</p>
              <div className="choice-row">
                <button className="primary" onClick={createRoom}>{t('lan.createRoom')}</button>
              </div>
              <div className="choice-row">
                <input
                  placeholder={t('lan.hostPlaceholder')}
                  value={lanAddress}
                  onChange={(event) => setLanAddress(event.target.value)}
                />
                <input
                  placeholder={t('lan.roomPlaceholder')}
                  maxLength={4}
                  value={lanRoom}
                  onChange={(event) => setLanRoom(event.target.value.toUpperCase())}
                />
                <button
                  className="primary"
                  disabled={!lanAddress.trim() || lanRoom.length !== 4}
                  onClick={() => joinRoom(lanAddress, lanRoom)}
                >
                  {t('lan.joinRoom')}
                </button>
              </div>
            </>
          )}
          {role === 'host' && (
            <>
              <p>{t('lan.roomCode')}<strong>{room}</strong></p>
              {hostIps.length > 0 && (
                <p>{t('lan.address')}{hostIps.map((ip) => `${ip}:${location.port || '5173'}`).join('、')}</p>
              )}
              <p>{peerConnected ? t('lan.peerConnected') : t('lan.waitingPeer')}</p>
              <div className="choice-row">
                <button
                  className="primary"
                  disabled={!peerConnected}
                  onClick={() => dispatch({ type: 'START_SETUP', firstPlayer: 0, mode: 'lan' })}
                >
                  {t('lan.start')}
                </button>
              </div>
            </>
          )}
          {role === 'guest' && <p>{t('lan.guestWaiting', { room: room ?? '' })}</p>}
          <div className="choice-row">
            <button onClick={() => { leave(); setShowLanMenu(false); }}>{t('common.cancel')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
