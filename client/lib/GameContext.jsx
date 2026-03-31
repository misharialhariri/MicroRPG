import React, { createContext, useContext, useReducer } from 'react';

const initialState = {
  hero: null,
  dungeon: null,
  currentRoomIndex: 0,
  inventory: [],
  enemyStunned: false,
  lastCombatEnemy: null,
  isOnline: true,
  gameOver: false,
  victory: false,
  causeOfDeath: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return { ...initialState, hero: action.hero, inventory: action.inventory };

    case 'SET_DUNGEON':
      return { ...state, dungeon: action.dungeon };

    case 'UPDATE_HERO':
      return { ...state, hero: { ...state.hero, ...action.updates } };

    case 'ADVANCE_ROOM':
      return { ...state, currentRoomIndex: state.currentRoomIndex + 1, enemyStunned: false };

    case 'ADD_ITEM':
      if (state.inventory.length >= 5) return state;
      return { ...state, inventory: [...state.inventory, action.item] };

    case 'REMOVE_ITEM':
      return { ...state, inventory: state.inventory.filter((_, i) => i !== action.index) };

    case 'SET_ENEMY_STUNNED':
      return { ...state, enemyStunned: action.value };

    case 'SET_LAST_ENEMY':
      return { ...state, lastCombatEnemy: action.enemy };

    case 'SET_ONLINE':
      return { ...state, isOnline: action.value };

    case 'GAME_OVER':
      return { ...state, gameOver: true, causeOfDeath: action.cause };

    case 'VICTORY':
      return { ...state, victory: true };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGameContext must be used inside GameProvider');
  return ctx;
}
