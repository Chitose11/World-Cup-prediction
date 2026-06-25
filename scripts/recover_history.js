/**
 * Recovery script: backfill SQLite odds from existing JSON snapshots
 * Usage: node scripts/recover_history.js
 */
import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HISTORY_DIR = join(__dirname, "..", "..", "omega-copula-engine", "history");
const DB_PATH = join(__dirname, "..", "..", "omega-copula-engine", "sporttery_history.db");

if (!existsSync(HISTORY_DIR)) { console.log("No history directory"); process.exit(0); }

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Ensure schema
db.exec(`
  CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, captured_at TEXT DEFAULT (datetime('now')), match_date TEXT);
  CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY, snapshot_id INTEGER, match_id INTEGER, match_num TEXT, league TEXT, home TEXT, away TEXT, home_short TEXT, away_short TEXT, match_date TEXT, match_time TEXT, hhad_goal_line REAL, UNIQUE(snapshot_id, match_id));
  CREATE TABLE IF NOT EXISTS odds (id INTEGER PRIMARY KEY AUTOINCREMENT, match_row_id INTEGER, pool TEXT, outcome_key TEXT, outcome_label TEXT, odds REAL, UNIQUE(match_row_id, pool, outcome_key));
`);

const insSnapshot = db.prepare("INSERT INTO snapshots (match_date) VALUES (?)");
const insMatch = db.prepare("INSERT OR REPLACE INTO matches (snapshot_id, match_id, match_num, league, home, away, home_short, away_short, match_date, match_time, hhad_goal_line) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
const insOdds = db.prepare("INSERT OR REPLACE INTO odds (match_row_id, pool, outcome_key, outcome_label, odds) VALUES (?,?,?,?,?)");

const files = readdirSync(HISTORY_DIR).filter(f => f.endsWith(".json"));
console.log(`Recovering ${files.length} files from ${HISTORY_DIR}`);

let totalMatches = 0, totalOdds = 0;

for (const file of files) {
  const data = JSON.parse(readFileSync(join(HISTORY_DIR, file), "utf-8"));
  const matches = data.matches || [];
  if (!matches.length) continue;

  const matchDate = file.replace("sporttery-", "").replace(".json", "");
  const snap = insSnapshot.run(matchDate);
  const sid = snap.lastInsertRowid;
  if (!sid) continue;

  for (const m of matches) {
    // Data is in m.pools (nested) or top-level flat
    const pools = m.pools || m || {};
    const r = insMatch.run(
      sid, m.id, m.number, m.league,
      m.homeShort || m.home || "",
      m.awayShort || m.away || "",
      m.homeShort || "", m.awayShort || "",
      m.matchDate || m.businessDate || "",
      m.matchTime || "", m.hhadGoalLine || 0
    );
    const rid = r.lastInsertRowid;
    if (!rid) continue;

    for (const poolName of ["had", "hhad", "ttg", "hafu", "crs"]) {
      const items = pools[poolName] || [];
      for (const item of items) {
        if (item.odds) {
          insOdds.run(rid, poolName, item.key, item.label || item.key, item.odds);
          totalOdds++;
        }
      }
    }
    totalMatches++;
  }
  console.log(`  ${file}: ${matches.length} matches, snapshot_id=${sid}`);
}

db.close();
console.log(`\nDone. ${totalMatches} matches, ${totalOdds} odds records → ${DB_PATH}`);
