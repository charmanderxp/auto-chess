import { BattleResult, CombatAction, CombatUnit, Loadout, Stats } from '../types';
import { HEROES, ITEMS, MAX_ROUNDS, TEAM_SIZE } from '../constants';

// Helper to simulate the on-chain lookup (select-chain)
const getHeroStats = (id: number): Stats => HEROES[id]?.baseStats || { hp: 10, atk: 1, def: 0 };
const getItemStats = (id: number): Stats => ITEMS[id]?.bonusStats || { hp: 0, atk: 0, def: 0 };

const createUnit = (owner: 0 | 1, slotIndex: number, heroId: number, itemId: number): CombatUnit => {
  const h = getHeroStats(heroId);
  const i = getItemStats(itemId);
  const maxHp = h.hp + i.hp;
  return {
    owner,
    slotIndex,
    heroId,
    itemId,
    maxHp,
    currentHp: maxHp,
    atk: h.atk + i.atk,
    def: h.def + i.def,
    isDead: false,
  };
};

/**
 * Simulates the "resolve()" function of the Solidity contract.
 * In a real FHE app, this happens on encrypted data.
 * Here we do it in cleartext to generate the "Decrypted Log" for the frontend.
 */
export const simulateMatch = (p1Loadout: Loadout, p2Loadout: Loadout): BattleResult => {
  // 1. Initialize Units
  const p1Units = p1Loadout.map((s, i) => createUnit(0, i, s.heroId || 0, s.itemId || 0));
  const p2Units = p2Loadout.map((s, i) => createUnit(1, i, s.heroId || 0, s.itemId || 0));
  
  // Clone for initial state return
  const initialUnits = JSON.parse(JSON.stringify([...p1Units, ...p2Units]));

  const log: CombatAction[] = [];

  // 2. Simulate Rounds
  for (let r = 0; r < MAX_ROUNDS; r++) {
    // Each slot attacks simultaneously
    for (let i = 0; i < TEAM_SIZE; i++) {
      // P1 attacks P2
      const targetIdxP2 = (i + r) % TEAM_SIZE;
      resolveAttack(r, p1Units[i], p2Units[targetIdxP2], log);

      // P2 attacks P1 (Symmetry)
      const targetIdxP1 = (i + r) % TEAM_SIZE;
      resolveAttack(r, p2Units[i], p1Units[targetIdxP1], log);
    }
  }

  // 3. Calculate Result
  const hp1 = p1Units.reduce((acc, u) => acc + u.currentHp, 0);
  const hp2 = p2Units.reduce((acc, u) => acc + u.currentHp, 0);

  let winner: 0 | 1 | -1 = -1;
  if (hp1 > hp2) winner = 0;
  if (hp2 > hp1) winner = 1;

  return {
    winner,
    margin: Math.abs(hp1 - hp2),
    log,
    initialUnits,
    finalUnits: [...p1Units, ...p2Units],
    source: 'demo',
  };
};

// Helper for single attack resolution
const resolveAttack = (round: number, attacker: CombatUnit, defender: CombatUnit, log: CombatAction[]) => {
  // Dead units don't attack
  if (attacker.isDead) return;

  // Calculate damage
  // Dmg = Max(0, Atk - Def)
  const rawDmg = Math.max(0, attacker.atk - defender.def);
  
  // If defender is already dead, we might still "hit" the corpse or skip. 
  // Spec says "Unit dead when hp == 0". 
  if (defender.isDead) return;

  // Apply Damage
  defender.currentHp = Math.max(0, defender.currentHp - rawDmg);

  // Log Attack
  log.push({
    round,
    actorOwner: attacker.owner,
    actorSlot: attacker.slotIndex,
    targetOwner: defender.owner,
    targetSlot: defender.slotIndex,
    type: 'ATTACK',
  });

  // Log Hit
  log.push({
    round,
    actorOwner: attacker.owner, // Attacker is the source of the hit event logically for visualization
    actorSlot: attacker.slotIndex,
    targetOwner: defender.owner,
    targetSlot: defender.slotIndex,
    type: 'HIT',
    damage: rawDmg,
    hpRemaining: defender.currentHp
  });

  if (defender.currentHp === 0) {
    defender.isDead = true;
    log.push({
      round,
      actorOwner: defender.owner,
      actorSlot: defender.slotIndex,
      targetOwner: attacker.owner, // Irrelevant but keeps structure
      targetSlot: attacker.slotIndex,
      type: 'DIE'
    });
  }
};

// Generate a random loadout for the opponent
export const generateRandomLoadout = (): Loadout => {
  return Array.from({ length: 4 }, () => ({
    heroId: Math.floor(Math.random() * 16),
    itemId: Math.floor(Math.random() * 32)
  })) as Loadout;
};
