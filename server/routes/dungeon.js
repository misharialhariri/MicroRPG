const { Router } = require('express');
const router = Router();

const MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function callAnthropic(system, userContent, maxTokens = 2000) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

function parseJSON(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found in model response');
    return JSON.parse(match[0]);
  }
}

router.post('/generate', async (req, res) => {
  const { hero_class, hero_stats, difficulty = 2 } = req.body;
  if (!hero_class) return res.status(400).json({ error: 'hero_class required' });

  const difficultyLabel = ['Easy', 'Normal', 'Hard'][difficulty - 1] ?? 'Normal';

  const system = `You are a dark fantasy dungeon master generating a JSON dungeon for a ${hero_class} hero on ${difficultyLabel} difficulty.
Return ONLY valid JSON — no markdown, no explanation, no code fences.

The JSON must exactly match this schema:
{
  "dungeon_name": "string",
  "dungeon_lore": "string (2 sentences of dark atmosphere)",
  "rooms": [
    {
      "id": 1,
      "title": "string (short room name)",
      "description": "string (3-4 vivid sentences)",
      "outcome_type": "combat" | "treasure" | "trap" | "rest" | "boss",
      "choices": [
        { "text": "string", "leads_to": "fight" | "sneak" | "loot" | "retreat" },
        { "text": "string", "leads_to": "fight" | "sneak" | "loot" | "retreat" }
      ],
      "enemy": { "name": "string", "hp": number, "attack": number, "defense": number, "special_move": "string", "lore": "string" },
      "treasure": { "item_name": "string", "item_type": "weapon"|"armor"|"potion"|"relic", "effect": "string", "stat_boost": { "stat": "string", "amount": number } },
      "trap": { "name": "string", "description": "string", "damage": number, "can_dodge": boolean },
      "rest_bonus": { "hp_restored": number, "mp_restored": number, "flavor_text": "string" }
    }
  ],
  "boss_room": {
    "enemy": { "name": "string", "hp": number, "attack": number, "defense": number, "special_move": "string", "lore": "string" },
    "reward": { "gold": number, "legendary_item": "string" }
  }
}

Rules:
- Exactly 5 rooms (ids 1-5). Room 5 must be a boss room (outcome_type: "boss").
- Rooms 1-2: easier (enemy hp 15-30, trap damage 8-15)
- Rooms 3-4: medium (enemy hp 25-45, trap damage 12-22)
- Room 5 boss: hp 60-90, attack 12-18
- Distribution across rooms 1-4: at least 1 combat, 1 treasure, 1 trap, 1 rest
- Include only relevant fields per outcome_type (omit enemy for non-combat rooms, omit treasure for non-treasure rooms, etc.)
- Dark fantasy tone: crypts, demons, corrupted knights, ancient spirits, eldritch horrors`;

  const userMsg = `Generate a dungeon for a ${hero_class} with stats: ${JSON.stringify(hero_stats)}. Difficulty: ${difficultyLabel}.`;

  try {
    const raw = await callAnthropic(system, userMsg, 2200);
    const dungeon = parseJSON(raw);
    res.json(dungeon);
  } catch (err) {
    console.error('[dungeon/generate]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
