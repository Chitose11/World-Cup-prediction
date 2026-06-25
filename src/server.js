import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join, normalize, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { buildFullV32Model } from "./v4-engine.js";
import { JingcaiScanner } from "./jingcai-ttg-scanner.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = normalize(join(__dirname, ".."));
let publicDir = join(root, "public");
let port = Number(process.env.PORT || 4173);
let tavilyApiKey = process.env.TAVILY_API_KEY || "";
let stateFile = process.env.WORKBENCH_STATE_FILE || defaultStateFile();

// ── Collector status tracker ─────────────────────────────────
const collectorStatus = {
  lastSyncAt: null,
  lastSyncNewRecords: 0,
  totalRecords: 0,
  apiHealth: "idle",       // idle | 200 | 403 | 502
  lastError: null,
  historyDir: join(root, "..", "omega-copula-engine", "history"),
};

async function updateCollectorDB(data) {
  const matches = data?.matches || [];
  if (!matches.length) return;

  // Always update status + write JSON (non-negotiable)
  collectorStatus.lastSyncAt = new Date().toISOString();
  collectorStatus.lastSyncNewRecords = matches.length;
  collectorStatus.totalRecords += matches.length;
  collectorStatus.apiHealth = "200";
  collectorStatus.lastError = null;

  // Write JSON (fire-and-forget for speed)
  try {
    await mkdir(collectorStatus.historyDir, { recursive: true });
    const today = new Date().toISOString().slice(0, 10);
    await writeFile(join(collectorStatus.historyDir, `sporttery-${today}.json`), JSON.stringify(data, null, 2));
  } catch (e) { collectorStatus.lastError = "JSON write: " + e.message; }

  // Write to SQLite (best-effort, don't block status update)
  try {
    const { default: Database } = await import("better-sqlite3");
    const dbPath = join(root, "..", "omega-copula-engine", "sporttery_history.db");
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, captured_at TEXT DEFAULT (datetime('now')), match_date TEXT);
      CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY, snapshot_id INTEGER, match_id INTEGER, match_num TEXT, league TEXT, home TEXT, away TEXT, home_short TEXT, away_short TEXT, match_date TEXT, match_time TEXT, hhad_goal_line REAL, UNIQUE(snapshot_id, match_id));
      CREATE TABLE IF NOT EXISTS odds (id INTEGER PRIMARY KEY AUTOINCREMENT, match_row_id INTEGER, pool TEXT, outcome_key TEXT, outcome_label TEXT, odds REAL, UNIQUE(match_row_id, pool, outcome_key));
    `);
    const insSnapshot = db.prepare("INSERT INTO snapshots (match_date) VALUES (?)");
    const insMatch = db.prepare("INSERT OR IGNORE INTO matches (snapshot_id, match_id, match_num, league, home, away, home_short, away_short, match_date, match_time, hhad_goal_line) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    const insOdds = db.prepare("INSERT OR IGNORE INTO odds (match_row_id, pool, outcome_key, outcome_label, odds) VALUES (?,?,?,?,?)");
    const snap = insSnapshot.run(new Date().toISOString().slice(0,10));
    const sid = snap.lastInsertRowid;
    for (const m of matches) {
      const pools = m.pools || m;
      const r = insMatch.run(sid, m.id, m.number, m.league, m.homeShort||m.home, m.awayShort||m.away, m.homeShort, m.awayShort, m.matchDate||m.businessDate, m.matchTime, m.hhadGoalLine||0);
      const rid = r.lastInsertRowid;
      if (!rid) continue;
      for (const poolName of ["had","hhad","ttg","hafu","crs"]) {
        const items = pools[poolName] || [];
        for (const item of items) {
          if (item.odds) insOdds.run(rid, poolName, item.key, item.label||item.key, item.odds);
        }
      }
    }
    db.close();
  } catch (e) {
    collectorStatus.lastError = "SQLite: " + e.message;
  }
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function json(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function defaultStateFile() {
  const appData = process.env.APPDATA || process.env.XDG_DATA_HOME || "";
  if (appData) return join(appData, "sporttery-v32-workbench", "workbench-state.json");
  return join(root, ".workbench-state.json");
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function readWorkbenchState() {
  try {
    const state = JSON.parse(await readFile(stateFile, "utf8"));
    return {
      ok: true,
      source: "file",
      state,
      stateFile,
      loadedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        ok: true,
        source: "empty",
        state: {},
        stateFile,
        loadedAt: new Date().toISOString(),
      };
    }
    throw error;
  }
}

async function writeWorkbenchState(state) {
  await mkdir(dirname(stateFile), { recursive: true });
  const payload = {
    ...state,
    savedAt: new Date().toISOString(),
  };
  await writeFile(stateFile, JSON.stringify(payload, null, 2), "utf8");
  return {
    ok: true,
    source: "file",
    stateFile,
    savedAt: payload.savedAt,
  };
}

function normalizePool(pool) {
  const allowed = new Set(["hafu", "had", "hhad", "crs", "ttg"]);
  if (!pool) return "hafu";
  const items = pool
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item) => allowed.has(item));
  return items.length ? items.join(",") : "hafu";
}

function odd(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 1 ? number : null;
}

function compact(items) {
  return items
    .map(([key, label, value]) => ({ key, label, odds: odd(value) }))
    .filter((item) => item.odds);
}

function mapHafuOdds(hafu = {}) {
  return compact([
    ["hh", "胜胜", hafu.hh],
    ["hd", "胜平", hafu.hd],
    ["ha", "胜负", hafu.ha],
    ["dh", "平胜", hafu.dh],
    ["dd", "平平", hafu.dd],
    ["da", "平负", hafu.da],
    ["ah", "负胜", hafu.ah],
    ["ad", "负平", hafu.ad],
    ["aa", "负负", hafu.aa],
  ]);
}

function mapHadOdds(had = {}) {
  return compact([
    ["h", "胜", had.h],
    ["d", "平", had.d],
    ["a", "负", had.a],
  ]);
}

function mapHhadOdds(hhad = {}) {
  return compact([
    ["h", "让胜", hhad.h],
    ["d", "让平", hhad.d],
    ["a", "让负", hhad.a],
  ]);
}

function mapTtgOdds(ttg = {}) {
  return compact(
    ["0", "1", "2", "3", "4", "5", "6", "7"].map((n) => [
      `s${n}`,
      n === "7" ? "7+" : n,
      ttg[`s${n}`],
    ]),
  );
}

function mapCrsOdds(crs = {}) {
  return compact([
    ["s01s00", "1:0"], ["s02s00", "2:0"], ["s02s01", "2:1"], ["s03s00", "3:0"],
    ["s03s01", "3:1"], ["s03s02", "3:2"], ["s04s00", "4:0"], ["s04s01", "4:1"],
    ["s04s02", "4:2"], ["s05s00", "5:0"], ["s05s01", "5:1"], ["s05s02", "5:2"],
    ["s1sh", "胜其他"], ["s00s00", "0:0"], ["s01s01", "1:1"], ["s02s02", "2:2"],
    ["s03s03", "3:3"], ["s1sd", "平其他"], ["s00s01", "0:1"], ["s00s02", "0:2"],
    ["s01s02", "1:2"], ["s00s03", "0:3"], ["s01s03", "1:3"], ["s02s03", "2:3"],
    ["s00s04", "0:4"], ["s01s04", "1:4"], ["s02s04", "2:4"], ["s00s05", "0:5"],
    ["s01s05", "1:5"], ["s02s05", "2:5"], ["s1sa", "负其他"],
  ].map(([key, label]) => [key, label, crs[key]]));
}

function parseGoalLine(hhad = {}) {
  const raw = hhad.goalLine ?? hhad.goalLineValue ?? hhad.goal ?? hhad.goalline;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseScorePair(value) {
  if (value == null || value === "") return null;
  if (typeof value === "object") {
    const home = value.home ?? value.h ?? value.homeScore ?? value.hostScore;
    const away = value.away ?? value.a ?? value.awayScore ?? value.guestScore;
    const homeNumber = Number(home);
    const awayNumber = Number(away);
    if (Number.isFinite(homeNumber) && Number.isFinite(awayNumber)) {
      return { h: homeNumber, a: awayNumber };
    }
    return null;
  }
  const match = String(value).trim().match(/(\d+)\s*[-:：]\s*(\d+)/);
  if (!match) return null;
  return { h: Number(match[1]), a: Number(match[2]) };
}

function firstScorePair(...values) {
  for (const value of values) {
    const parsed = parseScorePair(value);
    if (parsed) return parsed;
  }
  return null;
}

function extractScoreFromSeparateFields(match, homeKeys, awayKeys) {
  for (const homeKey of homeKeys) {
    for (const awayKey of awayKeys) {
      const home = Number(match?.[homeKey]);
      const away = Number(match?.[awayKey]);
      if (Number.isFinite(home) && Number.isFinite(away)) return { h: home, a: away };
    }
  }
  return null;
}

function extractMatchResult(match = {}) {
  const full = firstScorePair(
    match.score,
    match.fullScore,
    match.finalScore,
    match.matchScore,
    match.allScore,
    match.totalScore,
    match.result,
    match.matchResult,
    match.fullResult,
  ) || extractScoreFromSeparateFields(
    match,
    ["homeScore", "homeFullScore", "homeTeamScore", "hostScore", "hScore", "homeGoals"],
    ["awayScore", "awayFullScore", "awayTeamScore", "guestScore", "aScore", "awayGoals"],
  );
  const half = firstScorePair(
    match.halfScore,
    match.halfCourtScore,
    match.halfResult,
    match.htScore,
    match.firstHalfScore,
  ) || extractScoreFromSeparateFields(
    match,
    ["homeHalfScore", "halfHomeScore", "homeHtScore", "homeHalfGoals"],
    ["awayHalfScore", "halfAwayScore", "awayHtScore", "awayHalfGoals"],
  );
  if (!full) return null;
  return {
    full,
    half,
    source: "sporttery-webapi",
    rawStatus: match.matchStatus || "",
  };
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function extractOfficialResult(match = {}) {
  const full = parseScorePair(match.sectionsNo999);
  if (!full) return null;
  return {
    full,
    half: parseScorePair(match.sectionsNo1),
    source: "sporttery-result",
    rawStatus: match.matchResultStatus || "",
  };
}

function transformSporttery(data, pool) {
  const groups = data?.value?.matchInfoList || [];
  const matches = [];
  for (const group of groups) {
    for (const match of group.subMatchList || []) {
      matches.push({
        id: String(match.matchId),
        number: match.matchNumStr,
        league: match.leagueAbbName || match.leagueAllName || "",
        businessDate: match.businessDate || group.businessDate || "",
        matchDate: match.matchDate || "",
        matchTime: match.matchTime || "",
        home: match.homeTeamAllName || match.homeTeamAbbName || "主队",
        away: match.awayTeamAllName || match.awayTeamAbbName || "客队",
        homeShort: match.homeTeamAbbName || match.homeTeamAllName || "主队",
        awayShort: match.awayTeamAbbName || match.awayTeamAllName || "客队",
        homeRank: match.homeRank || "",
        awayRank: match.awayRank || "",
        status: match.matchStatus || "",
        result: extractMatchResult(match),
        hhadGoalLine: parseGoalLine(match.hhad),
        pools: {
          hafu: mapHafuOdds(match.hafu),
          had: mapHadOdds(match.had),
          hhad: mapHhadOdds(match.hhad),
          ttg: mapTtgOdds(match.ttg),
          crs: mapCrsOdds(match.crs),
        },
        rawPools: {
          hafu: match.hafu || {},
          had: match.had || {},
          hhad: match.hhad || {},
          ttg: match.ttg || {},
          crs: match.crs || {},
        },
      });
    }
  }
  return {
    ok: data?.errorCode === "0" || data?.errorCode === 0,
    source: "sporttery-webapi",
    pool,
    lastUpdateTime: data?.value?.lastUpdateTime || null,
    fetchedAt: new Date().toISOString(),
    matches,
  };
}

function transformSportteryResults(data, range) {
  const matches = (data?.value?.matchResult || []).map((match) => ({
    id: String(match.matchId),
    number: match.matchNumStr || match.matchNum || "",
    league: match.leagueNameAbbr || match.leagueName || "",
    matchDate: match.matchDate || "",
    matchTime: match.matchTime || "",
    home: match.allHomeTeam || match.homeTeam || "主队",
    away: match.allAwayTeam || match.awayTeam || "客队",
    homeShort: match.homeTeam || match.allHomeTeam || "主队",
    awayShort: match.awayTeam || match.allAwayTeam || "客队",
    status: match.matchResultStatus || "",
    hhadGoalLine: Number(match.goalLine || 0) || 0,
    result: extractOfficialResult(match),
    rawResult: match,
  }));
  return {
    ok: data?.errorCode === "0" || data?.errorCode === 0,
    source: "sporttery-result-webapi",
    range,
    total: data?.value?.total || matches.length,
    lastUpdateTime: data?.value?.lastUpdateTime || null,
    fetchedAt: new Date().toISOString(),
    matches,
  };
}

async function fetchSporttery(pool) {
  const normalizedPool = normalizePool(pool);
  const url = new URL("https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry");
  url.searchParams.set("channel", "c");
  url.searchParams.set("poolCode", normalizedPool);
  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/plain, */*",
      origin: "https://m.sporttery.cn",
      referer: "https://m.sporttery.cn/mjc/jsq/zqbqc/",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    },
  });
  if (!response.ok) {
    throw new Error(`Sporttery HTTP ${response.status}`);
  }
  const data = await response.json();
  return transformSporttery(data, normalizedPool);
}

async function fetchSportteryResults({ from, to, pageSize = 80 } = {}) {
  const today = new Date();
  const range = {
    from: from || formatDate(addDays(today, -2)),
    to: to || formatDate(today),
  };
  const url = new URL("https://webapi.sporttery.cn/gateway/uniform/football/getUniformMatchResultV1.qry");
  url.searchParams.set("matchBeginDate", range.from);
  url.searchParams.set("matchEndDate", range.to);
  url.searchParams.set("leagueId", "");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("isFix", "0");
  url.searchParams.set("matchPage", "1");
  url.searchParams.set("pcOrWap", "1");
  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      origin: "https://www.sporttery.cn",
      referer: "https://www.sporttery.cn/jc/zqsgkj/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
      "sec-fetch-site": "same-site",
      "sec-fetch-mode": "cors",
      "sec-fetch-dest": "empty",
    },
  });
  if (!response.ok) {
    throw new Error(`Sporttery results HTTP ${response.status}`);
  }
  const data = await response.json();
  return transformSportteryResults(data, range);
}

// 从 sporttery.cn 官方 bssj 页面 API 抓取伤停信息
// mid: sportteryMatchId（即 calculator API 返回的 matchId）
async function fetchSportteryInjury(mid) {
  const url = new URL("https://webapi.sporttery.cn/gateway/uniform/football/getInjurySuspensionV1.qry");
  url.searchParams.set("sportteryMatchId", String(mid));
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      origin: "https://m.sporttery.cn",
      referer: "https://m.sporttery.cn/",
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
    },
  });
  if (!response.ok) {
    throw new Error(`Sporttery injury HTTP ${response.status}`);
  }
  const data = await response.json();
  if (data?.errorCode !== "0" && data?.errorCode !== 0) {
    return { ok: false, error: data?.errorMessage || "Unknown error", source: "sporttery-injury-api" };
  }
  const value = data?.value || {};
  const formatTeam = (team) => {
    if (!team) return { name: "", players: [] };
    return {
      name: team.teamShortName || "",
      sportteryTeamId: team.sportteryTeamId,
      players: (team.injuriesAndSuspensionsList || []).map((p) => ({
        name: p.personName || "",
        number: p.uniformNo || "",
        position: p.playerPositionDesc || "",
        isInjured: p.injuryFlag === 1,
        isSuspended: p.suspensionFlag === 1,
        appearances: p.appearanceCnt || 0,
        starts: p.startedMatchCnt || 0,
        subs: p.substituteMatchCnt || 0,
      })),
    };
  };
  return {
    ok: true,
    source: "sporttery-injury-api",
    fetchedAt: new Date().toISOString(),
    mid,
    home: formatTeam(value.home),
    away: formatTeam(value.away),
  };
}

// 批量抓取 sporttery bssj 所有分析数据（并行请求）
async function fetchBssjAll(mid) {
  const sportteryId = String(mid);
  const baseHeaders = {
    accept: "application/json",
    origin: "https://m.sporttery.cn",
    referer: "https://m.sporttery.cn/",
    "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
  };

  const fetchApi = async (endpoint) => {
    const url = new URL(`https://webapi.sporttery.cn/gateway/uniform/football/${endpoint}.qry`);
    url.searchParams.set("sportteryMatchId", sportteryId);
    const r = await fetch(url, { headers: baseHeaders });
    if (!r.ok) throw new Error(`${endpoint} HTTP ${r.status}`);
    const data = await r.json();
    return data?.errorCode === "0" || data?.errorCode === 0 ? data.value : null;
  };

  const [feature, tables, players, resultHistory, matchResult, future] = await Promise.allSettled([
    fetchApi("getMatchFeatureV1"),
    fetchApi("getMatchTablesV1"),
    fetchApi("getMatchPlayerV1"),
    fetchApi("getResultHistoryV1"),
    fetchApi("getMatchResultV1"),
    fetchApi("getFutureMatchesV1"),
  ]);

  const getValue = (settled) => settled.status === "fulfilled" ? settled.value : null;

  return {
    ok: true,
    source: "sporttery-bssj",
    fetchedAt: new Date().toISOString(),
    mid: sportteryId,
    feature: getValue(feature),
    tables: getValue(tables),
    players: getValue(players),
    resultHistory: getValue(resultHistory),
    matchResult: getValue(matchResult),
    future: getValue(future),
  };
}

