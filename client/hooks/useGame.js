import { useGameContext } from '../lib/GameContext';
import { HERO_CLASSES, STARTING_INVENTORY } from '../lib/constants';
import { applyXpGain, getGoldReward } from '../lib/gameEngine';

export function useGame() {
  const { state, dispatch } = useGameContext();

  function startGame(heroName, heroClassKey) {
    const cls = HERO_CLASSES[heroClassKey];
    const hero = {
      name: heroName || 'Hero',
      classKey: heroClassKey,
      className: cls.name,
      hp: cls.hp,
      maxHp: cls.hp,
      mp: cls.mp,
      maxMp: cls.mp,
      attack: cls.attack,
      defense: cls.defense,
      speed: cls.speed,
      magic: cls.magic,
      level: 1,
      xp: 0,
      gold: 0,
    };
    dispatch({ type: 'START_GAME', hero, inventory: [...STARTING_INVENTORY] });
  }

  function setDungeon(dungeon) {
    dispatch({ type: 'SET_DUNGEON', dungeon });
  }

  function updateHero(updates) {
    dispatch({ type: 'UPDATE_HERO', updates });
  }

  function healHero(amount) {
    const { hero } = state;
    const newHp = Math.min(hero.hp + amount, hero.maxHp);
    dispatch({ type: 'UPDATE_HERO', updates: { hp: newHp } });
    return newHp;
  }

  function restoreMP(amount) {
    const { hero } = state;
    const newMp = Math.min(hero.mp + amount, hero.maxMp);
    dispatch({ type: 'UPDATE_HERO', updates: { mp: newMp } });
    return newMp;
  }

  function damageHero(amount) {
    const { hero } = state;
    const newHp = Math.max(0, hero.hp - amount);
    dispatch({ type: 'UPDATE_HERO', updates: { hp: newHp } });
    return newHp;
  }

  function gainXP(amount) {
    const { hero } = state;
    const result = applyXpGain(hero, amount);
    dispatch({ type: 'UPDATE_HERO', updates: result });
    return result.leveledUp;
  }

  function gainGold(amount) {
    const { hero } = state;
    dispatch({ type: 'UPDATE_HERO', updates: { gold: hero.gold + amount } });
  }

  function addItem(item) {
    dispatch({ type: 'ADD_ITEM', item });
  }

  function removeItem(index) {
    dispatch({ type: 'REMOVE_ITEM', index });
  }

  function advanceRoom() {
    dispatch({ type: 'ADVANCE_ROOM' });
  }

  function setEnemyStunned(value) {
    dispatch({ type: 'SET_ENEMY_STUNNED', value });
  }

  function setLastEnemy(enemy) {
    dispatch({ type: 'SET_LAST_ENEMY', enemy });
  }

  function triggerGameOver(cause) {
    dispatch({ type: 'GAME_OVER', cause });
  }

  function triggerVictory() {
    dispatch({ type: 'VICTORY' });
  }

  function resetGame() {
    dispatch({ type: 'RESET' });
  }

  const currentRoom =
    state.dungeon?.rooms?.[state.currentRoomIndex] ?? null;

  const isLastRoom =
    state.dungeon
      ? state.currentRoomIndex >= state.dungeon.rooms.length - 1
      : false;

  return {
    state,
    hero: state.hero,
    dungeon: state.dungeon,
    currentRoom,
    currentRoomIndex: state.currentRoomIndex,
    inventory: state.inventory,
    enemyStunned: state.enemyStunned,
    isLastRoom,
    startGame,
    setDungeon,
    updateHero,
    healHero,
    restoreMP,
    damageHero,
    gainXP,
    gainGold,
    addItem,
    removeItem,
    advanceRoom,
    setEnemyStunned,
    setLastEnemy,
    triggerGameOver,
    triggerVictory,
    resetGame,
  };
}
