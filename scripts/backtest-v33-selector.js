import fs from "node:fs";
import { buildFullV32Model } from "../src/v32-engine.js";

const inputPath = process.argv[2] || "backtest-results-2026-06-11-22.json";
const outputPath = process.argv[3] || "backtest-v33-selector-2026-06-11-22.json";

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8").replace(/^\uFEFF/, ""));
}

function seq(match) {
  return Number(String(match.number || "").match(/(\d+)$/)?.[1] || 0);
}

function poolHad(match) {
  return ["h", "d", "a"]
    .map((key) => ({ key, label: key, odds: Number(match.rawResult?.[key]) }))
    .filter((item) => Number.isFinite(item.odds) && item.odds > 1);
}

function impliedMap(items) {
  const inv = items
    .map((item) => ({ key: item.key, prob: 1 / item.odds }))
    .filter((item) => Number.isFinite(item.prob));
  const total = inv.reduce((sum, item) => sum + item.prob, 0) || 1;
  return Object.fromEntries(inv.map((item) => [item.key, item.prob / total]));
}

function topKey(map) {
  return Object.entries(map || {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || null;
}

function actualWdl(match) {
  const { h, a } = match.result.full;
  return h > a ? "h" : h === a ? "d" : "a";
}

function safeHit(states, actual) {
  const low = Object.entries(states).sort((a, b) => a[1] - b[1])[0]?.[0];
  return actual !== low;
}

function modelPlanContext(match, model) {
  const states = model?.states || {};
  const homeProb = Number(states.h) || 0;
  const drawProb = Number(states.d) || 0;
  const awayProb = Number(states.a) || 0;
  const favoriteSide = homeProb >= awayProb ? "h" : "a";
  const signals = model?.meta?.layers?.signals || {};
  const gradeText = String(model?.meta?.grade?.grade || "");
  const market = model?.meta?.layers?.market || {};
  const marketFavoriteSide = (market.h || 0) >= (market.a || 0) ? "h" : "a";
  const dangerZone = Boolean(signals.dangerZone || model?.meta?.layers?.correction?.dangerZone);
  return {
    favoriteSide,
    drawProb,
    favoriteProb: Math.max(homeProb, awayProb),
    lowBlockPenalty: Boolean(signals.lowBlockConversionPenalty || signals.unstableFavorite || model?.meta?.profile === "defensive-favorite"),
    drawPressure: drawProb >= 0.34 || Math.max(homeProb, awayProb) - drawProb < 0.14,
    dangerZone,
    gradeText,
    marketDisagreement: marketFavoriteSide !== favoriteSide,
  };
}

function scoreHadCandidate(row, context, mode) {
  const prob = Number(row.modelProb);
  const odds = Number(row.odds);
  const ev = Number.isFinite(row.ev) ? row.ev : (prob * odds) - 1;
  if (!Number.isFinite(prob) || !Number.isFinite(odds) || !Number.isFinite(ev) || ev <= 0) return null;
  if (context.dangerZone) return null;
  if (row.key !== context.favoriteSide && row.key !== "d" && mode === "conservative") return null;
  if (row.key !== context.favoriteSide && row.key !== "d" && (prob < 0.30 || ev < 0.18)) return null;
  if (context.marketDisagreement && row.key === context.favoriteSide && row.key !== "d") {
    if (mode === "conservative" && odds >= 3.2) return null;
    if (mode === "aggressive" && (odds >= 7 || (prob < 0.38 && ev < 0.35))) return null;
  }
  let riskMultiplier = 1;
  if (context.gradeText.includes("D")) riskMultiplier *= 0.35;
  else if (context.gradeText.includes("C")) riskMultiplier *= 0.62;
  else if (context.gradeText.includes("B")) riskMultiplier *= 0.84;
  if (context.marketDisagreement) riskMultiplier *= mode === "aggressive" ? 0.85 : 0.70;
  if (row.key === context.favoriteSide && context.drawPressure && context.favoriteProb < 0.58) riskMultiplier *= 0.72;
  if (row.key === "d" && !context.lowBlockPenalty && context.drawProb < 0.34) riskMultiplier *= 0.72;
  const rawKelly = odds > 1 ? Math.max(0, ev / (odds - 1)) : 0;
  const kellyFraction = rawKelly * (mode === "aggressive" ? 0.5 : 0.25) * riskMultiplier;
  if (kellyFraction < (mode === "aggressive" ? 0.004 : 0.006)) return null;
  const score = (ev * 1.8) + (kellyFraction * 2.4) + (prob * 0.22);
  return {
    ...row,
    ev,
    rawKellyFraction: rawKelly,
    kellyFraction,
    score,
    confidence: kellyFraction >= 0.04 && ev >= 0.08 ? "A"
      : kellyFraction >= 0.02 && ev >= 0.04 ? "B"
        : kellyFraction >= 0.008 ? "C"
          : "D",
  };
}

function selectorPick(match, model, mode) {
  const items = poolHad(match);
  const implied = impliedMap(items);
  const context = modelPlanContext(match, model);
  return items
    .map((item) => {
      const modelProb = model.byPlay.had?.[item.key];
      return {
        ...item,
        play: "had",
        impliedProb: implied[item.key],
        modelProb,
        edge: Number.isFinite(modelProb) ? modelProb - implied[item.key] : null,
        ev: Number.isFinite(modelProb) ? (modelProb * item.odds) - 1 : null,
      };
    })
    .map((row) => scoreHadCandidate(row, context, mode))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)[0] || null;
}

function settlePick(pick, actual) {
  if (!pick) return { selected: false, won: false, stake: 0, returned: 0, profit: 0 };
  const stake = 2;
  const won = pick.key === actual;
  const returned = won ? stake * pick.odds : 0;
  return { selected: true, won, stake, returned, profit: returned - stake };
}

function summarize(rows, pickField) {
  const prefix = pickField.replace(/Pick$/, "");
  const n = rows.length;
  const picks = rows.filter((row) => row[pickField]);
  const wins = picks.filter((row) => row[`${prefix}Won`]);
  const stake = picks.reduce((sum, row) => sum + row[`${prefix}Stake`], 0);
  const returned = picks.reduce((sum, row) => sum + row[`${prefix}Return`], 0);
  return {
    matches: n,
    modelWdl: `${rows.filter((row) => row.modelHit).length}/${n}`,
    modelWdlRate: n ? rows.filter((row) => row.modelHit).length / n : null,
    safeDirection: `${rows.filter((row) => row.safeHit).length}/${n}`,
    safeRate: n ? rows.filter((row) => row.safeHit).length / n : null,
    selected: `${picks.length}/${n}`,
    hit: `${wins.length}/${picks.length}`,
    hitRate: picks.length ? wins.length / picks.length : null,
    stake,
    returned,
    profit: returned - stake,
    roi: stake ? (returned - stake) / stake : null,
  };
}

const raw = readJson(inputPath);
const matches = raw.matches
  .filter((match) => match.rawResult?.leagueId === 72 && match.result?.full)
  .sort((a, b) => seq(a) - seq(b));

let matchesPlayed = 0;
let draws = 0;
const rows = [];

for (const match of matches) {
  const model = buildFullV32Model({
    match: { ...match, pools: { had: poolHad(match) } },
    controls: { matchStage: "group", motivation: "neutral" },
    drawState: { matchesPlayed, draws },
  }).model;
  const actual = actualWdl(match);
  const modelPick = topKey(model.states);
  const conservativePick = selectorPick(match, model, "conservative");
  const aggressivePick = selectorPick(match, model, "aggressive");
  const conservative = settlePick(conservativePick, actual);
  const aggressive = settlePick(aggressivePick, actual);
  rows.push({
    seq: seq(match),
    number: match.number,
    match: `${match.home} vs ${match.away}`,
    score: `${match.result.full.h}-${match.result.full.a}`,
    actual,
    modelPick,
    modelHit: modelPick === actual,
    safeHit: safeHit(model.states, actual),
    modelActualProb: model.states[actual],
    knownBoth: model.meta.home.archetype !== "unknown" && model.meta.away.archetype !== "unknown",
    conservativePick,
    conservativeWon: conservative.won,
    conservativeStake: conservative.stake,
    conservativeReturn: conservative.returned,
    aggressivePick,
    aggressiveWon: aggressive.won,
    aggressiveStake: aggressive.stake,
    aggressiveReturn: aggressive.returned,
  });
  matchesPlayed += 1;
  if (actual === "d") draws += 1;
}

const output = {
  generatedAt: new Date().toISOString(),
  source: "sporttery result API snapshot; HAD odds only in historical result payload",
  limitation: "Historical result payload contains HAD odds and goalLine, but not historical hhad/ttg/hafu/crs odds. Selector settlement here verifies the V2 positive-EV HAD selector only.",
  finalDrawState: { matchesPlayed, draws },
  full: {
    conservative: summarize(rows, "conservativePick"),
    aggressive: summarize(rows, "aggressivePick"),
  },
  sampleOutFrom023: {
    conservative: summarize(rows.filter((row) => row.seq >= 23), "conservativePick"),
    aggressive: summarize(rows.filter((row) => row.seq >= 23), "aggressivePick"),
  },
  rows,
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf8");
console.log(JSON.stringify({
  finalDrawState: output.finalDrawState,
  full: output.full,
  sampleOutFrom023: output.sampleOutFrom023,
  outputPath,
}, null, 2));
