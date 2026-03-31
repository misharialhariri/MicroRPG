const { Router } = require('express');
const router = Router();

const MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function callAnthropic(system, content, maxTokens = 160) {
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
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  return data.content[0].text.trim();
}

// POST /api/room/outcome
router.post('/outcome', async (req, res) => {
  const { room_type, outcome_description, hero_stats } = req.body;

  const system = `You are a dark fantasy narrator.
Write 1-2 sentences (max 40 words total) narrating what happened in a dungeon room event.
Atmospheric and immersive. No emojis. No quotation marks.`;

  const prompt = `Room type: ${room_type}. Event: ${outcome_description}. Hero remaining HP: ${hero_stats?.hp ?? '?'}.`;

  try {
    const narration = await callAnthropic(system, prompt, 120);
    res.json({ narration });
  } catch (err) {
    console.error('[room/outcome]', err.message);
    res.json({ narration: outcome_description });
  }
});

module.exports = router;
