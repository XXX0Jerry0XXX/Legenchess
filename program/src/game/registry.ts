import { PIECE_DEFS } from './constants';
import { BUILTIN_SKILLS } from './skills/builtin';
import type { PieceDef, PieceType, SkillDefinition, SkillId } from './types';

const pieceRegistry = new Map<string, PieceDef>(
  Object.entries(PIECE_DEFS) as [PieceType, PieceDef][],
);

const skillRegistry = new Map<string, SkillDefinition>(
  BUILTIN_SKILLS.map((skill) => [skill.id, skill]),
);

export function registerPiece(def: PieceDef, options?: { force?: boolean }): PieceDef | null {
  if (!def?.type || !def?.name) return null;
  if (pieceRegistry.has(def.type) && !options?.force) {
    throw new Error(`Piece type "${def.type}" is already registered.`);
  }
  pieceRegistry.set(def.type, def);
  return def;
}

export function registerSkill(def: SkillDefinition, options?: { force?: boolean }): SkillDefinition | null {
  if (!def?.id || !def?.name) return null;
  if (skillRegistry.has(def.id) && !options?.force) {
    throw new Error(`Skill id "${def.id}" is already registered.`);
  }
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

export function resetRegistries(): void {
  pieceRegistry.clear();
  skillRegistry.clear();
  for (const [type, def] of Object.entries(PIECE_DEFS) as [PieceType, PieceDef][]) {
    pieceRegistry.set(type, def);
  }
  for (const skill of BUILTIN_SKILLS) {
    skillRegistry.set(skill.id, skill);
  }
}
