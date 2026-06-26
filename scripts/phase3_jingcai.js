/**
 * Phase 3: Jingcai World Cup Synthetic Odds + Backtest
 * Simulates sporttery's asymmetric vig on popular teams
 */
import { readFileSync, writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const DATA = "D:/1/omega-copula-engine/wc_data/wc_euro_mvp.json";
const matches = JSON.parse(readFileSync(DATA, "utf-8"));

const BANKROLL = 10000, MIN_EV = 0.025, DIV_CAP = 1.5, KELLY_MULT = 0.25, MAX_PCT = 0.05;

// Popular teams — Jingcai applies EXTRA vig on these
const POPULAR = new Set([
  "Brazil", "Argentina", "Germany", "England", "France",
  "Spain", "Netherlands", "Portugal", "Italy", "Belgium"
]);

function isKnockout(tournament, i) {
  if (tournament === "World Cup 2014") return i >= 48;
  if (tournament === "Euro 2016") return i >= 36;
  return false;
}

function devig(h, d, a) {
  const s = 1/h + 1/d + 1/a;
  return { h: (1/h)/s, d: (1/d)/s, a: (1/a)/s };
}

// Jingcai asymmetric vig simulation
function jingcaiSP(trueProb, isHome, isPopularFavorite, isPopularUnderdog) {
  // Base return rate: 82%
  // Popular favorite: crushed to 75% return (25% vig)
  // Popular underdog: kept at 90% return (10% vig — market wants to attract contrarian bets)
  // Normal match: 85% return
  let rate;
  if (isPopularFavorite) rate = 0.75;
  else if (isPopularUnderdog) rate = 0.90;
  else rate = 0.85;

  return +(rate / trueProb).toFixed(2);
}

function selector(prob, odds, trueImp) {
  if (!Number.isFinite(prob) || odds <= 1) return null;
  if (odds > 8 || prob < 0.20) return null;
  const ev = prob * odds - 1;
  if (ev <= MIN_EV) return null;
  if (trueImp > 0 && prob / trueImp > DIV_CAP) return null;
  const fk = Math.min((ev / (odds - 1)) * KELLY_MULT, MAX_PCT);
  if (fk < 0.002) return null;
  return { ev, fk, stake: Math.max(2, Math.round(BANKROLL * fk / 2) * 2) };
}

// ── Generate B365 baseline EV distribution for comparison ──
console.log("Phase 3: Jingcai Synthetic Odds Simulation\n" + "=".repeat(55));

let bankroll_jc = BANKROLL, bankroll_b365 = BANKROLL;
const bets_jc = [], bets_b365 = [];
let rejects_jc = 0, rejects_b365 = 0;

for (let i = 0; i < matches.length; i++) {
  const m = matches[i];
  if (!m.b365h) continue;
  const ko = isKnockout(m.tournament, i);

  // Run V4 engine once, use for both B365 and Jingcai
  const match = {
    home: m.home, away: m.away,
    pools: { had: [{key:"h",odds:m.b365h},{key:"d",odds:m.b365d},{key:"a",odds:m.b365a}] },
  };
  let model;
  try {
    const out = buildFullV32Model({
      match, research: null,
      controls: { matchStage: ko ? "knockout" : "group", motivation: ko ? "must_win" : "neutral" },
      drawState: { matchesPlayed: i % 64, draws: Math.round(i * 0.25) },
    });
    model = out.model;
  } catch (e) { continue; }
  if (!model?.states) continue;

  const mkt = devig(m.b365h, m.b365d, m.b365a);
  const probs = { h: model.states.h, d: model.states.d, a: model.states.a };

  // Determine Jingcai vig bias
  const homePop = POPULAR.has(m.home), awayPop = POPULAR.has(m.away);
  const favSide = mkt.h >= mkt.a ? "h" : "a";
  const isPopularFav = (favSide === "h" && homePop) || (favSide === "a" && awayPop);
  const isPopularDog = (favSide === "h" && awayPop) || (favSide === "a" && homePop);

  // Generate Jingcai SP from MARKET consensus (B365 devigged), not model
  // This creates a fair test: can V4 find edges against asymmetric-vig SP?
  const sp_jc = {
    h: jingcaiSP(mkt.h, true, favSide==="h" && homePop, favSide==="h" && awayPop),
    d: jingcaiSP(mkt.d, false, false, false),
    a: jingcaiSP(mkt.a, false, favSide==="a" && awayPop, favSide==="a" && homePop),
  };

  // Compare: B365 (fair) vs Jingcai (asymmetric vig)
  for (const [label, odds, bankrollStart, betsArr, rejCounter] of [
    ["B365", {h:m.b365h,d:m.b365d,a:m.b365a}, bankroll_b365, bets_b365, "b365"],
    ["Jingcai", sp_jc, bankroll_jc, bets_jc, "jc"],
  ]) {
    let best = null, bestEV = -Infinity;
    for (const k of ["h","d","a"]) {
      const res = selector(probs[k], odds[k], mkt[k]);
      if (!res) {
        if (label === "Jingcai") rejects_jc++; else rejects_b365++;
        continue;
      }
      if (res.ev > bestEV) { best = {key:k, odds:odds[k], prob:probs[k], imp:mkt[k], ...res}; bestEV = res.ev; }
    }
    if (!best || best.stake <= 0) continue;

    const won = (best.key==="h" && m.fthg>m.ftag) || (best.key==="d" && m.fthg===m.ftag) || (best.key==="a" && m.fthg<m.ftag);
    const profit = won ? best.stake * best.odds - best.stake : -best.stake;

    if (label === "Jingcai") {
      bankroll_jc += profit;
      bets_jc.push({home:m.home,away:m.away,score:m.fthg+":"+m.ftag,key:best.key,odds:best.odds,ev:best.ev,stake:best.stake,won,profit,ko});
    } else {
      bankroll_b365 += profit;
      bets_b365.push({home:m.home,away:m.away,score:m.fthg+":"+m.ftag,key:best.key,odds:best.odds,ev:best.ev,stake:best.stake,won,profit});
    }
  }
}

// ── Report ─────────────────────────────────────────────────
function summarize(label, bets, bankroll, rejects) {
  const won = bets.filter(b => b.won).length;
  const pnl = bankroll - BANKROLL;
  const theory = bets.reduce((s,b) => s + b.ev * b.stake, 0);
  const ratio = theory ? pnl / theory : 0;
  const koBets = bets.filter(b => b.ko);
  console.log(`\n[${label}]`);
  console.log(`  Bets: ${bets.length} | Hit: ${won} (${(won/bets.length*100).toFixed(1)}%) | Rejected: ${rejects}`);
  console.log(`  PnL: ${pnl>=0?"+":""}¥${Math.round(pnl)} (${(pnl/BANKROLL*100).toFixed(2)}%)`);
  console.log(`  EV比: ${ratio.toFixed(2)}x | Theory: ¥${Math.round(theory)}`);
  if (koBets.length) {
    const koWon = koBets.filter(b => b.won).length;
    console.log(`  KO: ${koBets.length} bets, ${koWon} won (${(koWon/koBets.length*100).toFixed(1)}%)`);
  }
}

summarize("B365 (fair market)", bets_b365, bankroll_b365, rejects_b365);
summarize("Jingcai (asymmetric vig)", bets_jc, bankroll_jc, rejects_jc);

// Compare Jingcai vs B365
const jcPnl = bankroll_jc - BANKROLL;
const b365Pnl = bankroll_b365 - BANKROLL;
console.log(`\n${"=".repeat(55)}`);
console.log(`  Jingcai penalty: ${(jcPnl - b365Pnl) >= 0 ? "+" : ""}¥${Math.round(jcPnl - b365Pnl)}`);
console.log(`  B365 ROI: ${(b365Pnl/BANKROLL*100).toFixed(2)}% → Jingcai ROI: ${(jcPnl/BANKROLL*100).toFixed(2)}%`);
