import { PIECE_DEFS } from '../game/constants';
import { aliveCount } from '../game/engine';
import { useGame } from '../state/GameProvider';
import type { Owner } from '../game/types';

export function SidePanel({ owner, label }: { owner: Owner; label: string }) {
  const { state } = useGame();
  const alive = Object.values(state.pieces).filter((p) => p.owner === owner && !p.dead);
  const dead = Object.values(state.pieces).filter((p) => p.owner === owner && p.dead);

  return (
    <aside className="side">
      <div className="player-name">{label}</div>
      <div className="stats">
        存活 {alive.length} 枚
        {state.phase === 'play' && <span> · 会长 {alive.some((p) => p.type === 'chairman') ? '在场' : '已阵亡'}</span>}
      </div>
      <div className="grave">
        {dead.map((p) => (
          <span key={p.id} className="tomb">
            {PIECE_DEFS[p.type].short}
          </span>
        ))}
      </div>
    </aside>
  );
}
