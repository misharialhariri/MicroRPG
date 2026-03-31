const express = require('express');
const cors = require('cors');
require('dotenv').config();

const dungeonRouter = require('./routes/dungeon');
const combatRouter = require('./routes/combat');
const roomRouter = require('./routes/room');

const app = express();

app.use(cors());
app.use(express.json());

// Rate limiting
let requestCounts = {};
setInterval(() => { requestCounts = {}; }, 60000);

app.use((req, res, next) => {
  const ip = req.ip ?? 'unknown';
  requestCounts[ip] = (requestCounts[ip] ?? 0) + 1;
  if (requestCounts[ip] > 30) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  next();
});

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.use('/api/dungeon', dungeonRouter);
app.use('/api/combat', combatRouter);
app.use('/api/room', roomRouter);

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: err.message ?? 'Internal server error' });
});

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`MicroRPG server running on port ${PORT}`));
