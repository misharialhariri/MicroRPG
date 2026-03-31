# MicroRPG

A dark fantasy mobile RPG built with React Native (Expo) and powered by Claude AI.

## Features

- **3 Hero Classes** — Warrior, Rogue, Mage, each with unique stats
- **AI-Generated Dungeons** — Claude generates a unique 5-room dungeon for every run
- **Turn-Based Combat** — Dice roll + attack vs enemy attack, narrated by Claude
- **4 Room Types** — Combat, Treasure, Trap, Rest
- **HP Tracking** — Heroes can fall in battle, triggering the Game Over screen
- **Hall of Fame** — Top 5 runs persisted with AsyncStorage

## Project Structure

```
MicroRPG/
├── app/
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── HeroSelectScreen.jsx
│   │   ├── DungeonScreen.jsx
│   │   ├── GameOverScreen.jsx
│   │   └── HallOfFameScreen.jsx
│   └── theme.js
├── server/
│   └── index.js
├── assets/
│   └── fonts/
│       └── PressStart2P-Regular.ttf
├── App.js
└── app.json
```

## Setup

### 1. Clone & Install

```bash
npm install
```

### 2. Configure the Server

```bash
cp .env.example .env
# Edit .env and set your ANTHROPIC_API_KEY
```

### 3. Run the Express Server

```bash
npm run server
# or for hot-reload:
npm run server:dev
```

### 4. Run the Expo App

```bash
npm start
# Then scan the QR code with Expo Go (Android/iOS)
# or press 'w' for web
```

> **Note:** The default `SERVER_URL` in `app/theme.js` is `http://localhost:3000`. If testing on a physical device, change this to your machine's local IP (e.g. `http://192.168.1.x:3000`).

## Server Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate-dungeon` | Generates a 5-room dungeon JSON from Claude |
| POST | `/narrate-combat` | Returns a one-sentence combat narration from Claude |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key |
| `PORT` | Server port (default: 3000) |
