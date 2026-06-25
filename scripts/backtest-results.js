/**
 * V4.0 回测 — 从本地 API 获取赛果 + 从 live-matches 合并赔率
 * Usage: node scripts/backtest-results.js
 */
import { readFileSync, writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const KELLY_MULT = 0.25, MAX_PCT = 0.05, BANKROLL = 10000, MIN_EV = 0.05, MAX_ODDS = 15;
const API_BASE = "http://127.0.0.1:4173";

async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  // Step 1: Get results
  console.log("Fetching results from local API...");
  let allResults = [];
  for (const dateRange of [
    ["2026-06-01", "2026-06-10"],
    ["2026-06-11", "2026-06-20"],
    ["2026-06-21", "2026-06-25"],
  ]) {
    const data = await fetchJSON(`${API_BASE}/api/results?from=${dateRange[0]}&to=${dateRange[1]}&pageSize=80`);
    const withResult = (data.matches || []).filter(m => m.result?.full?.h != null);
    allResults.push(...withResult);
    console.log(`  ${dateRange[0]}~${dateRange[1]}: ${withResult.length} results`);
  }
  console.log(`Total results: ${allResults.length}`);

  // Step 2: Get odds from live-matches or sync
  const liveFile = "../omega-copula-engine/live-matches.json";
  let liveMatches = [];
  try { liveMatches = JSON.parse(readFileSync(liveFile, "utf-8")); } catch {}
  const oddsByMatchId = new Map();
  for (const m of liveMatches) {
    const pools = {};
    for (const pt of ["had","hhad","ttg"]) {
      if (Array.isArray(m[pt]) && m[pt].length) pools[pt] = m[pt];
    }
    if (Object.keys(pools).length) oddsByMatchId.set(String(m.id), { ...m, pools });
  }

  // Step 3: Merge results + odds
  const matches = [];
  for (const rm of allResults) {
    const id = String(rm.id);
    const odds = oddsByMatchId.get(id);
    if (!odds) continue; // skip matches without odds pools
    matches.push({
      id, number: rm.number || odds.number || "",
      home: rm.home || odds.home || "", away: rm.away || odds.away || "",
      homeShort: rm.homeShort || odds.homeShort || "", awayShort: rm.awayShort || odds.awayShort || "",
      matchDate: rm.matchDate || odds.matchDate || "", matchTime: rm.matchTime || odds.matchTime || "",
      hhadGoalLine: Number(rm.hhadGoalLine || odds.hhadGoalLine || 0),
      pools: odds.pools,
      result: rm.result,
    });
  }
  console.log(`Merged (result + odds): ${matches.length}\n`);

  // Step 4: Run backtest
  let bankroll = BANKROLL;
  const bets = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    let model;
    try {
      const r = buildFullV32Model({
        match: m, research: null,
        controls: { matchStage: "group", motivation: "neutral" },
        drawState: { matchesPlayed: i, draws: 0 },
      });
      model = r.model;
    } catch (e) { continue; }
    if (!model?.byPlay) continue;

    let best = null, bestEV = -Infinity;
    for (const play of ["had","hhad","ttg"]) {
      const pool = m.pools[play] || [];
      const probs = model.byPlay[play] || {};
      for (const item of pool) {
        const prob = probs[item.key];
        if (!Number.isFinite(prob) || prob <= 0) continue;
        if (item.odds > MAX_ODDS) continue;
        const ev = prob * item.odds - 1;
        if (ev <= MIN_EV || ev <= bestEV) continue;
        best = { play, key: item.key, label: item.label || item.key, odds: item.odds, prob, ev };
        bestEV = ev;
      }
    }
    if (!best) { console.log(`[${i+1}] ${m.homeShort} vs ${m.awayShort} — no value`); continue; }

    const stake = Math.max(2, Math.round(bankroll * Math.min((bestEV / (best.odds - 1)) * KELLY_MULT, MAX_PCT) / 2) * 2);
    if (stake <= 0) continue;

    // Settle
    const r = m.result;
    let won = false;
    if (best.play === "had") {
      if (r.full.h > r.full.a && best.key === "h") won = true;
      else if (r.full.h === r.full.a && best.key === "d") won = true;
      else if (r.full.h < r.full.a && best.key === "a") won = true;
    } else if (best.play === "hhad") {
      const adj = r.full.h + (m.hhadGoalLine || 0) - r.full.a;
      if (adj > 0 && best.key === "h") won = true;
      else if (adj === 0 && best.key === "d") won = true;
      else if (adj < 0 && best.key === "a") won = true;
    } else {
      const total = r.full.h + r.full.a;
      if (best.key === `s${total >= 7 ? 7 : total}`) won = true;
    }
    const profit = won ? stake * best.odds - stake : -stake;
    bankroll += profit;

    bets.push({
      home: m.homeShort, away: m.awayShort, date: m.matchDate,
      play: best.play, label: best.label, odds: best.odds,
      modelProb: best.prob, ev: bestEV,
      stake, positionPct: stake / (bankroll - profit),
      won, profit, score: `${r.full.h}:${r.full.a}`,
    });

    console.log(`[${i+1}] ${won ? "✅" : "❌"} ${bets[bets.length-1].home} vs ${bets[bets.length-1].away} | ${best.play}·${best.label} @${best.odds} | EV ${bestEV >= 0 ? "+" : ""}${(bestEV*100).toFixed(1)}% | ${(bets[bets.length-1].positionPct*100).toFixed(1)}% ¥${stake} | ${profit >= 0 ? "+" : ""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
  }

  // ── Report ─────────────────────────────────────────────────
  const won_count = bets.filter(b => b.won).length;
  const totalPnL = bankroll - BANKROLL;
  const theoreticalEV = bets.reduce((s, b) => s + b.ev * b.stake, 0);
  const evRatio = theoreticalEV !== 0 ? totalPnL / theoreticalEV : 0;

  const rpt = [
    "=".repeat(60),
    "  V4.0 回测报告",
    "=".repeat(60),
    `  数据范围: 2026-06-01 ~ 2026-06-25`,
    `  赛果数: ${allResults.length} | 含赔率: ${matches.length} | 投注: ${bets.length}`,
    `  初始资金: ¥${BANKROLL.toLocaleString()}`,
    `  最终资金: ¥${Math.round(bankroll).toLocaleString()}  (${((bankroll/BANKROLL-1)*100 >= 0 ? "+" : "")}${((bankroll/BANKROLL-1)*100).toFixed(2)}%)`,
    `  命中率:   ${won_count}/${bets.length} (${(won_count/bets.length*100).toFixed(1)}%)`,
    `  实际盈亏: ¥${Math.round(totalPnL).toLocaleString()}`,
    `  理论 EV:  ¥${Math.round(theoreticalEV).toLocaleString()}`,
    `  EV/实际比: ${evRatio >= 0 ? "+" : ""}${evRatio.toFixed(2)}x`,
    `  判定:     ${evRatio > 0.5 ? "✅ EV 预测方向正确" : evRatio > 0 ? "⚠️ EV 偏乐观" : "🔴 EV 与实际反向"}`,
    "-".repeat(60),
  ].join("\n");
  console.log("\n" + rpt);

  const reportFile = "backtest-report-2026-06.json";
  writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    engine: "V4.0 NB+Copula+DC+xG",
    config: { kellyMult: KELLY_MULT, maxPct: MAX_PCT, bankroll: BANKROLL, minEv: MIN_EV },
    summary: {
      totalBets: bets.length, won: won_count, winRate: bets.length ? won_count / bets.length : 0,
      initialBankroll: BANKROLL, finalBankroll: bankroll, return: bankroll / BANKROLL - 1,
      totalPnL, theoreticalEV, evRatio,
    },
    bets,
  }, null, 2));
  console.log(`报告: ${reportFile}`);
}

main().catch(e => { console.error(e); process.exit(1); });
