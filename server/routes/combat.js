const { Router } = require('express');
const router = Router();

const MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

async function callAnthropic(system, content, maxTokens = 120) {
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

// POST /api/combat/narrate
router.post('/narrate', async (req, res) => {
  const { action, attacker, defender, damage, hero_hp, enemy_hp, hero_class } = req.body;

  const system = `You are a dark fantasy combat narrator.
Write exactly ONE vivid sentence (max 22 words) narrating a combat event.
No quotation marks. No emojis. Raw, visceral fantasy prose.`;

  const prompt = `${attacker} (${hero_class}) ${action} against ${defender} for ${damage} damage. Hero HP: ${hero_hp}. Enemy HP: ${enemy_hp}.`;

  try {
    const narration = await callAnthropic(system, prompt, 80);
    res.json({ narration });
  } catch (err) {
    console.error('[combat/narrate]', err.message);
    // Fallback narration
    res.json({ narration: `${attacker} ${action}s for ${damage} damage!` });
  }
});

module.exports = router;
