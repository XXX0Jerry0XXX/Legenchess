import { ROWS, COLS, isPrepCell } from '../game/constants';
import {
  getAttackCells,
  getMageSkillCells,
  getMoveCells,
  getWarriorSkillCells,
  pieceCell,
} from '../game/ranges';
import { useGame } from '../state/GameProvider';
import type { Cell } from '../game/types';
import { Piece } from './Piece';

function sameCell(a: Cell, b: Cell): boolean {
  return a.r === b.r && a.c === b.c;
}

export function Board() {
  const { state, dispatch } = useGame();
  const selected = state.selectedId ? state.pieces[state.selectedId] : null;
  const selectedCell = selected ? pieceCell(state, selected.id) : null;

  const moveCells = selected && state.actionMode === 'move' ? getMoveCells(state, selected.id) : [];
  const attackCells =
    selected && (state.actionMode === 'attack' || state.actionMode === 'assassinAttack')
      ? getAttackCells(state, selected.id)
      : [];
  const warriorCells = selected && state.actionMode === 'warrior' ? getWarriorSkillCells(state, selected.id) : [];
  const mageCells = selected && state.actionMode === 'mage' ? getMageSkillCells(state, selected.id) : [];

  const isHighlight = (r: number, c: number): boolean => {
    if (state.phase === 'setup') {
      return (
        state.selectedSetupType !== null &&
        isPrepCell(state.setupOwner, r) &&
        state.board[r][c] === null
      );
    }
    if (!selected) return false;
    const cell = { r, c };
    if (state.actionMode === 'move') return moveCells.some((x) => sameCell(x, cell));
    if (state.actionMode === 'attack' || state.actionMode === 'assassinAttack')
      return attackCells.some((x) => sameCell(x, cell));
    if (state.actionMode === 'warrior') return warriorCells.some((x) => sameCell(x, cell));
    if (state.actionMode === 'mage') return mageCells.some((x) => sameCell(x, cell));
    return false;
  };

  const isTarget = (r: number, c: number): boolean => {
    const id = state.board[r][c];
    if (!id) return false;
    return state.mageTargets.includes(id);
  };

  const handleCell = (r: number, c: number) => {
    if (state.phase === 'setup') {
      const id = state.board[r][c];
      if (id && state.pieces[id].owner === state.setupOwner) {
        dispatch({ type: 'UNDO_SETUP', r, c });
      } else if (state.selectedSetupType && state.board[r][c] === null && isPrepCell(state.setupOwner, r)) {
        dispatch({ type: 'PLACE_SETUP', r, c });
      }
      return;
    }

    if (state.phase !== 'play') return;

    const id = state.board[r][c];
    if (id && state.pieces[id].owner === state.currentPlayer && !state.pieces[id].dead) {
      dispatch({ type: 'SELECT_PIECE', id });
      return;
    }

    if (selected) {
      if (state.actionMode === 'move') {
        if (isHighlight(r, c)) dispatch({ type: 'MOVE', r, c });
      } else if (state.actionMode === 'attack') {
        if (id && isHighlight(r, c)) dispatch({ type: 'ATTACK', targetId: id });
      } else if (state.actionMode === 'assassinAttack') {
        if (id && isHighlight(r, c)) dispatch({ type: 'ASSASSIN_ATTACK', targetId: id });
      } else if (state.actionMode === 'warrior') {
        if (id && isHighlight(r, c)) dispatch({ type: 'WARRIOR', targetId: id });
      } else if (state.actionMode === 'mage') {
        if (id && isHighlight(r, c)) dispatch({ type: 'TOGGLE_MAGE', id });
      } else if (state.actionMode === 'revive') {
        if (isPrepCell(state.currentPlayer, r) && state.board[r][c] === null) {
          dispatch({ type: 'PLACE_REVIVE', r, c });
        }
      } else {
        dispatch({ type: 'SELECT_PIECE', id: null });
      }
    }
  };

  const cells = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const id = state.board[r][c];
      const piece =
        id && (state.phase !== 'setup' || state.pieces[id].owner === state.setupOwner)
          ? state.pieces[id]
          : null;
      const classes = ['cell'];
      if (r <= 2) classes.push('prepa');
      else if (r >= 7) classes.push('prepb');
      else classes.push('battle');
      if (selectedCell && sameCell({ r, c }, selectedCell)) classes.push('selected');
      if (isHighlight(r, c)) classes.push('highlight');
      if (isTarget(r, c)) classes.push('pending');
      if (
        state.phase === 'play' &&
        selected &&
        ((state.actionMode === 'attack' && isHighlight(r, c)) ||
          (state.actionMode === 'assassinAttack' && isHighlight(r, c)) ||
          (state.actionMode === 'warrior' && isHighlight(r, c)) ||
          (state.actionMode === 'mage' && isHighlight(r, c)))
      ) {
        classes.push('target');
      }
      cells.push(
        <div key={`${r}-${c}`} className={classes.join(' ')} onClick={() => handleCell(r, c)}>
          {piece && <Piece piece={piece} />}
        </div>,
      );
    }
  }

  return <div className="board">{cells}</div>;
}
