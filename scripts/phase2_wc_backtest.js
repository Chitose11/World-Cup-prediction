/**
 * Phase 2: National Team Environment Calibration
 * WC 2014 + Euro 2016 — 115 matches
 *
 * Calibrations:
 * 1. Match importance tagging (group/knockout)
 * 2. Re-enable Dixon-Coles for knockout stages (ρ=0.02)
 * 3. NB dispersion: lower r for knockout (more draws)
 * 4. Compare with/without calibrations
 */
import { readFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const DATA = "D:/1/omega-copula-engine/wc_data/wc_euro_mvp.json";
const matches = JSON.parse(readFileSync(DATA, "utf-8"));

const BANKROLL = 10000, MIN_EV = 0.025, DIV_CAP = 1.5, KELLY_MULT = 0.25, MAX_PCT = 0.05;

// ── Knockout detection ──────────────────────────────────────
// Group stage: matchday 1-3. Knockout: R16 onwards
// We know WC/Euro schedule: if match_num > group_stage_count → knockout
function isKnockout(tournament, matchIndex, totalMatches) {
  // WC 2014: 64 matches, first 48 = group, last 16 = knockout
  // Euro 2016: 51 matches, first 36 = group, last 15 = knockout (24-team format)
  if (tournament === "World Cup 2014") return matchIndex >= 48;
  if (tournament === "Euro 2016") return matchIndex >= 36;
  return matchIndex >= totalMatches * 0.7; // heuristic
}

// ── Selector ─────────────────────────────────────────────────
function select(prob, odds, trueImplied) {
  if (!Number.isFinite(prob) || !Number.isFinite(odds) || odds <= 1) return null;
  if (odds > 8) return null;
  if (prob < 0.20) return null;
  const ev = prob * odds - 1;
  if (ev <= MIN_EV) return null;
  if (trueImplied > 0 && prob / trueImplied > DIV_CAP) return null;
  const fullKelly = ev / (odds - 1);
  const fracKelly = Math.min(fullKelly * KELLY_MULT, MAX_PCT);
  if (fracKelly < 0.002) return null;
  const stake = Math.max(2, Math.round(BANKROLL * fracKelly / 2) * 2);
  return { ev, fracKelly, stake };
}

// ── Run ──────────────────────────────────────────────────────
function runBacktest(label) {
  let bankroll = BANKROLL;
  let peak = BANKROLL, trough = BANKROLL;
  const bets = [];
  let rejects = 0, koCount = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m.b365h) continue;

    const ko = isKnockout(m.tournament, i, matches.length);
    if (ko) koCount++;

    const match = {
      home: m.home, away: m.away,
      pools: { had: [{key:"h",odds:m.b365h},{key:"d",odds:m.b365d},{key:"a",odds:m.b365a}] },
    };

    let model;
    try {
      const stage = ko ? "knockout" : "group";
      const out = buildFullV32Model({
        match, research: null,
        controls: { matchStage: stage, motivation: ko ? "must_win" : "neutral" },
        drawState: { matchesPlayed: i % 64, draws: Math.round(i * 0.25) },
      });
      model = out.model;
    } catch (e) { continue; }
    if (!model?.states) continue;

    const mktH = 1/m.b365h / (1/m.b365h + 1/m.b365d + 1/m.b365a);

    const candidates = [
      {key:"h", prob: model.states.h, odds: m.b365h, imp: mktH},
      {key:"d", prob: model.states.d, odds: m.b365d, imp: (1/m.b365d)/(1/m.b365h+1/m.b365d+1/m.b365a)},
      {key:"a", prob: model.states.a, odds: m.b365a, imp: (1/m.b365a)/(1/m.b365h+1/m.b365d+1/m.b365a)},
    ];

    let best = null, bestEV = -Infinity;
    for (const c of candidates) {
      const res = select(c.prob, c.odds, c.imp);
      if (!res) { rejects++; continue; }
      if (res.ev > bestEV) { best = {...c, ...res}; bestEV = res.ev; }
    }
    if (!best || best.stake <= 0) continue;

    const won =
      (best.key === "h" && m.fthg > m.ftag) ||
      (best.key === "d" && m.fthg === m.ftag) ||
      (best.key === "a" && m.fthg < m.ftag);
    const profit = won ? best.stake * best.odds - best.stake : -best.stake;
    bankroll += profit;
    if (bankroll > peak) peak = bankroll;
    if (bankroll < trough) trough = bankroll;

    bets.push({
      tournament: m.tournament, date: m.date, home: m.home, away: m.away,
      score: `${m.fthg}:${m.ftag}`, ko,
      pick: best.key, odds: best.odds, prob: best.prob, ev: best.ev,
      kelly: best.fracKelly, stake: best.stake, won, profit,
    });
  }

  const won = bets.filter(b => b.won).length;
  const pnl = bankroll - BANKROLL;
  const theory = bets.reduce((s, b) => s + b.ev * b.stake, 0);
  const ratio = theory ? pnl / theory : 0;
  const maxDD = ((trough - peak) / peak * 100);
  const koBets = bets.filter(b => b.ko);
  const gpBets = bets.filter(b => !b.ko);

  console.log(`\n[${label}]`);
  console.log(`  Matches: ${matches.length} (KO: ${koCount}) | Bets: ${bets.length} (KO: ${koBets.length})`);
  console.log(`  Hit: ${won}/${bets.length} (${(won/bets.length*100).toFixed(1)}%)`);
  console.log(`  PnL: ${pnl >= 0 ? "+" : ""}¥${Math.round(pnl)} (${(pnl/BANKROLL*100).toFixed(2)}%) | MaxDD: ${maxDD.toFixed(1)}%`);
  console.log(`  KO hit rate: ${koBets.length ? (koBets.filter(b=>b.won).length/koBets.length*100).toFixed(1) : "N/A"}%`);
  console.log(`  GP hit rate: ${gpBets.length ? (gpBets.filter(b=>b.won).length/gpBets.length*100).toFixed(1) : "N/A"}%`);
  console.log(`  EV比: ${ratio.toFixed(2)}x | Theory: ¥${Math.round(theory)}`);

  return { bets, pnl, ratio, won, bankroll, maxDD, koBets, gpBets };
}

// ── Run comparison ──────────────────────────────────────────
console.log("Phase 2: National Team Calibration");
console.log("=".repeat(55));

// Current state: DC disabled, r capped at 30, Elo stretch active, knockout detection
const r = runBacktest("V4 current (DC off, r≤30, Elo stretch, KO stage)");

// Quick summary
const koHits = r.koBets.filter(b => b.won).length;
const gpHits = r.gpBets.filter(b => b.won).length;
console.log(`\nKO picks: ${r.koBets.length} bets, ${koHits} won (${r.koBets.length ? (koHits/r.koBets.length*100).toFixed(1) : "N/A"}%)`);
console.log(`GP picks: ${r.gpBets.length} bets, ${gpHits} won (${r.gpBets.length ? (gpHits/r.gpBets.length*100).toFixed(1) : "N/A"}%)`);
