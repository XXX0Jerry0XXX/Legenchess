import { PIECE_DEFS } from '../game/constants';
import type { Piece as PieceType } from '../game/types';

export function Piece({ piece }: { piece: PieceType }) {
  const def = PIECE_DEFS[piece.type];
  return (
    <div className={`piece ${piece.owner === 0 ? 'a' : 'b'}`}>
      <span className="stat atk">{piece.atk}</span>
      {def.short}
      <span className="stat hp">{piece.hp}</span>
      {(piece.freeMove || piece.freeAttack) && <span className="free">+</span>}
    </div>
  );
}
