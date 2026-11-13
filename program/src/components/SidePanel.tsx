import { PIECE_DEFS } from '../game/constants';
import { aliveCount } from '../game/engine';
import { getPiece } from '../game/registry';
import { useGame } from '../state/GameProvider';
import type { Owner } from '../game/types';
import { t } from '../i18n';

export function SidePanel({ owner, label }: { owner: Owner; label: string }) {
  const { state } = useGame();
  const alive = Object.values(state.pieces).filter((p) => p.owner === owner && !p.dead);
  const dead = Object.values(state.pieces).filter((p) => p.owner === owner && p.dead);

  return (
    <aside className="side">
      <div className="player-name">{label}</div>
      <div className="stats">
        {t('side.alive', { count: alive.length })}
        {state.phase === 'play' && <span> · {t('piece.chairman.name')} {alive.some((p) => p.type === 'chairman') ? t('side.chairmanPresent') : t('side.chairmanDead')}</span>}
      </div>
      <div className="grave">
        {dead.map((p) => (
          <span key={p.id} className="tomb">
            {t((getPiece(p.type) ?? PIECE_DEFS[p.type])?.short ?? p.type)}
          </span>
        ))}
      </div>
    </aside>
  );
}
