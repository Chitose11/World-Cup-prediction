/**
 * V4.0 History DB Migration — JSON → SQLite
 * Usage: node scripts/migrate_to_sqlite.js
 * Creates sporttery_history.db with normalized tables for time-series analysis
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = join(__dirname, "..", "..", "omega-copula-engine", "history");
const DB_PATH = join(__dirname, "..", "..", "omega-copula-engine", "sporttery_history.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ───────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    captured_at TEXT NOT NULL DEFAULT (datetime('now')),
    match_date TEXT NOT NULL,
    source TEXT DEFAULT 'sporttery'
  );

  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY,
    snapshot_id INTEGER REFERENCES snapshots(id),
    match_id INTEGER NOT NULL,
    match_num TEXT,
    league TEXT,
    home TEXT NOT NULL,
    away TEXT NOT NULL,
    home_short TEXT,
    away_short TEXT,
    match_date TEXT,
    match_time TEXT,
    status TEXT,
    hhad_goal_line REAL,
    betting_single INTEGER DEFAULT 0,
    UNIQUE(snapshot_id, match_id)
  );

  CREATE TABLE IF NOT EXISTS odds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_row_id INTEGER REFERENCES matches(id),
    pool TEXT NOT NULL CHECK(pool IN ('had','hhad','ttg','hafu','crs')),
    outcome_key TEXT NOT NULL,
    outcome_label TEXT,
    odds REAL NOT NULL,
    UNIQUE(match_row_id, pool, outcome_key)
  );

  CREATE TABLE IF NOT EXISTS results (
    match_id INTEGER PRIMARY KEY,
    full_h INTEGER,
    full_a INTEGER,
    half_h INTEGER,
    half_a INTEGER,
    settled_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_matches_match_id ON matches(match_id);
  CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
  CREATE INDEX IF NOT EXISTS idx_matches_home_away ON matches(home, away);
  CREATE INDEX IF NOT EXISTS idx_odds_pool ON odds(pool);
`);

// ── Migration ────────────────────────────────────────────────
console.log("Migrating JSON files from", HISTORY_DIR);

const files = existsSync(HISTORY_DIR)
  ? readdirSync(HISTORY_DIR).filter(f => f.endsWith(".json"))
  : [];

if (!files.length) {
  console.log("No JSON files found. DB schema created, ready for new data.");
} else {
  const insertSnapshot = db.prepare(
    "INSERT OR IGNORE INTO snapshots (captured_at, match_date) VALUES (?, ?)"
  );
  const insertMatch = db.prepare(
    "INSERT OR IGNORE INTO matches (snapshot_id, match_id, match_num, league, home, away, home_short, away_short, match_date, match_time, status, hhad_goal_line, betting_single) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const insertOdds = db.prepare(
    "INSERT OR IGNORE INTO odds (match_row_id, pool, outcome_key, outcome_label, odds) VALUES (?, ?, ?, ?, ?)"
  );

  let totalMatches = 0;

  for (const file of files) {
    try {
      const data = JSON.parse(readFileSync(join(HISTORY_DIR, file), "utf-8"));
      const matches = data.matches || [];
      if (!matches.length) continue;

      const matchDate = file.replace("sporttery-", "").replace(".json", "");

      const snapshot = insertSnapshot.run(new Date().toISOString(), matchDate);
      const snapshotId = snapshot.lastInsertRowid || 1;

      for (const m of matches) {
        const result = insertMatch.run(
          snapshotId,
          m.id, m.number, m.league,
          m.homeShort || m.home, m.awayShort || m.away,
          m.homeShort, m.awayShort,
          m.matchDate || m.businessDate, m.matchTime,
          m.status, m.hhadGoalLine || 0, m.rawResult?.bettingSingle || 0
        );
        const matchRowId = result.lastInsertRowid;
        if (!matchRowId) continue;

        // Insert odds for each pool
        for (const pool of ["had", "hhad", "ttg", "hafu", "crs"]) {
          const items = m[pool] || [];
          for (const item of items) {
            if (item.odds) {
              insertOdds.run(matchRowId, pool, item.key, item.label || item.key, item.odds);
            }
          }
        }
        totalMatches++;
      }

      console.log(`  ${file}: ${matches.length} matches → DB`);
    } catch (e) {
      console.log(`  [SKIP] ${file}: ${e.message}`);
    }
  }

  console.log(`Migrated ${totalMatches} match snapshots`);
}

// ── Test queries ─────────────────────────────────────────────
console.log("\nSample queries:");
const countByDate = db.prepare(
  "SELECT match_date, COUNT(*) as cnt FROM matches GROUP BY match_date ORDER BY match_date DESC LIMIT 5"
).all();
for (const row of countByDate) {
  console.log(`  ${row.match_date}: ${row.cnt} matches`);
}

const hhadCount = db.prepare(
  "SELECT COUNT(DISTINCT match_row_id) as cnt FROM odds WHERE pool = 'hhad'"
).get();
console.log(`  Matches with HHAD odds: ${hhadCount.cnt}`);

db.close();
console.log(`\nDatabase: ${DB_PATH}`);
