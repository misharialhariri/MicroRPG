import axios from 'axios';
import { SERVER_URL } from './constants';

const client = axios.create({
  baseURL: SERVER_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export async function generateDungeon(heroClass, heroStats, difficulty = 2) {
  const res = await client.post('/api/dungeon/generate', {
    hero_class: heroClass,
    hero_stats: heroStats,
    difficulty,
  });
  return res.data;
}

export async function narrateCombat(payload) {
  const res = await client.post('/api/combat/narrate', payload);
  return res.data.narration;
}

export async function narrateRoomOutcome(roomType, outcomeDescription, heroStats) {
  const res = await client.post('/api/room/outcome', {
    room_type: roomType,
    outcome_description: outcomeDescription,
    hero_stats: heroStats,
  });
  return res.data.narration;
}

export async function checkServerHealth() {
  try {
    await client.get('/health', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