function teamSearchName(name = "") {
  const normalized = name.replace(/\s+/g, "").toLowerCase();
  const directAliases = [
    ["墨西哥", "Mexico"], ["南非", "South Africa"], ["韩国", "South Korea"], ["捷克", "Czechia"],
    ["瑞士", "Switzerland"], ["加拿大", "Canada"], ["波黑", "Bosnia-Herzegovina"], ["卡塔尔", "Qatar"],
    ["巴西", "Brazil"], ["摩洛哥", "Morocco"], ["苏格兰", "Scotland"], ["海地", "Haiti"],
    ["美国", "United States"], ["澳大利亚", "Australia"], ["土耳其", "Turkiye"], ["巴拉圭", "Paraguay"],
    ["德国", "Germany"], ["厄瓜多尔", "Ecuador"], ["科特迪瓦", "Ivory Coast"], ["库拉索", "Curacao"],
    ["荷兰", "Netherlands"], ["日本", "Japan"], ["瑞典", "Sweden"], ["突尼斯", "Tunisia"],
    ["比利时", "Belgium"], ["埃及", "Egypt"], ["伊朗", "Iran"], ["新西兰", "New Zealand"],
    ["西班牙", "Spain"], ["乌拉圭", "Uruguay"], ["沙特阿拉伯", "Saudi Arabia"], ["沙特", "Saudi Arabia"],
    ["佛得角", "Cape Verde"], ["法国", "France"], ["塞内加尔", "Senegal"], ["挪威", "Norway"],
    ["伊拉克", "Iraq"], ["阿根廷", "Argentina"], ["奥地利", "Austria"], ["阿尔及利亚", "Algeria"],
    ["约旦", "Jordan"], ["葡萄牙", "Portugal"], ["哥伦比亚", "Colombia"], ["乌兹别克斯坦", "Uzbekistan"],
    ["刚果(金)", "DR Congo"], ["刚果金", "DR Congo"], ["英格兰", "England"], ["克罗地亚", "Croatia"],
    ["加纳", "Ghana"], ["巴拿马", "Panama"],
  ];
  const directHit = directAliases.find(([key]) => normalized.includes(key.replace(/\s+/g, "").toLowerCase()));
  if (directHit) return directHit[1];
  const aliases = [
    [/葡萄牙/, "Portugal"],
    [/刚果\(金\)|剛果\(金\)|刚果民主共和国|剛果民主共和國/, "DR Congo"],
    [/英格兰|英格蘭/, "England"],
    [/克罗地亚|克羅地亞/, "Croatia"],
    [/加纳|迦納/, "Ghana"],
    [/巴拿马|巴拿馬/, "Panama"],
    [/乌兹别克|烏茲別克/, "Uzbekistan"],
    [/哥伦比亚|哥倫比亞/, "Colombia"],
    [/阿根廷/, "Argentina"],
    [/罗马尼亚|羅馬尼亞/, "Romania"],
    [/坦桑尼亚|坦桑尼亞/, "Tanzania"],
    [/坦桑/, "Tanzania"],
    [/加纳|迦納/, "Ghana"],
    [/牙买加|牙買加/, "Jamaica"],
  ];
  const hit = aliases.find(([pattern]) => pattern.test(normalized) || pattern.test(name));
  return hit ? hit[1] : name;
}

