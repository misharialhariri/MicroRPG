export const HERO_CLASSES = {
  warrior: {
    name: 'Warrior',
    emoji: '⚔️',
    colorKey: 'warrior',
    hp: 120, mp: 20,
    attack: 15, defense: 12, speed: 8, magic: 3,
    ability: {
      name: 'Shield Bash',
      description: 'Stuns enemy for 1 turn',
      mpCost: 10,
    },
    passive: {
      name: 'Iron Hide',
      description: 'Take 20% less physical damage',
    },
    lore: 'Forged in the crucible of endless war, the Warrior is an unbreakable bulwark against the darkness.',
  },
  rogue: {
    name: 'Rogue',
    emoji: '🗡️',
    colorKey: 'rogue',
    hp: 80, mp: 40,
    attack: 18, defense: 7, speed: 16, magic: 6,
    ability: {
      name: 'Backstab',
      description: 'Deal 2.5× damage to stunned foes',
      mpCost: 15,
    },
    passive: {
      name: 'Shadow Step',
      description: '25% critical hit chance (2× damage)',
    },
    lore: 'A phantom born from shadow — the Rogue strikes before the enemy even knows death has arrived.',
  },
  mage: {
    name: 'Mage',
    emoji: '🔮',
    colorKey: 'mage',
    hp: 60, mp: 100,
    attack: 8, defense: 5, speed: 10, magic: 20,
    ability: {
      name: 'Fireball',
      description: 'Magic burst ignoring 50% defense',
      mpCost: 25,
    },
    passive: {
      name: 'Arcane Mastery',
      description: 'Spells pierce 50% of enemy defense',
    },
    lore: 'The Mage has gazed into the void and returned wielding its power — though the void gazed back.',
  },
};

export const ENEMY_XP = { standard: 80, boss: 300 };
export const ENEMY_GOLD = { standardMin: 20, standardMax: 50, bossMin: 150, bossMax: 300 };

export const STARTING_INVENTORY = [
  { id: 'health_potion', name: 'Health Potion', type: 'potion', emoji: '🧪', effect: 'Restore 40 HP', statBoost: { stat: 'hp', amount: 40 } },
];

export const MAX_INVENTORY = 5;

export const OUTCOME_TYPES = {
  combat: { icon: '⚔️', label: 'Combat', color: '#E94560' },
  treasure: { icon: '💎', label: 'Treasure', color: '#F5A623' },
  trap: { icon: '🕸️', label: 'Trap', color: '#FF9800' },
  rest: { icon: '🔥', label: 'Rest', color: '#4CAF50' },
  boss: { icon: '💀', label: 'Boss', color: '#9C27B0' },
};

export const SERVER_URL = 'http://localhost:3000';
