export type Owner = 0 | 1;
export type SkillId = string;

export type PieceType = string;

export type MoveKind = 'rect1' | 'rect2' | 'cross2';
export type AttackKind = 'rect1' | 'cross2';
export type SkillKind =
  | 'promote'
  | 'warrior'
  | 'mage'
  | 'assassin'
  | 'priest'
  | 'chairman';

export interface PieceDef {
  type: PieceType;
  name: string;
  short: string;
  atk: number;
  hp: number;
  move: MoveKind;
  attack: AttackKind;
  skill: SkillId;
  description?: string;
  passive?: {
    onTurnStart?: (state: GameState, pieceId: string) => GameState;
    onKill?: (state: GameState, pieceId: string, targetId: string) => GameState;
  };
}

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  cost: number;
  targetMode: 'none' | 'single' | 'multi';
  maxTargets?: number;
  getTargetCells(state: GameState, pieceId: string): Cell[];
  canUse(state: GameState, pieceId: string): boolean;
  getActions(state: GameState, pieceId: string, targetIds: string[]): GameAction[];
}

export type GameAction =
  | { type: 'dealDamage'; attackerId: string; targetId: string; amount: number; counterImmune?: boolean }
  | { type: 'heal'; pieceId: string; amount: number }
  | { type: 'move'; pieceId: string; to: Cell }
  | { type: 'revive'; pieceId: string; to: Cell }
  | { type: 'endTurn' };

export interface Piece {
  id: string;
  owner: Owner;
  type: PieceType;
  hp: number;
  maxHp: number;
  atk: number;
  freeMove: boolean;
  freeAttack: boolean;
  dead: boolean;
}

export type Cell = { r: number; c: number };

export type Phase = 'start' | 'setup' | 'observe' | 'play' | 'finished';
export type GameMode = 'local' | 'ai';

export type ActionMode =
  | null
  | 'move'
  | 'attack'
  | 'warrior'
  | 'mage'
  | 'assassinMove'
  | 'assassinAttack'
  | 'skill'
  | 'revive';

export type Winner = Owner | 'draw' | null;

export interface GameState {
  phase: Phase;
  mode: GameMode;
  aiPlayer: Owner | null;
  firstPlayer: Owner;
  currentPlayer: Owner;
  setupOwner: Owner;
  turn: number;
  ap: number;
  board: (string | null)[][];
  pieces: Record<string, Piece>;
  setupTray: Record<Owner, Record<PieceType, number>>;
  selectedId: string | null;
  selectedSetupType: PieceType | null;
  actionMode: ActionMode;
  mageTargets: string[];
  skillTargets: string[];
  lastTurnDeaths: string[];
  previousTurnDeaths: string[];
  deadThisTurn: string[];
  pendingPromotion: string | null;
  pendingRevive: string | null;
  winner: Winner;
  times: Record<Owner, number>;
  observationRemaining: number;
  clockRunning: boolean;
  turnStarted: boolean;
}
