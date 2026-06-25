/**
 * V4.0 Full-Pipeline Backtest: Engine → Selector → Kelly
 * Usage: node scripts/backtest-selector.js
 */
import { writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const KELLY_MULT = 0.25, MAX_PCT = 0.05, BANKROLL = 10000;
const MIN_EV = 0.015;  // 1.5% edge for top-league micro-edge hunting
const MAX_ODDS = 8;
const API = "http://127.0.0.1:4173";
const VIG = 1.05;  // 5% vig deduction on returns

// ── Selector (extracted from app.js scorePlanCandidate V4 pure-math) ──
function selectorEvaluate(row, mode = "conservative") {
  const prob = Number(row.modelProb);
  const odds = Number(row.odds);
  if (!Number.isFinite(prob) || !Number.isFinite(odds)) return { reject: true, reason: "缺失概率或赔率" };

  // 1. Extreme-odds circuit breaker
  if (odds > MAX_ODDS) return { reject: true, reason: `赔率${odds.toFixed(1)}>8x拒绝` };

  // 2. Pure EV
  const ev = prob * odds - 1;
  if (ev <= MIN_EV) return { reject: true, reason: `EV ${(ev*100).toFixed(2)}% ≤ ${(MIN_EV*100).toFixed(1)}%` };

  // 3. Kelly
  const fullKelly = odds > 1 ? Math.max(0, ev / (odds - 1)) : 0;
  const kellyScale = mode === "aggressive" ? 0.60 : 0.25;
  const finalKelly = fullKelly * kellyScale;

  // 4. Deviation fuse
  const impliedProb = 1 / odds;
  if (prob / impliedProb > 2.2) return { reject: true, reason: `偏离熔断 ${(prob*100).toFixed(1)}% vs ${(impliedProb*100).toFixed(1)}%` };

  // 5. Low tail guard (conservative)
  if (mode === "conservative" && prob < 0.25) return { reject: true, reason: "保守剔除低概率(<25%)" };

  // 6. Min Kelly
  const minKelly = mode === "aggressive" ? 0.004 : 0.006;
  if (finalKelly < minKelly) return { reject: true, reason: `Kelly ${finalKelly.toFixed(6)} < ${minKelly}` };

  // 7. Stake
  const kellyPct = Math.min(finalKelly, MAX_PCT);
  const stake = Math.max(2, Math.round(BANKROLL * kellyPct / 2) * 2);

  return { reject: false, ev, fullKelly, finalKelly, kellyPct, stake };
}

// ── Data fetch ────────────────────────────────────────────────
async function fetchJSON(u) { const r = await fetch(u); return r.ok ? r.json() : null; }

async function fetchAllResults() {
  const all = [];
  for (const [from, to] of [
    ["2026-04-01","2026-04-30"],
    ["2026-05-01","2026-05-31"],
    ["2026-06-01","2026-06-25"],
  ]) {
    const d = await fetchJSON(`${API}/api/results?from=${from}&to=${to}&pageSize=200`);
    if (d?.matches) {
      const withResult = d.matches.filter(m => m.result?.full?.h != null && m.rawResult?.h);
      all.push(...withResult);
    }
  }
  return all;
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("Fetching Apr-Jun 2026 results...");
  const allResults = await fetchAllResults();
  console.log(`Total with result+odds: ${allResults.length}`);

  // Build matches with HAD odds
  const matches = allResults.map(rm => ({
    id: String(rm.id), home: rm.home || "", away: rm.away || "",
    homeShort: rm.homeShort || "", awayShort: rm.awayShort || "",
    matchDate: rm.matchDate || "", hhadGoalLine: Number(rm.hhadGoalLine || 0),
    pools: { had: [
      { key: "h", label: "主胜", odds: Number(rm.rawResult.h) },
      { key: "d", label: "平局", odds: Number(rm.rawResult.d) },
      { key: "a", label: "客胜", odds: Number(rm.rawResult.a) },
    ] },
    result: rm.result,
  }));

  console.log(`Backtest matches: ${matches.length}\n`);

  let bankroll = BANKROLL;
  const bets = [];
  let engineErrors = 0, selectorRejects = 0, noValue = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];

    // ── Engine ──
    let model;
    try {
      const r = buildFullV32Model({
        match: m, research: null,
        controls: { matchStage: "group", motivation: "neutral" },
        drawState: { matchesPlayed: i > 40 ? 40 : i, draws: Math.round(bets.filter(b => b.key === "d" && !b.won).length * 0.35) },
      });
      model = r.model;
    } catch (e) { engineErrors++; continue; }
    if (!model?.states) { engineErrors++; continue; }

    // ── Selector: evaluate each HAD option ──
    const candidates = [];
    for (const item of m.pools.had) {
      const prob = item.key === "h" ? model.states.h : item.key === "d" ? model.states.d : model.states.a;
      if (!Number.isFinite(prob)) continue;
      const res = selectorEvaluate({ modelProb: prob, odds: item.odds });
      if (res.reject) { selectorRejects++; continue; }
      candidates.push({ key: item.key, label: item.label, odds: item.odds, prob, ...res });
    }

    if (!candidates.length) { noValue++; continue; }

    // Pick best EV
    candidates.sort((a, b) => b.ev - a.ev);
    const best = candidates[0];
    const stake = best.stake;
    if (stake <= 0) { noValue++; continue; }

    // ── Settle ──
    const r = m.result;
    let won = false;
    if (r.full.h > r.full.a && best.key === "h") won = true;
    else if (r.full.h === r.full.a && best.key === "d") won = true;
    else if (r.full.h < r.full.a && best.key === "a") won = true;

    const rawProfit = won ? stake * best.odds - stake : -stake;
    const vigProfit = won ? (stake * best.odds / VIG - stake) : -stake;
    const profit = rawProfit; // use raw for now, show vig as separate metric
    bankroll += profit;

    bets.push({
      home: m.homeShort, away: m.awayShort, date: m.matchDate,
      key: best.key, label: best.label, odds: best.odds,
      modelProb: best.prob, ev: best.ev, finalKelly: best.finalKelly,
      stake, kellyPct: best.kellyPct,
      won, profit, rawProfit, vigProfit, score: `${r.full.h}:${r.full.a}`,
    });

    if (i % 20 === 0 || bets.length <= 5) {
      console.log(`[${i+1}] ${won ? "✅" : "❌"} ${bets[bets.length-1].home} vs ${bets[bets.length-1].away} ${r.full.h}:${r.full.a} | ${best.label} @${best.odds} | EV ${best.ev>=0?"+":""}${(best.ev*100).toFixed(2)}% | ${(best.kellyPct*100).toFixed(2)}% ¥${stake} | ${profit>=0?"+":""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
    }
  }

  // ── Report ─────────────────────────────────────────────────
  const won = bets.filter(b => b.won).length;
  const pnl = bankroll - BANKROLL;
  const theory = bets.reduce((s, b) => s + b.ev * b.stake, 0);
  const vigPnL = bets.reduce((s, b) => s + (b.vigProfit || 0), 0);
  const ratio = theory ? pnl / theory : 0;
  const winRate = bets.length ? won / bets.length : 0;

  const rpt = [
    "", "=".repeat(64),
    "  V4.0 全链路回测: 引擎 → 选择器 → Kelly",
    "=".repeat(64),
    `  数据: 2026-04~06 | 赛果: ${allResults.length} | 评价: ${matches.length}`,
    `  引擎错误: ${engineErrors} | 选择器拒绝: ${selectorRejects} | 无价值: ${noValue}`,
    `  配置: EV≥${(MIN_EV*100).toFixed(1)}% | Kelly×${KELLY_MULT} | 单场≤${(MAX_PCT*100).toFixed(0)}% | 赔率≤${MAX_ODDS}x`,
    `  投注: ${bets.length} | 命中: ${won} (${(winRate*100).toFixed(1)}%)`,
    `  初始: ¥${BANKROLL.toLocaleString()} → 最终: ¥${Math.round(bankroll).toLocaleString()} (${(pnl/BANKROLL*100>=0?"+":"")}${(pnl/BANKROLL*100).toFixed(2)}%)`,
    `  实际盈亏: ¥${Math.round(pnl).toLocaleString()} | 理论EV: ¥${Math.round(theory).toLocaleString()} | EV比: ${ratio.toFixed(2)}x`,
    vigPnL ? `  扣除5%抽水后: ¥${Math.round(vigPnL).toLocaleString()}` : "",
    "-".repeat(64),
  ].filter(Boolean).join("\n");
  console.log(rpt);

  writeFileSync("backtest-selector-report.json", JSON.stringify({
    config: { kellyMult: KELLY_MULT, maxPct: MAX_PCT, bankroll: BANKROLL, minEv: MIN_EV, maxOdds: MAX_ODDS, vig: VIG },
    summary: { totalBets: bets.length, won, winRate, initialBankroll: BANKROLL, finalBankroll: bankroll, return: bankroll/BANKROLL-1, totalPnL: pnl, theoreticalEV: theory, evRatio: ratio, vigPnL },
    engineErrors, selectorRejects, noValue,
    bets,
  }, null, 2));
  console.log("报告: backtest-selector-report.json");
}

main().catch(e => { console.error(e); process.exit(1); });
