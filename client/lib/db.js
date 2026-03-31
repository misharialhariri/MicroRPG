import * as SQLite from 'expo-sqlite';

let db = null;

export function getDb() {
  if (!db) {
    db = SQLite.openDatabaseSync('microrpg.db');
    initSchema();
  }
  return db;
}

function initSchema() {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hero_class TEXT NOT NULL,
        hero_name TEXT NOT NULL,
        rooms_cleared INTEGER NOT NULL DEFAULT 0,
        dungeon_name TEXT,
        cause_of_death TEXT,
        final_level INTEGER NOT NULL DEFAULT 1,
        gold_collected INTEGER NOT NULL DEFAULT 0,
        outcome TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS hall_of_fame (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hero_name TEXT NOT NULL,
        hero_class TEXT NOT NULL,
        dungeon_name TEXT,
        rooms_cleared INTEGER NOT NULL DEFAULT 0,
        final_level INTEGER NOT NULL DEFAULT 1,
        gold_collected INTEGER NOT NULL DEFAULT 0,
        outcome TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  } catch (e) {
    console.error('[DB] Schema init failed:', e);
  }
}

export function saveRun(run) {
  try {
    const database = getDb();
    const now = new Date().toISOString();
    database.runSync(
      `INSERT INTO runs (hero_class, hero_name, rooms_cleared, dungeon_name, cause_of_death, final_level, gold_collected, outcome, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [run.hero_class, run.hero_name, run.rooms_cleared, run.dungeon_name ?? '',
       run.cause_of_death ?? null, run.final_level, run.gold_collected, run.outcome, now]
    );

    // Mirror to hall_of_fame
    database.runSync(
      `INSERT INTO hall_of_fame (hero_name, hero_class, dungeon_name, rooms_cleared, final_level, gold_collected, outcome, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [run.hero_name, run.hero_class, run.dungeon_name ?? '', run.rooms_cleared,
       run.final_level, run.gold_collected, run.outcome, now]
    );
  } catch (e) {
    console.error('[DB] saveRun failed:', e);
  }
}

export function getHallOfFame(limit = 10) {
  try {
    const database = getDb();
    return database.getAllSync(
      `SELECT * FROM hall_of_fame ORDER BY rooms_cleared DESC, gold_collected DESC LIMIT ?`,
      [limit]
    );
  } catch (e) {
    console.error('[DB] getHallOfFame failed:', e);
    return [];
  }
}

export function getRunStats() {
  try {
    const database = getDb();
    const row = database.getFirstSync(
      `SELECT COUNT(*) as total, SUM(CASE WHEN outcome = 'victory' THEN 1 ELSE 0 END) as victories FROM runs`
    );
    return { total: row?.total ?? 0, victories: row?.victories ?? 0 };
  } catch (e) {
    console.error('[DB] getRunStats failed:', e);
    return { total: 0, victories: 0 };
  }
}