function buildResearchQueries({ home, away, league, date }) {
  const teams = `${teamSearchName(home)} ${teamSearchName(away)}`.trim();
  const leagueContext = /世界杯|world cup/i.test(league || "") ? "FIFA World Cup 2026" : league;
  const context = [leagueContext, date?.slice?.(0, 7) || date].filter(Boolean).join(" ");
  // Remove suffix for Tavily — it returns clean structured results natively
  const suffix = "-wikipedia -government -embassy";
  return [
    {
      key: "lineup",
      label: "首发/预测阵容",
      query: `${teams} predicted starting lineup team news formation ${context} ${suffix}`,
    },
    {
      key: "injury",
      label: "伤停/停赛",
      query: `${teams} injuries suspensions unavailable players squad news ${context} ${suffix}`,
    },
    {
      key: "tactics",
      label: "战术分析/低赔风险",
      query: `${teams} tactical analysis low block counterattack set piece finishing weakness ${context} ${suffix}`,
    },
    {
      key: "motivation",
      label: "赛程动机/出线形势",
      query: `${teams} group standings qualification scenario rotation must-win ${context} ${suffix}`,
    },
    {
      key: "market",
      label: "盘口异动/赛前情报",
      query: `${teams} betting odds movement preview analysis ${context} ${suffix}`,
    },
  ];
}

