/**
 * V4.0 Final Backtest — 赛果 API + 内置 HAD 赔率
 * Usage: node scripts/backtest-final.js
 */
import { writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const KELLY_MULT = 0.25, MAX_PCT = 0.05, BANKROLL = 10000, MIN_EV = 0.05;
const API = "http://127.0.0.1:4173";

async function fetchJSON(u) { const r = await fetch(u); return r.ok ? r.json() : null; }

async function main() {
  // Fetch results with built-in HAD odds
  console.log("Fetching results...");
  let all = [];
  for (const [from, to] of [["2026-05-01","2026-05-15"],["2026-05-16","2026-05-31"]]) {
    const d = await fetchJSON(`${API}/api/results?from=${from}&to=${to}&pageSize=80`);
    if (d?.matches) all.push(...d.matches.filter(m => m.result?.full?.h != null && m.rawResult?.h));
  }
  console.log(`Matches with result + raw HAD odds: ${all.length}`);

  // Also fetch current odds for HAD pools (for recent matches where odds still available)
  let liveData = await fetchJSON(`${API}/api/sporttery?pool=had,hhad,ttg`);
  const liveMap = new Map();
  if (liveData?.matches) {
    for (const m of liveData.matches) {
      const pools = {}; for (const pt of ["had","hhad","ttg"]) { if (Array.isArray(m[pt])) pools[pt] = m[pt]; }
      if (Object.keys(pools).length) liveMap.set(String(m.id), pools);
    }
  }
  console.log(`Live odds pools available: ${liveMap.size}`);

  // Build backtest matches
  const matches = [];
  for (const rm of all) {
    const id = String(rm.id);
    const livePools = liveMap.get(id) || {};
    // Fallback HAD: use rawResult odds if live pool not available
    const pools = { ...livePools };
    if (!pools.had && rm.rawResult?.h) {
      pools.had = [
        { key: "h", label: "主胜", odds: Number(rm.rawResult.h) },
        { key: "d", label: "平局", odds: Number(rm.rawResult.d) },
        { key: "a", label: "客胜", odds: Number(rm.rawResult.a) },
      ];
    }
    if (!pools.had) continue; // must have at least HAD
    matches.push({
      id, home: rm.home || "", away: rm.away || "",
      homeShort: rm.homeShort || "", awayShort: rm.awayShort || "",
      matchDate: rm.matchDate || "", hhadGoalLine: Number(rm.hhadGoalLine || 0),
      pools, result: rm.result,
    });
  }
  console.log(`Backtest matches (HAD odds available): ${matches.length}`);

  // ── Run ──
  let bankroll = BANKROLL;
  const bets = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    let model;
    try {
      const r = buildFullV32Model({ match: m, research: null, controls: { matchStage: "group", motivation: "neutral" }, drawState: { matchesPlayed: i, draws: 0 } });
      model = r.model;
    } catch (e) { continue; }
    if (!model?.states) continue;

    // Evaluate HAD, HHAD, TTG
    let best = null, bestEV = -Infinity;
    for (const play of ["had","hhad","ttg"]) {
      const pool = m.pools[play];
      if (!pool?.length) continue;
      const probs = play === "had" ? { h: model.states.h, d: model.states.d, a: model.states.a }
        : play === "hhad" ? (model.byPlay?.hhad || {})
        : (model.byPlay?.ttg || {});
      for (const item of pool) {
        const prob = probs[item.key];
        if (!Number.isFinite(prob) || prob <= 0 || !Number.isFinite(item.odds) || item.odds <= 1) continue;
        if (item.odds > 8) continue;  // >8x extreme tail — circuit break
        const ev = prob * item.odds - 1;
        if (ev <= MIN_EV || ev <= bestEV) continue;
        best = { play, key: item.key, label: item.label || item.key, odds: item.odds, prob, ev };
        bestEV = ev;
      }
    }
    if (!best) { console.log(`[${i+1}] ${m.homeShort} vs ${m.awayShort} — no value`); continue; }

    // Kelly stake
    const kellyRaw = (bestEV / (best.odds - 1)) * KELLY_MULT;
    const pct = Math.min(kellyRaw, MAX_PCT);
    const stake = Math.max(2, Math.round(bankroll * pct / 2) * 2);
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
      const t = r.full.h + r.full.a;
      if (best.key === `s${t >= 7 ? 7 : t}`) won = true;
    }

    const profit = won ? stake * best.odds - stake : -stake;
    bankroll += profit;
    bets.push({
      home: m.homeShort, away: m.awayShort, date: m.matchDate,
      play: best.play, label: best.label, odds: best.odds,
      modelProb: best.prob, ev: bestEV,
      stake, positionPct: pct,
      won, profit, score: `${r.full.h}:${r.full.a}`,
    });

    const tag = won ? "✅" : "❌";
    console.log(`[${i+1}] ${tag} ${bets[bets.length-1].home} vs ${bets[bets.length-1].away} ${r.full.h}:${r.full.a} | ${best.play}·${best.label} @${best.odds} | EV ${bestEV >= 0 ? "+" : ""}${(bestEV*100).toFixed(1)}% | ${(pct*100).toFixed(1)}% ¥${stake} | ${profit >= 0 ? "+" : ""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
  }

  // ── Report ─────────────────────────────────────────────────
  const won = bets.filter(b => b.won).length;
  const pnl = bankroll - BANKROLL;
  const theory = bets.reduce((s, b) => s + b.ev * b.stake, 0);
  const ratio = theory !== 0 ? pnl / theory : 0;

  const lines = [
    "", "=".repeat(62),
    "  V4.0 回测报告  (2026-06-01 ~ 2026-06-25)",
    "=".repeat(62),
    `  引擎: V4.0 NB+Copula+DC+xG | Kelly: 1/4 | 单场上限: 5%`,
    `  赛果总计: ${all.length} | 含赔率: ${matches.length} | 有效投注: ${bets.length}`,
    `  初始资金: ¥${BANKROLL.toLocaleString()}`,
    `  最终资金: ¥${Math.round(bankroll).toLocaleString()}  (${(pnl/BANKROLL*100 >= 0 ? "+" : "")}${(pnl/BANKROLL*100).toFixed(2)}%)`,
    `  命中率:   ${bets.length ? won : 0}/${bets.length} (${bets.length ? (won/bets.length*100).toFixed(1) : "N/A"}%)`,
    `  实际盈亏: ¥${Math.round(pnl).toLocaleString()}`,
    `  理论 EV:  ¥${Math.round(theory).toLocaleString()}`,
    `  EV/实际比: ${ratio >= 0 ? "+" : ""}${ratio.toFixed(2)}x`,
  ];

  if (bets.length >= 10) {
    const verdict = ratio > 0.7 ? "✅ EV 预测方向正确，量级吻合 —— V4 引擎可信"
      : ratio > 0.3 ? "⚠️ EV 方向正确但量级偏乐观，需调低 Kelly 乘数或收紧 EV 阈值"
      : ratio > 0 ? "⚠️ EV 方向正确但严重高估，NB 厚尾参数需重新标定"
      : "🔴 EV 与实际盈亏反向 —— 引擎存在系统性错误，暂停实盘";
    lines.push(`  判定:     ${verdict}`);
  }
  lines.push("-".repeat(62));
  const report = lines.join("\n");
  console.log(report);

  const f = "backtest-report-final.json";
  writeFileSync(f, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { kellyMult: KELLY_MULT, maxPct: MAX_PCT, bankroll: BANKROLL, minEv: MIN_EV },
    summary: { totalBets: bets.length, won, winRate: bets.length ? won / bets.length : 0, initialBankroll: BANKROLL, finalBankroll: bankroll, return: bankroll / BANKROLL - 1, totalPnL: pnl, theoreticalEV: theory, evRatio: ratio },
    bets,
  }, null, 2));
  console.log(`报告: ${f}`);
}

main().catch(e => { console.error(e); process.exit(1); });
