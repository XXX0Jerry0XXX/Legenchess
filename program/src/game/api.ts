import {
  checkWinner,
  computeAp,
  createPiece,
  emptyBoard,
  opponent,
  playerLabel,
} from './engine';
import {
  getPiece,
  getSkill,
  listPieces,
  listSkills,
  registerPiece,
  registerSkill,
} from './registry';
import { getAttackCells, getMoveCells, getMageSkillCells, getWarriorSkillCells } from './ranges';
import { reducer } from './reducer';
import { createInitialState } from './reducer';

export const Legenchess = {
  createInitialState,
  createPiece,
  emptyBoard,
  dispatch: reducer,
  registerPiece,
  registerSkill,
  getPiece,
  getSkill,
  listPieces,
  listSkills,
  query: {
    moveCells: getMoveCells,
    attackCells: getAttackCells,
    warriorSkillCells: getWarriorSkillCells,
    mageSkillCells: getMageSkillCells,
    checkWinner,
    computeAp,
  },
  helpers: {
    playerLabel,
    opponent,
  },
};