function cleanHtml(text = "") {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text = "") {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function extractBingResults(html, limit = 5) {
  const results = [];
  const blocks = html.match(/<li class="b_algo"[\s\S]*?<\/li>/gi) || [];
  for (const block of blocks) {
    const anchor = block.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i)
      || block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!anchor) continue;
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const title = decodeEntities(cleanHtml(anchor[2]));
    const url = decodeEntities(anchor[1]);
    const snippet = decodeEntities(cleanHtml(snippetMatch?.[1] || ""));
    if (!title || !url || url.includes("javascript:")) continue;
    if (isLowValueResult(title, url)) continue;
    if (!isFootballResult(title, url, snippet)) continue;
    results.push({ title, url, snippet });
    if (results.length >= limit) break;
  }
  return results;
}

function isLowValueResult(title, url) {
  const text = `${title} ${url}`.toLowerCase();
  return [
    "baike.baidu.com",
    "mfa.gov.cn",
    "embassy",
    "country profile",
    "national profile",
    "britannica.com/place",
    "worldometers.info",
    "cia.gov",
    "encyclopedia",
    "wikipedia.org",
    "zh.wikipedia",
    "百科",
    "百度百科",
  ].some((needle) => text.includes(needle));
}

function isFootballResult(title, url, snippet) {
  const text = `${title} ${url} ${snippet}`.toLowerCase();
  return [
    "football",
    "soccer",
    "fifa",
    "world cup",
    "lineup",
    "line-up",
    "injury",
    "suspension",
    "match",
    "preview",
    "prediction",
    "odds",
    "betting",
    "sport",
    "sofascore",
    "fotmob",
    "flashscore",
    "aiscore",
    "transfermarkt",
    "espn",
    "sportsmole",
    "90min",
    "thehardtackle",
    "rotowire",
    "whoscored",
    "足球",
    "首发",
    "阵容",
    "伤停",
    "停赛",
    "盘口",
    "赔率",
    "比赛",
  ].some((needle) => text.includes(needle));
}

function extractSignals(results) {
  const text = results.map((item) => `${item.title} ${item.snippet}`).join(" ").toLowerCase();
  const signalMap = {
    lineup: ["首发", "阵容", "预测阵容", "lineup", "probable", "xi"],
    injury: ["伤停", "受伤", "停赛", "缺阵", "injury", "injuries", "suspension", "suspended"],
    tactics: ["低位", "密集防守", "low block", "compact", "counterattack", "反击", "set piece", "定位球", "finishing", "终结", "weakness", "漏洞"],
    motivation: ["出线", "积分", "小组", "轮换", "动机", "qualification", "motivation", "rotation", "standings"],
    market: ["赔率", "盘口", "降赔", "升赔", "odds", "market", "movement"],
  };
  return Object.fromEntries(
    Object.entries(signalMap).map(([key, words]) => [key, words.some((word) => text.includes(word))]),
  );
}

async function searchBing(query) {
  const url = new URL("https://www.bing.com/search");
  url.searchParams.set("q", query);
  url.searchParams.set("setlang", "zh-CN");
  url.searchParams.set("mkt", "zh-CN");
  const response = await fetch(url, {
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.7",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36",
    },
  });
  if (!response.ok) {
    throw new Error(`Bing HTTP ${response.status}`);
  }
  return extractBingResults(await response.text());
}

