import { PIECE_DEFS } from '../game/constants';
import { getPiece } from '../game/registry';
import type { Piece as PieceType } from '../game/types';
import { t } from '../i18n';

export function Piece({ piece }: { piece: PieceType }) {
  const def = getPiece(piece.type) ?? PIECE_DEFS[piece.type];
  return (
    <div className={`piece ${piece.owner === 0 ? 'a' : 'b'}`}>
      <span className="stat atk">{piece.atk}</span>
      {t(def.short)}
      <span className="stat hp">{piece.hp}</span>
      {(piece.freeMove || piece.freeAttack) && <span className="free">+</span>}
    </div>
  );
}
