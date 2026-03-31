export const XP_THRESHOLDS = [100, 250, 500, 900];
export const MAX_LEVEL = 5;
export const LEVEL_UP_BONUSES = { hp: 15, mp: 10, attack: 3, defense: 2 };

export function rollD20() {
  return Math.floor(Math.random() * 20) + 1;
}

export function rollRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateDamage(roll, attack, defense, options = {}) {
  const { isCrit = false, isMage = false, isSpecial = false } = options;
  const effectiveDefense = isMage ? defense * 0.5 : defense;
  let raw = Math.max(1, (roll + attack - effectiveDefense) * 1.2);
  if (isCrit) raw *= 2;
  if (isSpecial) raw *= 1.5;
  return Math.round(raw);
}

export function applyWarriorPassive(damage) {
  return Math.round(damage * 0.8);
}

export function rogueBackstab(baseAttack, defense) {
  const roll = rollD20();
  const base = Math.max(1, (roll + baseAttack - defense) * 1.2);
  return Math.round(base * 2.5);
}

export function checkCritical(heroClass) {
  if (heroClass === 'rogue') return Math.random() < 0.25;
  return false;
}

export function fleeChance(heroSpeed, enemySpeed) {
  return heroSpeed / (heroSpeed + enemySpeed) > Math.random();
}

export function getXpThreshold(level) {
  if (level >= MAX_LEVEL) return Infinity;
  return XP_THRESHOLDS[level - 1];
}

export function applyXpGain(hero, xpAmount) {
  let { xp, level, hp, maxHp, mp, maxMp, attack, defense } = hero;
  xp += xpAmount;
  let leveledUp = false;

  while (level < MAX_LEVEL && xp >= getXpThreshold(level)) {
    level++;
    maxHp += LEVEL_UP_BONUSES.hp;
    hp = Math.min(hp + LEVEL_UP_BONUSES.hp, maxHp);
    maxMp += LEVEL_UP_BONUSES.mp;
    mp = Math.min(mp + LEVEL_UP_BONUSES.mp, maxMp);
    attack += LEVEL_UP_BONUSES.attack;
    defense += LEVEL_UP_BONUSES.defense;
    leveledUp = true;
  }

  return { xp, level, hp, maxHp, mp, maxMp, attack, defense, leveledUp };
}

export function getGoldReward(isBoss) {
  if (isBoss) return rollRange(150, 300);
  return rollRange(20, 50);
}

export function dodgeCheck(heroSpeed) {
  return rollD20() + heroSpeed >= 12;
}