function normalizeTavilyResults(data, limit = 8) {
  return (data?.results || [])
    .map((item) => ({
      title: item.title || item.url || "",
      url: item.url || "",
      snippet: item.content || item.raw_content || "",
      score: Number(item.score) || null,
      source: "tavily",
      publishedDate: item.published_date || null,
    }))
    .filter((item) => item.title && item.url)
    .filter((item) => !isLowValueResult(item.title, item.url))
    .filter((item) => isFootballResult(item.title, item.url, item.snippet))
    .slice(0, limit);
}

async function searchTavily(query) {
  if (!tavilyApiKey) {
    throw new Error("Tavily API Key 未配置");
  }
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      authorization: `Bearer ${tavilyApiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      query,
      topic: "general",
      search_depth: "advanced",
      max_results: 8,
      time_range: "month",
      include_answer: true,
      include_raw_content: false,
      include_images: false,
      include_favicon: false,
      exclude_domains: [
        "baike.baidu.com",
        "wikipedia.org",
        "britannica.com",
        "mfa.gov.cn",
        "worldometers.info",
      ],
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.detail || data?.error || `Tavily HTTP ${response.status}`);
  }
  return {
    answer: data.answer || "",
    results: normalizeTavilyResults(data),
    responseTime: data.response_time || null,
  };
}

async function searchResearchCategory(query) {
  let provider = "tavily";
  let answer = "";
  let providerError = "";
  let results = [];

  if (tavilyApiKey) {
    try {
      const tavily = await searchTavily(query);
      answer = tavily.answer;
      results = tavily.results;
    } catch (error) {
      providerError = error.message;
    }
  } else {
    provider = "bing";
    providerError = "Tavily API Key 未配置，已使用 Bing 兜底";
  }

  if (!results.length) {
    const bingResults = await searchBing(query);
    results = bingResults.map((item) => ({ ...item, source: "bing" }));
    provider = tavilyApiKey ? "tavily-bing-fallback" : "bing";
  }

  return { provider, answer, providerError, results };
}

async function researchMatch(params) {
  const queries = buildResearchQueries(params);
  const categories = [];
  const bbsjUrl = params.sportteryMatchId
    ? `https://m.sporttery.cn/zqlszl/bssj/index.html?mid=${params.sportteryMatchId}`
    : null;

  // 1. 并行抓取 sporttery 官方数据
  let bssjInjury = null;
  let bssjAll = null;
  if (params.sportteryMatchId) {
    const [injury, all] = await Promise.allSettled([
      fetchSportteryInjury(params.sportteryMatchId),
      fetchBssjAll(params.sportteryMatchId),
    ]);
    bssjInjury = injury.status === "fulfilled" ? injury.value : null;
    bssjAll = all.status === "fulfilled" ? all.value : null;
  }

  // 2. 格式化辅助函数
  const formatBssjInjury = () => {
    const { home, away } = bssjInjury;
    const formatTeam = (t) => {
      if (!t.players.length) return `${t.name}：暂无伤停`;
      return [`${t.name}伤停：`, ...t.players.map((p) => {
        const tags = [];
        if (p.isInjured) tags.push("伤病");
        if (p.isSuspended) tags.push("停赛");
        return `  ${p.number}号 ${p.name}（${p.position}）${tags.join("+")}，出场${p.appearances}次/首发${p.starts}次`;
      })].join("\n");
    };
    return formatTeam(home) + "\n" + formatTeam(away);
  };

  const formatBssjMotivation = () => {
    if (!bssjAll?.tables?.tables) return null;
    const t = bssjAll.tables;
    const lines = [`赛事：${t.tournamentShortName || ""} ${t.seasonName || ""}`];
    for (const row of t.tables || []) {
      const g = row.groupName ? `[${row.groupName}] ` : "";
      lines.push(`${g}${row.teamShortName}：排名${row.ranking}，${row.totalLegCnt}场${row.winGoalMatchCnt}胜${row.drawMatchCnt}平${row.lossGoalMatchCnt}负，积分${row.points}（胜率${row.winProbability}）`);
    }

    // 未来赛事（轮换风险）
    if (bssjAll?.future) {
      const { home, away } = bssjAll.future;
      const fmtTeam = (name, list) => {
        if (!list?.length) return null;
        const next3 = list.slice(0, 3).map((m) => `${m.matchDateTime?.slice(0, 10)} ${m.homeTeamShortName} vs ${m.awayTeamShortName}（${m.tournamentShortName}）`);
        return `${name}未来赛事：\n${next3.map((s) => `  ${s}`).join("\n")}`;
      };
      const hf = fmtTeam(home?.teamShortName, home?.matchList);
      const af = fmtTeam(away?.teamShortName, away?.matchList);
      if (hf) lines.push(hf);
      if (af) lines.push(af);
    }
    return lines.join("\n");
  };

  const formatBssjTactics = () => {
    const lines = [];
    const f = bssjAll?.feature;

    // 特征分析
    if (f) {
      if (f.homeTeamShortName && f.awayTeamShortName) {
        const h = f.homeTeamShortName, a = f.awayTeamShortName;

        // 近10场战况 (eachHomeAway)
        if (f.eachHomeAway?.totalLegCnt) {
          const ea = f.eachHomeAway;
          lines.push(`近10场战况：`);
          lines.push(`  ${h}：${ea.homeWinGoalMatchCnt}胜${ea.homeDrawMatchCnt}平${ea.homeLossGoalMatchCnt}负（进球比例${ea.homeScoreRatio}%）`);
          lines.push(`  ${a}：${ea.awayWinGoalMatchCnt}胜${ea.awayDrawMatchCnt}平${ea.awayLossGoalMatchCnt}负（进球比例${ea.awayScoreRatio}%）`);
        }

        // 场均进球/失球
        if (f.goalAvg) {
          lines.push(`场均进球：${h} ${f.goalAvg.homeGoalAvgCnt}球 vs ${a} ${f.goalAvg.awayGoalAvgCnt}球`);
        }
        if (f.lossGoalAvg) {
          lines.push(`场均失球：${h} ${f.lossGoalAvg.homeLossGoalAvgCnt}球 vs ${a} ${f.lossGoalAvg.awayLossGoalAvgCnt}球`);
        }
      }

      // 历史交锋
      if (bssjAll?.resultHistory?.statistics?.totalLegCnt > 0) {
        const s = bssjAll.resultHistory.statistics;
        lines.push(`历史交锋：共${s.totalLegCnt}场，${f.homeTeamShortName} ${s.winGoalMatchCnt}胜${s.drawMatchCnt}平${s.lossGoalMatchCnt}负（胜率${s.winProbability}）`);
      }
    }

    // 近期比赛结果
    if (bssjAll?.matchResult) {
      const { home, away } = bssjAll.matchResult;
      const fmtResults = (name, list, count) => {
        if (!list?.length) return null;
        const recent = list.slice(0, count).map((m) => {
          const result = m.winningTeam === "home" ? (m.homeTeamShortName === name ? "胜" : "负")
            : m.winningTeam === "away" ? (m.awayTeamShortName === name ? "胜" : "负") : "平";
          return `  ${m.matchDate} ${m.homeTeamShortName} ${m.fullCourtGoal} ${m.awayTeamShortName}（${result}）`;
        });
        return `${name}近${count}场：\n${recent.join("\n")}`;
      };
      const hr = fmtResults(home?.teamShortName || "", home?.matchList, 5);
      const ar = fmtResults(away?.teamShortName || "", away?.matchList, 5);
      if (hr) lines.push(hr);
      if (ar) lines.push(ar);
    }

    // 射手信息
    if (bssjAll?.players) {
      const { home, away } = bssjAll.players;
      const fmtScorers = (name, list) => {
        if (!list?.length) return null;
        const top = list.slice(0, 3).map((p) => `${p.personName}(${p.uniformNo}号/${p.playerPositionDesc})：${p.goalCnt}球${p.assistCnt}助`);
        return `${name}射手：\n  ${top.join("\n  ")}`;
      };
      const hs = fmtScorers(home?.teamShortName, home?.playerList);
      const as = fmtScorers(away?.teamShortName, away?.playerList);
      if (hs) lines.push(hs);
      if (as) lines.push(as);
    }

    return lines.length ? lines.join("\n") : null;
  };

  const formatBssjLineup = () => {
    // 首发阵容 bssj 无法提供完整数据，仅输出射手作为补充
    if (!bssjAll?.players) return null;
    const { home, away } = bssjAll.players;
    const lines = ["【注：以下仅为赛事射手数据，非预测首发阵容】"];
    const fmt = (name, list) => {
      if (!list?.length) return `${name}：暂无射手数据`;
      return [`${name}主要射手（${bssjAll.players.seasonName || ""} ${bssjAll.players.tournamentShortName || ""}）：`,
        ...list.slice(0, 5).map((p) => `  ${p.personName}(${p.uniformNo}号/${p.playerPositionDesc})：${p.goalCnt}球${p.assistCnt}助，首发${p.startedMatchCnt}/替补${p.substituteMatchCnt}`)
      ].join("\n");
    };
    return fmt(home?.teamShortName || "主队", home?.playerList || [])
      + "\n" + fmt(away?.teamShortName || "客队", away?.playerList || []);
  };

  // 3. 处理各类别
  const bssjFormatters = {
    injury: { data: bssjInjury, format: formatBssjInjury, signalKey: "injury" },
    motivation: { data: bssjAll?.tables, format: formatBssjMotivation, signalKey: "motivation" },
    tactics: { data: bssjAll?.feature, format: formatBssjTactics, signalKey: "tactics" },
  };

  for (const item of queries) {
    const fmt = bssjFormatters[item.key];

    if (fmt?.data) {
      const summary = fmt.format();
      if (summary) {
        const isInjury = item.key === "injury";
        const titleMap = {
          injury: `${params.home || "主队"} vs ${params.away || "客队"} 官方伤停一览`,
          motivation: `${params.home || "主队"} vs ${params.away || "客队"} 积分榜与赛程`,
          tactics: `${params.home || "主队"} vs ${params.away || "客队"} 特征分析与近况`,
        };
        categories.push({
          ...item,
          key: item.key,
          searchUrl: bbsjUrl,
          ok: true,
          provider: "sporttery-bssj",
          providerError: "",
          answer: summary,
          results: [{
            title: titleMap[item.key] || `${item.label}（官方数据）`,
            url: bbsjUrl,
            snippet: summary,
            source: "sporttery-bssj",
          }],
          signals: { [fmt.signalKey]: true },
          bssjData: isInjury ? { injury: bssjInjury } : { all: bssjAll },
        });
        continue;
      }
    }

    // 首发阵容：bssj 提供射手补充，但仍需联网搜索完整预测阵容
    if (item.key === "lineup" && bssjAll?.players) {
      const supplement = formatBssjLineup();
      if (supplement) {
        const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(item.query)}&setlang=zh-CN&mkt=zh-CN`;
        try {
          const search = await searchResearchCategory(item.query);
          categories.push({
            ...item,
            searchUrl,
            ok: true,
            provider: search.provider,
            providerError: search.providerError,
            answer: supplement + "\n\n" + (search.answer || ""),
            results: [
              { title: "官方射手数据", url: bbsjUrl, snippet: supplement, source: "sporttery-bssj" },
              ...search.results,
            ],
            signals: { ...extractSignals(search.results), lineup: true },
          });
        } catch (error) {
          categories.push({
            ...item, key: "lineup", searchUrl: bbsjUrl, ok: true, provider: "sporttery-bssj",
            answer: supplement, results: [{ title: "官方射手数据", url: bbsjUrl, snippet: supplement, source: "sporttery-bssj" }],
            signals: { lineup: true },
          });
        }
        continue;
      }
    }

    // 回退到联网搜索
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(item.query)}&setlang=zh-CN&mkt=zh-CN`;
    try {
      const search = await searchResearchCategory(item.query);
      categories.push({
        ...item,
        searchUrl,
        ok: true,
        provider: search.provider,
        providerError: search.providerError,
        answer: search.answer,
        results: search.results,
        signals: extractSignals(search.results),
      });
    } catch (error) {
      categories.push({ ...item, searchUrl, ok: false, error: error.message, results: [], signals: {} });
    }
  }

  const totalResults = categories.reduce((sum, item) => sum + item.results.length, 0);
  const categoryHits = categories.reduce((sum, item) => sum + (item.results.length ? 1 : 0), 0);
  const signalCount = categories.reduce((sum, item) => {
    const categoryHit = Boolean(item.signals[item.key]);
    return sum + (categoryHit ? 1 : 0);
  }, 0);
  const label = signalCount >= 4 ? "完整" : signalCount >= 3 ? "较完整" : categoryHits >= 3 ? "可参考" : "不足";
  return {
    ok: true,
    source: categories.some((item) => item.provider?.startsWith("tavily")) ? "tavily-search" : "bing-web-search",
    tavilyConfigured: Boolean(tavilyApiKey),
    fetchedAt: new Date().toISOString(),
    match: params,
    categories,
    bssj: { injury: bssjInjury, all: bssjAll },
    coverage: {
      totalResults,
      categoryHits,
      signalCount,
      score: Math.min(1, (signalCount * 0.18) + Math.min(totalResults, 12) * 0.025),
      label,
    },
  };
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const safePath = normalize(join(publicDir, pathname));
  if (relative(publicDir, safePath).startsWith("..")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const body = await readFile(safePath);
    res.writeHead(200, { "content-type": mime[extname(safePath)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (url.pathname === "/api/sporttery") {
    try {
      const data = await fetchSporttery(url.searchParams.get("pool"));
      json(res, 200, data);
      // Auto-archive — unfiltered, all matches including unknown teams
      updateCollectorDB(data).catch(e => {
        collectorStatus.lastError = e.message;
        console.error("[collector] DB write failed:", e.message);
      });
    } catch (error) {
      collectorStatus.apiHealth = "502";
      collectorStatus.lastError = error.message;
      json(res, 502, { ok: false, error: error.message, fetchedAt: new Date().toISOString() });
    }
    return;
  }

  if (url.pathname === "/api/collector-status") {
    json(res, 200, collectorStatus);
    return;
  }
  if (url.pathname === "/api/results") {
    try {
      json(res, 200, await fetchSportteryResults({
        from: url.searchParams.get("from") || "",
        to: url.searchParams.get("to") || "",
        pageSize: Number(url.searchParams.get("pageSize") || 80),
      }));
    } catch (error) {
      json(res, 502, { ok: false, source: "sporttery-result-webapi", error: error.message, fetchedAt: new Date().toISOString() });
    }
    return;
  }
  if (url.pathname === "/api/research") {
    try {
      const sportteryMatchId = url.searchParams.get("sportteryMatchId");
      json(res, 200, await researchMatch({
        home: url.searchParams.get("home") || "",
        away: url.searchParams.get("away") || "",
        league: url.searchParams.get("league") || "",
        date: url.searchParams.get("date") || "",
        sportteryMatchId: sportteryMatchId ? Number(sportteryMatchId) : null,
      }));
    } catch (error) {
      json(res, 502, { ok: false, error: error.message, fetchedAt: new Date().toISOString() });
    }
    return;
  }
  if (url.pathname === "/api/sporttery-injury") {
    try {
      const mid = url.searchParams.get("mid");
      if (!mid) {
        json(res, 400, { ok: false, error: "缺少 mid 参数（sportteryMatchId）" });
        return;
      }
      json(res, 200, await fetchSportteryInjury(mid));
    } catch (error) {
      json(res, 502, { ok: false, error: error.message, fetchedAt: new Date().toISOString() });
    }
    return;
  }
  if (url.pathname === "/api/sporttery-bssj") {
    try {
      const mid = url.searchParams.get("mid");
      if (!mid) {
        json(res, 400, { ok: false, error: "缺少 mid 参数（sportteryMatchId）" });
        return;
      }
      json(res, 200, await fetchBssjAll(mid));
    } catch (error) {
      json(res, 502, { ok: false, error: error.message, fetchedAt: new Date().toISOString() });
    }
    return;
  }
  if (url.pathname === "/api/clv/record" && req.method === "POST") {
    try {
      const body = await readJsonBody(req);
      const ledger = readCLVLedger();
      const record = {
        match_id: body.match_id,
        kickoff_time: body.kickoff_time,
        target_market: body.target_market || "胜平负",
        selection: body.selection,
        selection_key: body.selection_key || "h",
        bet_time: body.bet_time || new Date().toISOString(),
        taken_odds: body.taken_odds,
        closing_odds: null,
        clv: null,
        status: "pending",
      };
      ledger.push(record);
      writeCLVLedger(ledger);
      json(res, 200, { ok: true, recorded: ledger.length });
      return;
    } catch (error) { json(res, 500, { ok: false, error: error.message }); return; }
  }

  if (url.pathname === "/api/clv/ledger") {
    const ledger = readCLVLedger();
    const pending = ledger.filter(r => r.status === "pending").length;
    const settled = ledger.filter(r => r.status === "settled" || r.status === "settled_fallback");
    const avgCLV = settled.length ? settled.reduce((s, r) => s + (r.clv || 0), 0) / settled.length : 0;
    const positiveCLV = settled.filter(r => (r.clv || 0) > 0).length;
    json(res, 200, { ok: true, total: ledger.length, pending, settled: settled.length, avgCLV: +avgCLV.toFixed(2), positiveCLV, pctPositive: settled.length ? +(positiveCLV / settled.length * 100).toFixed(1) : 0, records: ledger });
    return;
  }

  if (url.pathname === "/api/anysport/live") {
    try {
      const { getLiveMatches, getAPIConfigured } = await import("./anysport-service.js");
      if (!getAPIConfigured()) { json(res, 503, { ok: false, error: "ANYSPORT_API_KEY not configured" }); return; }
      const params = new URL(url, `http://localhost`).searchParams;
      const leagueId = params.get("league_id") || "";
      const result = await getLiveMatches(leagueId);
      json(res, result.ok ? 200 : 502, result);
      return;
    } catch (error) { json(res, 500, { ok: false, error: error.message }); return; }
  }

  if (url.pathname === "/api/v32-inplay") {
    try {
      const body = req.method === "POST" ? await readJsonBody(req) : {};
      const { buildInPlayModel } = await import("./v4-engine.js");
      json(res, 200, buildInPlayModel(body));
    } catch (error) { json(res, 500, { ok: false, error: error.message }); return; }
    return;
  }

  if (url.pathname === "/api/v32-model") {
    try {
      const body = req.method === "POST" ? await readJsonBody(req) : {};
      json(res, 200, buildFullV32Model(body));
    } catch (error) {
      json(res, 500, { ok: false, error: error.message, fetchedAt: new Date().toISOString() });
    }
    return;
  }
  if (url.pathname === "/api/sporttery-calc") {
    try {
      const matchId = url.searchParams.get("matchId") || "";
      const calcUrl = new URL("https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry");
      calcUrl.searchParams.set("matchId", matchId);
      const resp = await fetch(calcUrl, {
        headers: {
          accept: "application/json",
          origin: "https://www.sporttery.cn",
          referer: "https://www.sporttery.cn/jc/zqsgkj/",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      json(res, 200, { ok: true, value: data?.value || data });
    } catch (error) {
      json(res, 502, { ok: false, error: error.message });
    }
    return;
  }
  if (url.pathname === "/api/ttg-scan") {
    try {
      const body = req.method === "POST" ? await readJsonBody(req) : {};
      const { model, match } = body;
      const scanner = new JingcaiScanner(model || {}, match || {});
      json(res, 200, { ok: true, ...scanner.scanAll() });
    } catch (error) {
      json(res, 400, { ok: false, error: error.message });
    }
    return;
  }
  if (url.pathname === "/api/state") {
    try {
      if (req.method === "GET") {
        json(res, 200, await readWorkbenchState());
        return;
      }
      if (req.method === "POST") {
        const body = await readJsonBody(req);
        json(res, 200, await writeWorkbenchState(body.state || body));
        return;
      }
      json(res, 405, { ok: false, error: "Method not allowed" });
    } catch (error) {
      json(res, 500, { ok: false, error: error.message, stateFile });
    }
    return;
  }
  await serveStatic(req, res);
});

export function startServer(options = {}) {
  port = Number(options.port ?? port);
  publicDir = options.publicDir ? normalize(options.publicDir) : publicDir;
  tavilyApiKey = options.tavilyApiKey ?? tavilyApiKey;
  stateFile = options.stateFile ? normalize(options.stateFile) : stateFile;

  // Restore totalRecords from history directory
  import("node:fs").then(({ readdirSync, existsSync, readFileSync }) => {
    try {
      if (existsSync(collectorStatus.historyDir)) {
        const files = readdirSync(collectorStatus.historyDir).filter(f => f.endsWith(".json"));
        for (const f of files) {
          try {
            const raw = JSON.parse(readFileSync(join(collectorStatus.historyDir, f), "utf-8"));
            collectorStatus.totalRecords += (raw.matches?.length || 0);
          } catch {}
        }
      }
    } catch {}
  }).catch(() => {});

  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      console.log(`Sporttery V3.2 Workbench running at http://127.0.0.1:${actualPort}`);
      // Phase 1.2: auto-monitor daemon — silent refresh every 30 min, notify on edge surge
      startAutoMonitor();
      resolve({ server, port: actualPort });
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "127.0.0.1");
  });
}

const isDirectRun = process.argv[1]
  && normalize(fileURLToPath(import.meta.url)) === normalize(process.argv[1]);

// ===== CLV Ledger (Layer 1: Immutable Ledger) =====
const { readFileSync, writeFileSync, existsSync, mkdirSync } = await import("fs");
const appDataPath = (process.env.APPDATA || process.env.XDG_DATA_HOME || root);
const CLV_LEDGER_DIR = join(appDataPath, "sporttery-v32-workbench");
const CLV_LEDGER_PATH = join(CLV_LEDGER_DIR, "clv_ledger.json");

function readCLVLedger() {
  try { return JSON.parse(readFileSync(CLV_LEDGER_PATH, "utf-8")); }
  catch { return []; }
}
function writeCLVLedger(records) {
  if (!existsSync(CLV_LEDGER_DIR)) mkdirSync(CLV_LEDGER_DIR, { recursive: true });
  writeFileSync(CLV_LEDGER_PATH, JSON.stringify(records, null, 2), "utf-8");
}

// ===== Edge Monitor + CLV Snapshot Cache (for T-10 fallback) =====
let lastOddsSnapshot = {};
let lastSnapshotTime = null;

function captureOddsSnapshot(matches) {
  for (const m of matches) {
    const h = m.pools?.had?.find(i => i.key === "h")?.odds;
    const d = m.pools?.had?.find(i => i.key === "d")?.odds;
    const a = m.pools?.had?.find(i => i.key === "a")?.odds;
    if (h && d && a) lastOddsSnapshot[String(m.id)] = { h, d, a, capturedAt: new Date().toISOString() };
  }
  lastSnapshotTime = new Date().toISOString();
}

// ===== Layer 2+3: Chrono Daemon + Snapshot & Fallback =====
function startAutoMonitor() {
  const SCAN_MS = 60 * 1000; // 1 min scan
  setInterval(async () => {
    try {
      const had = await fetchSporttery("had");
      if (!had.ok || !had.matches?.length) return;

      // Update edge monitor snapshot (for T-10 fallback)
      captureOddsSnapshot(had.matches);

      const now = Date.now();
      const ledger = readCLVLedger();
      let updated = false;

      for (const record of ledger) {
        if (record.status !== "pending") continue;
        const kickoff = new Date(record.kickoff_time).getTime();
        const minutesToKO = (kickoff - now) / 60000;
        // Trigger at T-5: capture closing odds
        if (minutesToKO <= 5 && minutesToKO > -30 && !record.closing_odds) {
          const mid = had.matches.find(m => String(m.id) === String(record.match_id));
          if (mid) {
            const playOdds = mid.pools?.[record.target_market === "让球胜平负" ? "hhad" : "had"];
            const sel = playOdds?.find(i => i.key === record.selection_key)?.odds;
            if (sel) {
              record.closing_odds = sel;
              record.clv = ((record.taken_odds / sel) - 1) * 100;
              record.status = "settled";
              record.settled_at = new Date().toISOString();
              updated = true;
            }
          }
        }
        // Fallback: T-10 or earlier snapshot if still not settled
        if (minutesToKO <= -10 && !record.closing_odds) {
          const snap = lastOddsSnapshot[String(record.match_id)];
          if (snap) {
            const sel = snap[record.selection_key] || snap.h;
            if (sel) {
              record.closing_odds = sel;
              record.clv = ((record.taken_odds / sel) - 1) * 100;
              record.status = "settled_fallback";
              record.settled_at = new Date().toISOString();
              updated = true;
            }
          }
        }
      }
      if (updated) writeCLVLedger(ledger);

      // Edge surge detection
      const changed = [];
      for (const match of had.matches) {
        const favEdge = Math.abs((1/(match.pools?.had?.find(i=>i.key==="h")?.odds||2)) - (1/(match.pools?.had?.find(i=>i.key==="a")?.odds||2)));
        const key = match.id || match.number;
        const prev = lastEdgeSnapshot[key]?.h ? Math.abs((1/lastEdgeSnapshot[key].h) - (1/lastEdgeSnapshot[key].a)) : undefined;
        if (prev !== undefined && Math.abs(favEdge - prev) > 0.05) {
          changed.push({ key, home: match.homeShort, away: match.awayShort, prevEdge: prev, newEdge: favEdge });
        }
      }
      if (changed.length) {
        console.log(`[EDGE-SURGE] ${new Date().toISOString()} — ${changed.length} matches:`,
          changed.map(c => `${c.home} vs ${c.away}`).join(", "));
      }
    } catch (e) { /* silent */ }
  }, SCAN_MS);
}

if (isDirectRun) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
