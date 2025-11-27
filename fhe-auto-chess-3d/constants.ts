import { HeroDef, ItemDef } from './types';

export const TEAM_SIZE = 4;
export const MAX_ROUNDS = 8;

// Generate 16 Heroes
export const HEROES: HeroDef[] = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  name: `Unit-${i < 10 ? '0' + i : i}`,
  color: `hsl(${i * 22}, 70%, 50%)`, // Distinct colors
  baseStats: {
    hp: 100 + (i % 4) * 20, // Varying HP
    atk: 10 + (i % 3) * 5,
    def: 2 + (i % 2) * 2,
  },
}));

// Generate 32 Items
export const ITEMS: ItemDef[] = Array.from({ length: 32 }, (_, i) => ({
  id: i,
  name: `Module-${i}`,
  bonusStats: {
    hp: (i % 4 === 0) ? 50 : 0,
    atk: (i % 4 === 1) ? 15 : 0,
    def: (i % 4 === 2) ? 10 : 0,
    // Mixed item
    ...(i % 4 === 3 ? { hp: 20, atk: 5, def: 2 } : {})
  } as any
}));

export const DEFAULT_LOADOUT_SLOT = { heroId: null, itemId: null };
