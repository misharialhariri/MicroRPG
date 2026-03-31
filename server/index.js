const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function callAnthropic(messages, systemPrompt, maxTokens = 1024) {
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// POST /generate-dungeon
// Body: { heroClass: 'warrior' | 'rogue' | 'mage' }
app.post('/generate-dungeon', async (req, res) => {
  const { heroClass } = req.body;
  if (!heroClass) return res.status(400).json({ error: 'heroClass required' });

  const system = `You are a dark fantasy dungeon master. Generate a JSON dungeon for a ${heroClass} hero.
Return ONLY valid JSON, no markdown, no explanation.
Schema:
{
  "dungeon_name": "string",
  "rooms": [
    {
      "description": "string (2-3 sentences, atmospheric)",
      "choices": ["string", "string"],
      "outcome_type": "combat" | "treasure" | "trap" | "rest",
      "enemy": { "name": "string", "hp": number, "attack": number }  // only if outcome_type is "combat"
    }
  ]
}
Rules:
- Exactly 5 rooms
- outcome_type distribution: at least 2 combat, 1 treasure, 1 trap, 1 rest
- Enemy hp between 15-40, enemy attack between 3-10
- Choices should feel meaningful and thematic (e.g., "Charge through the shadows" vs "Scout the perimeter")
- Dark fantasy tone: crypts, demons, cursed relics, fallen knights, etc.`;

  try {
    const text = await callAnthropic(
      [{ role: 'user', content: `Generate a dungeon for a ${heroClass}.` }],
      system,
      1500
    );

    let dungeon;
    try {
      dungeon = JSON.parse(text);
    } catch {
      // Try extracting JSON if model wrapped it
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found in response');
      dungeon = JSON.parse(match[0]);
    }

    res.json(dungeon);
  } catch (err) {
    console.error('generate-dungeon error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /narrate-combat
// Body: { heroClass, heroRoll, enemyName, enemyRoll, heroWon }
app.post('/narrate-combat', async (req, res) => {
  const { heroClass, heroRoll, enemyName, enemyRoll, heroWon } = req.body;

  const system = `You are a dark fantasy narrator. Write ONE short sentence (max 20 words) narrating a combat outcome. Be dramatic and vivid. No quotes.`;

  const outcome = heroWon
    ? `The ${heroClass} (rolled ${heroRoll}) defeated the ${enemyName} (rolled ${enemyRoll}).`
    : `The ${heroClass} (rolled ${heroRoll}) was struck by the ${enemyName} (rolled ${enemyRoll}).`;

  try {
    const text = await callAnthropic(
      [{ role: 'user', content: outcome }],
      system,
      80
    );
    res.json({ narration: text.trim() });
  } catch (err) {
    console.error('narrate-combat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MicroRPG server running on port ${PORT}`));
