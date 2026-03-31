import { useState, useCallback } from 'react';
import { useGame } from './useGame';
import {
  rollD20, calculateDamage, checkCritical, fleeChance,
  applyWarriorPassive, rogueBackstab, getGoldReward,
} from '../lib/gameEngine';
import { ENEMY_XP } from '../lib/constants';
import { narrateCombat } from '../lib/api';

export function useCombat(enemy, isBoss = false) {
  const game = useGame();
  const { hero, enemyStunned, setEnemyStunned, gainXP, gainGold, damageHero } = game;

  const [enemyHp, setEnemyHp] = useState(enemy?.hp ?? 0);
  const [turnCount, setTurnCount] = useState(0);
  const [combatLog, setCombatLog] = useState([]);
  const [phase, setPhase] = useState('player_turn'); // player_turn | animating | enemy_turn | ended
  const [lastRoll, setLastRoll] = useState(null);
  const [isCrit, setIsCrit] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [combatResult, setCombatResult] = useState(null); // 'win' | 'lose' | 'fled'

  const addLog = (text) =>
    setCombatLog((prev) => [...prev.slice(-5), text]);

  const getNarration = async (action, damage, heroHp, eHp) => {
    try {
      const narration = await narrateCombat({
        action,
        attacker: hero.name,
        defender: enemy?.name ?? 'enemy',
        damage,
        hero_hp: heroHp,
        enemy_hp: eHp,
        hero_class: hero.classKey,
      });
      return narration;
    } catch {
      return null;
    }
  };

  const endCombat = useCallback(
    (result, finalHeroHp) => {
      setPhase('ended');
      setCombatResult(result);
      if (result === 'win') {
        const xp = isBoss ? ENEMY_XP.boss : ENEMY_XP.standard;
        const gold = getGoldReward(isBoss);
        gainXP(xp);
        gainGold(gold);
      }
    },
    [gainXP, gainGold, isBoss]
  );

  const runEnemyTurn = useCallback(
    async (currentHeroHp) => {
      setPhase('enemy_turn');
      const thisTurn = turnCount + 1;
      setTurnCount(thisTurn);

      if (enemyStunned) {
        setEnemyStunned(false);
        addLog(`${enemy.name} is stunned and loses their turn!`);
        setPhase('player_turn');
        return;
      }

      const isSpecialTurn = isBoss ? thisTurn % 2 === 0 : thisTurn % 3 === 0;
      const roll = rollD20();
      const baseDamage = calculateDamage(roll, enemy.attack, hero.defense, {
        isSpecial: isSpecialTurn,
      });
      const finalDamage =
        hero.classKey === 'warrior' ? applyWarriorPassive(baseDamage) : baseDamage;

      const newHeroHp = Math.max(0, currentHeroHp - finalDamage);
      damageHero(finalDamage);

      const action = isSpecialTurn
        ? `${enemy.special_move ?? 'Special Move'}`
        : 'attacks';
      const narration = await getNarration(action, finalDamage, newHeroHp, enemyHp);
      addLog(narration ?? `${enemy.name} ${action} for ${finalDamage} damage!`);

      if (newHeroHp <= 0) {
        endCombat('lose', 0);
        return;
      }

      setPhase('player_turn');
    },
    [enemyHp, enemyStunned, enemy, hero, turnCount, isBoss, damageHero, setEnemyStunned]
  );

  const handleAttack = useCallback(async () => {
    if (phase !== 'player_turn') return;
    setPhase('animating');
    setIsRolling(true);

    await new Promise((r) => setTimeout(r, 1400));
    setIsRolling(false);

    const roll = rollD20();
    setLastRoll(roll);
    const crit = roll === 20 || checkCritical(hero.classKey);
    setIsCrit(crit);

    const dmg = calculateDamage(roll, hero.attack, enemy.defense, {
      isCrit: crit,
      isMage: hero.classKey === 'mage',
    });

    const newEnemyHp = Math.max(0, enemyHp - dmg);
    setEnemyHp(newEnemyHp);

    const narration = await getNarration('attacks', dmg, hero.hp, newEnemyHp);
    addLog(narration ?? `You attack for ${dmg}${crit ? ' (CRITICAL!)' : ''} damage!`);

    if (newEnemyHp <= 0) {
      endCombat('win', hero.hp);
      return;
    }
    await runEnemyTurn(hero.hp);
  }, [phase, hero, enemy, enemyHp, runEnemyTurn, endCombat]);

  const handleAbility = useCallback(async () => {
    if (phase !== 'player_turn') return;
    const cls = hero.classKey;
    const mpCosts = { warrior: 10, rogue: 15, mage: 25 };
    const cost = mpCosts[cls];
    if (hero.mp < cost) return;

    setPhase('animating');
    game.updateHero({ mp: hero.mp - cost });
    setIsRolling(true);
    await new Promise((r) => setTimeout(r, 1400));
    setIsRolling(false);

    let dmg = 0;
    let actionLabel = '';

    if (cls === 'warrior') {
      setEnemyStunned(true);
      actionLabel = 'Shield Bash';
      addLog(`You bash the enemy — they are STUNNED!`);
    } else if (cls === 'rogue') {
      if (enemyStunned) {
        dmg = rogueBackstab(hero.attack, enemy.defense);
        actionLabel = 'Backstab';
      } else {
        dmg = calculateDamage(rollD20(), hero.attack, enemy.defense);
        actionLabel = 'Backstab (no stun)';
      }
    } else if (cls === 'mage') {
      const roll = rollD20();
      dmg = calculateDamage(roll, hero.magic, enemy.defense, { isMage: true });
      actionLabel = 'Fireball';
    }

    const newEnemyHp = Math.max(0, enemyHp - dmg);
    if (dmg > 0) setEnemyHp(newEnemyHp);
    setLastRoll(null);

    if (dmg > 0) {
      const narration = await getNarration(actionLabel, dmg, hero.hp, newEnemyHp);
      addLog(narration ?? `${actionLabel} deals ${dmg} damage!`);
      if (newEnemyHp <= 0) { endCombat('win', hero.hp); return; }
    }

    await runEnemyTurn(hero.hp);
  }, [phase, hero, enemy, enemyHp, enemyStunned, runEnemyTurn, endCombat, game, setEnemyStunned]);

  const handleUsePotion = useCallback(async () => {
    if (phase !== 'player_turn') return;
    const idx = game.inventory.findIndex((i) => i.type === 'potion');
    if (idx === -1) return;
    const item = game.inventory[idx];
    game.removeItem(idx);
    const restored = game.healHero(item.statBoost.amount);
    addLog(`You drink a ${item.name}, restoring ${item.statBoost.amount} HP.`);
    await runEnemyTurn(restored);
  }, [phase, game, runEnemyTurn]);

  const handleFlee = useCallback(async () => {
    if (phase !== 'player_turn') return;
    setPhase('animating');
    await new Promise((r) => setTimeout(r, 800));
    if (fleeChance(hero.speed, enemy?.attack ?? 5)) {
      addLog('You fled from battle!');
      setCombatResult('fled');
      setPhase('ended');
    } else {
      addLog('You failed to escape!');
      await runEnemyTurn(hero.hp);
    }
  }, [phase, hero, enemy, runEnemyTurn]);

  return {
    enemyHp,
    enemyMaxHp: enemy?.hp ?? 1,
    combatLog,
    phase,
    lastRoll,
    isCrit,
    isRolling,
    combatResult,
    handleAttack,
    handleAbility,
    handleUsePotion,
    handleFlee,
  };
}
