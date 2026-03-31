# MicroRPG v2

A complete, production-ready dark fantasy mobile RPG built with React Native (Expo Router) and powered by Claude AI.

## Features

| Feature | Details |
|---|---|
| **3 Hero Classes** | Warrior, Rogue, Mage — each with unique stats, ability, and passive |
| **AI Dungeons** | Claude generates unique 5-room dungeons with lore, enemies, traps, and treasure |
| **Turn-Based Combat** | d20 dice rolls, critical hits, special moves, status effects (Stun) |
| **XP & Leveling** | 5 levels, stat growth on level-up, level-up sound + banner |
| **Inventory System** | Up to 5 items, weapon/armor apply instantly, potions usable in combat |
| **Trap Rooms** | Speed-based dodge check, AI-narrated outcomes |
| **Rest Rooms** | HP and MP restoration with atmospheric AI narration |
| **Treasure Rooms** | Animated chest opening, stat-boosting item pickups |
| **Permadeath** | HP hits 0 → GameOver screen with cause of death |
| **SQLite Persistence** | Full run history + Hall of Fame (top 10 runs) |
| **Sound Effects** | Hit, death, victory, treasure, levelup events |
| **Animations** | Reanimated HP bars, dice roll, ember particles, screen transitions |
| **Pixel Font** | Press Start 2P for all headers; Inter for body text |

---

## Prerequisites

- **Node 18+** — [nodejs.org](https://nodejs.org)
- **Expo CLI** — `npm install -g expo-cli`
- **Expo Go app** on your device (iOS/Android) — or use a simulator
- **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

---

## Project Structure

```
MicroRPG/
├── client/                   # Expo Router app
│   ├── app/                  # Expo Router file-based routes
│   │   ├── _layout.jsx       # Root layout + font loading + GameProvider
│   │   ├── index.jsx         # Redirects to /home
│   │   ├── home.jsx
│   │   ├── hero-select.jsx
│   │   ├── dungeon.jsx
│   │   ├── combat.jsx
│   │   ├── treasure.jsx
│   │   ├── game-over.jsx
│   │   ├── victory.jsx
│   │   └── hall-of-fame.jsx
│   ├── screens/              # Screen components
│   ├── components/           # Reusable UI components
│   ├── hooks/                # useGame, useCombat, useSound
│   ├── lib/                  # GameContext, db, api, gameEngine, constants
│   ├── theme/                # colors.js, typography.js
│   └── assets/
│       ├── fonts/            # PressStart2P-Regular.ttf (bundled)
│       └── sounds/           # Place .mp3 files here (see below)
└── server/                   # Express.js backend
    ├── index.js
    ├── routes/
    │   ├── dungeon.js        # POST /api/dungeon/generate
    │   ├── combat.js         # POST /api/combat/narrate
    │   └── room.js           # POST /api/room/outcome
    └── .env.example
```

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd MicroRPG
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY
npm install
```

### 3. Install client dependencies

```bash
cd ../client
npm install
```

### 4. Add sound effects (optional but recommended)

Download free royalty-free clips from **[mixkit.co](https://mixkit.co/free-sound-effects/)** and place them in `client/assets/sounds/`:

| Filename | Description | Suggested search |
|---|---|---|
| `hit.mp3` | Weapon impact | "sword hit" |
| `death.mp3` | Hero death | "game over" or "death" |
| `victory.mp3` | Combat/dungeon victory | "victory fanfare" |
| `treasure.mp3` | Chest opening | "treasure" or "item pickup" |
| `levelup.mp3` | Level up | "level up" or "power up" |

The game runs without sound files — they fail silently.

---

## Running the Game

### Start the server (Terminal 1)

```bash
cd server
npm run dev      # nodemon hot-reload
# or
npm start        # plain node
```

Server starts at **http://localhost:3000**

### Start the Expo app (Terminal 2)

```bash
cd client
npx expo start
```

- **Physical device**: Install [Expo Go](https://expo.dev/client), scan the QR code
- **Android emulator**: Press `a`
- **iOS simulator** (Mac only): Press `i`
- **Web**: Press `w`

> **Physical device tip**: Change `SERVER_URL` in `client/lib/constants.js` from `http://localhost:3000` to your machine's local IP, e.g. `http://192.168.1.42:3000`

---

## API Reference

### `POST /api/dungeon/generate`
Generates a complete 5-room dungeon using Claude.

**Request:**
```json
{
  "hero_class": "warrior",
  "hero_stats": { "hp": 120, "attack": 15, "defense": 12, "speed": 8, "magic": 3 },
  "difficulty": 2
}
```

### `POST /api/combat/narrate`
Returns a single vivid combat narration sentence.

**Request:**
```json
{
  "action": "attacks",
  "attacker": "Aldric",
  "defender": "Corrupted Knight",
  "damage": 18,
  "hero_hp": 64,
  "enemy_hp": 22,
  "hero_class": "warrior"
}
```

### `POST /api/room/outcome`
Returns 1-2 sentences narrating a trap or rest event.

**Request:**
```json
{
  "room_type": "trap",
  "outcome_description": "Poison dart trap deals 12 damage",
  "hero_stats": { "hp": 48 }
}
```

---

## Architecture

```
GameContext (React Context + useReducer)
    │
    ├── useGame hook          ← all screens use this
    ├── useCombat hook        ← CombatScreen only
    └── useSound hook         ← plays audio events

Expo Router (file-based navigation)
    ├── /home → HomeScreen
    ├── /hero-select → HeroSelectScreen  (calls /api/dungeon/generate)
    ├── /dungeon → DungeonScreen         (dispatches to combat/treasure/etc.)
    ├── /combat → CombatScreen           (calls /api/combat/narrate per turn)
    ├── /treasure → TreasureScreen
    ├── /game-over → GameOverScreen      (saves to SQLite)
    ├── /victory → VictoryScreen         (saves to SQLite)
    └── /hall-of-fame → HallOfFameScreen (reads from SQLite)

Expo SQLite (on-device)
    ├── runs table            ← full history
    └── hall_of_fame table    ← top 10 leaderboard
```

---

## Getting an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key into `server/.env` as `ANTHROPIC_API_KEY=sk-ant-...`

The server uses **claude-sonnet-4-20250514** for all AI calls.
