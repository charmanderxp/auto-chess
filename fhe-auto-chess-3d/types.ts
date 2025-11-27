export enum GamePhase {
  LOBBY = 'LOBBY',
  MATCH_LOBBY = 'MATCH_LOBBY', // Waiting for opponent or ready to start
  EDITING = 'EDITING',
  SUBMITTED = 'SUBMITTED',
  RESOLVING = 'RESOLVING', // Simulating FHE computation
  REPLAY = 'REPLAY',
  RESULT = 'RESULT'
}

export interface Stats {
  hp: number;
  atk: number;
  def: number;
}

export interface HeroDef {
  id: number;
  name: string;
  color: string;
  baseStats: Stats;
}

export interface ItemDef {
  id: number;
  name: string;
  bonusStats: Stats;
}

export interface LoadoutSlot {
  heroId: number | null;
  itemId: number | null;
}

export type Loadout = [LoadoutSlot, LoadoutSlot, LoadoutSlot, LoadoutSlot];

// 3D / Simulation Types
export interface CombatUnit {
  owner: 0 | 1; // 0 = Player (You), 1 = Opponent
  slotIndex: number;
  maxHp: number;
  currentHp: number;
  atk: number;
  def: number;
  heroId: number;
  itemId: number;
  isDead: boolean;
}

export type CombatActionType = 'WAIT' | 'ATTACK' | 'HIT' | 'DIE';

export interface CombatAction {
  round: number;
  actorOwner: 0 | 1;
  actorSlot: number;
  targetOwner: 0 | 1;
  targetSlot: number;
  type: CombatActionType;
  damage?: number;
  hpRemaining?: number;
}

export interface BattleResult {
  winner: 0 | 1 | -1; // -1 draw
  margin: number;
  log: CombatAction[];
  finalUnits: CombatUnit[];
  initialUnits: CombatUnit[];
  // Optional source of the result: 'onchain' = official on-chain result, 'demo' = local mock
  source?: 'onchain' | 'demo';
}
