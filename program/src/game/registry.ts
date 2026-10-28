import { PIECE_DEFS } from './constants';
import { BUILTIN_SKILLS } from './skills/builtin';
import type { PieceDef, PieceType, SkillDefinition, SkillId } from './types';

const pieceRegistry = new Map<string, PieceDef>(
  Object.entries(PIECE_DEFS) as [PieceType, PieceDef][],
);

const skillRegistry = new Map<string, SkillDefinition>(
  BUILTIN_SKILLS.map((skill) => [skill.id, skill]),
);

export function registerPiece(def: PieceDef): PieceDef {
  pieceRegistry.set(def.type, def);
  return def;
}

export function registerSkill(def: SkillDefinition): SkillDefinition {
  skillRegistry.set(def.id, def);
  return def;
}

export function getPiece(type: PieceType): PieceDef | null {
  return pieceRegistry.get(type) ?? null;
}

export function getSkill(id: SkillId): SkillDefinition | null {
  return skillRegistry.get(id) ?? null;
}

export function listPieces(): PieceDef[] {
  return [...pieceRegistry.values()];
}

export function listSkills(): SkillDefinition[] {
  return [...skillRegistry.values()];
}
