export type Owner = 0 | 1;

export type PieceType =
  | 'novice'
  | 'warrior'
  | 'mage'
  | 'assassin'
  | 'priest'
  | 'chairman';

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
  name: string;
  short: string;
  atk: number;
  hp: number;
  move: MoveKind;
  attack: AttackKind;
  skill: SkillKind;
}

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
  lastTurnDeaths: string[];
  deadThisTurn: string[];
  pendingPromotion: string | null;
  pendingRevive: string | null;
  winner: Winner;
  times: Record<Owner, number>;
  observationRemaining: number;
  clockRunning: boolean;
  turnStarted: boolean;
}
