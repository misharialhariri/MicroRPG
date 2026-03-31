export const COLORS = {
  bg: '#0a0a0f',
  bgCard: '#12121e',
  bgPanel: '#1a1a2e',
  border: '#2a2a4a',
  borderGlow: '#4a3f8a',
  primary: '#c084fc',
  primaryDark: '#7c3aed',
  gold: '#fbbf24',
  goldDark: '#d97706',
  red: '#ef4444',
  redDark: '#991b1b',
  green: '#22c55e',
  blue: '#60a5fa',
  text: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#475569',
  warrior: '#ef4444',
  warriorDark: '#991b1b',
  rogue: '#22c55e',
  rogueDark: '#15803d',
  mage: '#818cf8',
  mageDark: '#4338ca',
  white: '#ffffff',
};

export const FONTS = {
  pixel: 'PressStart2P',
  mono: 'monospace',
};

export const HERO_CLASSES = {
  warrior: {
    name: 'Warrior',
    emoji: '⚔️',
    color: COLORS.warrior,
    colorDark: COLORS.warriorDark,
    stats: { hp: 120, attack: 12, defense: 8 },
    description: 'Unbreakable shield,\nunstoppable blade.',
    flavor: 'High HP · High Defense · Melee Might',
  },
  rogue: {
    name: 'Rogue',
    emoji: '🗡️',
    color: COLORS.rogue,
    colorDark: COLORS.rogueDark,
    stats: { hp: 80, attack: 15, defense: 4 },
    description: 'Strikes from shadow,\nnever seen twice.',
    flavor: 'High Speed · Critical Hits · Evasion',
  },
  mage: {
    name: 'Mage',
    emoji: '🔮',
    color: COLORS.mage,
    colorDark: COLORS.mageDark,
    stats: { hp: 60, attack: 20, defense: 2 },
    description: 'Wields chaos itself\nas a weapon.',
    flavor: 'Max Damage · Area Spells · Fragile',
  },
};

export const SERVER_URL = 'http://localhost:3000';
