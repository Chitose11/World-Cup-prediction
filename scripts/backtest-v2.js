/**
 * V4.0 Backtest — Selector V2: 4-layer quant risk engine
 * Usage: node scripts/backtest-v2.js
 */
import { writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";
import { evaluatePick, compressExposure, CONFIG } from "./selector-v2.js";

const BANKROLL = 10000;
const API = "http://127.0.0.1:4173";

async function fetchJSON(u) { const r = await fetch(u); return r.ok ? r.json() : null; }

async function main() {
  // Fetch Apr-Jun 2026 results
  const all = [];
  for (const [from, to] of [
    ["2026-04-01","2026-04-30"],["2026-05-01","2026-05-31"],["2026-06-01","2026-06-25"]
  ]) {
    const d = await fetchJSON(`${API}/api/results?from=${from}&to=${to}&pageSize=200`);
    if (d?.matches) all.push(...d.matches.filter(m => m.result?.full?.h != null && m.rawResult?.h));
  }
  console.log(`Loaded ${all.length} matches with results\n`);

  let bankroll = BANKROLL;
  const bets = [];
  let totalRejected = 0;

  for (let i = 0; i < all.length; i++) {
    const rm = all[i];
    const hadPool = {
      h: Number(rm.rawResult.h),
      d: Number(rm.rawResult.d),
      a: Number(rm.rawResult.a),
    };
    if (!hadPool.h || !hadPool.d || !hadPool.a) continue;

    const match = {
      id: String(rm.id), home: rm.home || "", away: rm.away || "",
      homeShort: rm.homeShort || "", awayShort: rm.awayShort || "",
      hhadGoalLine: Number(rm.hhadGoalLine || 0),
      pools: { had: [{ key: "h", odds: hadPool.h }, { key: "d", odds: hadPool.d }, { key: "a", odds: hadPool.a }] },
      result: rm.result,
    };

    // ── Engine ──
    let model;
    try {
      const r = buildFullV32Model({
        match, research: null,
        controls: { matchStage: "group", motivation: "neutral" },
        drawState: { matchesPlayed: i > 40 ? 40 : i, draws: Math.round(bets.filter(b => b.key === "d" && !b.won).length * 0.35) },
      });
      model = r.model;
    } catch (e) { continue; }
    if (!model?.states) continue;

    // ── Selector V2: evaluate all 3 options ──
    const candidates = [];
    for (const item of match.pools.had) {
      const prob = item.key === "h" ? model.states.h : item.key === "d" ? model.states.d : model.states.a;
      if (!Number.isFinite(prob)) continue;

      const poolWithKey = { ...hadPool, _key: item.key };
      const res = evaluatePick(prob, item.odds, poolWithKey, bankroll);
      if (res.rejected) { totalRejected++; continue; }
      candidates.push({ key: item.key, label: item.key === "h" ? "主胜" : item.key === "d" ? "平局" : "客胜", odds: item.odds, prob, ...res });
    }

    // ── Layer 3: Compress per-match exposure ──
    const compressed = compressExposure(candidates);
    compressed.sort((a, b) => b.ev - a.ev);
    if (!compressed.length) continue;

    // Take only top pick per match (simplest strategy)
    const best = compressed[0];
    if (best.stake <= 0) continue;

    // ── Settle ──
    const r = match.result;
    let won = false;
    if (r.full.h > r.full.a && best.key === "h") won = true;
    else if (r.full.h === r.full.a && best.key === "d") won = true;
    else if (r.full.h < r.full.a && best.key === "a") won = true;

    const profit = won ? best.stake * best.odds - best.stake : -best.stake;
    bankroll += profit;
    bets.push({
      home: match.homeShort, away: match.awayShort,
      key: best.key, label: best.label, odds: best.odds,
      modelProb: best.prob, ev: best.ev, trueImplied: best.trueImplied,
      divergenceRatio: best.divergenceRatio,
      kellyPct: best.kellyPct, stake: best.stake,
      won, profit, score: `${r.full.h}:${r.full.a}`,
    });

    if (i % 30 === 0 || bets.length <= 3 || won) {
      console.log(`[${i+1}] ${won ? "✅" : "❌"} ${bets[bets.length-1].home} vs ${bets[bets.length-1].away} ${r.full.h}:${r.full.a} | ${best.label} @${best.odds} | EV ${best.ev>=0?"+":""}${(best.ev*100).toFixed(2)}% | ${(best.kellyPct*100).toFixed(2)}% ¥${best.stake} | ${profit>=0?"+":""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
    }
  }

  // ── Report ─────────────────────────────────────────────────
  const won = bets.filter(b => b.won).length;
  const pnl = bankroll - BANKROLL;
  const theory = bets.reduce((s, b) => s + b.ev * b.stake, 0);
  const ratio = theory ? pnl / theory : 0;

  const rpt = [
    "", "=".repeat(64),
    "  V4.0 回测 — Selector V2 (4-Layer Risk Engine)",
    "=".repeat(64),
    `  EV≥${(CONFIG.MIN_EV*100).toFixed(1)}% | Kelly×${CONFIG.KELLY_MULTIPLIER} | 单注≤${(CONFIG.MAX_SINGLE_PCT*100).toFixed(0)}% | 赔率≤${CONFIG.MAX_ODDS}x`,
    `  偏离熔断 ${CONFIG.DIVERGENCE_CAP}x | 单场曝险≤${(CONFIG.MAX_MATCH_EXPOSURE*100).toFixed(0)}%`,
    `  投注: ${bets.length} | 命中: ${won} (${(won/bets.length*100).toFixed(1)}%) | 拒绝: ${totalRejected}`,
    `  ¥${BANKROLL.toLocaleString()} → ¥${Math.round(bankroll).toLocaleString()} (${(pnl/BANKROLL*100>=0?"+":"")}${(pnl/BANKROLL*100).toFixed(2)}%)`,
    `  理论EV: ¥${Math.round(theory).toLocaleString()} | EV比: ${ratio.toFixed(2)}x`,
    "-".repeat(64),
  ].join("\n");
  console.log(rpt);

  writeFileSync("backtest-v2-report.json", JSON.stringify({
    config: CONFIG,
    summary: {
      bets: bets.length, won, winRate: bets.length ? won/bets.length : 0,
      bankroll: BANKROLL, finalBankroll: bankroll, return: bankroll/BANKROLL-1,
      pnl, theory, ratio,
    },
    rejected: totalRejected,
    bets,
  }, null, 2));
  console.log("报告: backtest-v2-report.json");
}

main().catch(e => { console.error(e); process.exit(1); });
