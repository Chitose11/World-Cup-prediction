/**
 * V4.0 Backtest Runner — 100-match blind paper-trading
 * Usage: node scripts/backtest-v4.js <matches.json>
 *
 * Input JSON format per match:
 * {
 *   "id": "2024xxx",
 *   "home": "葡萄牙", "away": "乌兹别克",
 *   "matchDate": "2024-06-15", "matchTime": "20:00:00",
 *   "pools": {
 *     "had": [{"key":"h","odds":1.45},{"key":"d","odds":4.0},{"key":"a","odds":6.5}],
 *     "hhad": [{"key":"h","odds":2.05},{"key":"d","odds":3.45},{"key":"a","odds":2.85}],
 *     "ttg": [{"key":"s0","odds":12.5}, ...]
 *   },
 *   "result": { "full": {"h": 2, "a": 0}, "half": {"h": 1, "a": 0} }
 * }
 */
import { readFileSync, writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

// ── Config ──────────────────────────────────────────────────
const KELLY_MULT = 0.25;
const MAX_PCT = 0.05;
const INITIAL_BANKROLL = 10000;
const MIN_EV = 0.05;       // only bet EV > 5%
const MAX_SINGLE_ODDS = 15; // reject obvious outliers

function computeKelly(bankroll, prob, odds) {
  const ev = prob * odds - 1;
  if (ev <= 0 || odds <= 1) return 0;
  const frac = Math.min((ev / (odds - 1)) * KELLY_MULT, MAX_PCT);
  return Math.max(2, Math.round(bankroll * frac / 2) * 2);
}

function betResolved(prediction, result) {
  const fullH = result?.full?.h, fullA = result?.full?.a;
  if (fullH == null || fullA == null) return null; // no result available
  let won = false;
  if (prediction.play === "had") {
    if (fullH > fullA && prediction.key === "h") won = true;
    else if (fullH === fullA && prediction.key === "d") won = true;
    else if (fullH < fullA && prediction.key === "a") won = true;
  } else if (prediction.play === "hhad") {
    const line = prediction.hhadGoalLine || 0;
    const adjusted = fullH + line - fullA;
    if (adjusted > 0 && prediction.key === "h") won = true;
    else if (adjusted === 0 && prediction.key === "d") won = true;
    else if (adjusted < 0 && prediction.key === "a") won = true;
  } else if (prediction.play === "ttg") {
    const total = fullH + fullA;
    const bin = total >= 7 ? 7 : total;
    if (prediction.key === `s${bin}`) won = true;
  }
  const profit = won ? prediction.stake * prediction.odds - prediction.stake : -prediction.stake;
  return { won, profit, fullH, fullA };
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const inputFile = process.argv[2] || "../omega-copula-engine/live-matches.json";
  const matches = JSON.parse(readFileSync(inputFile, "utf-8"));
  console.log(`Loaded ${matches.length} matches from ${inputFile}\n`);

  let bankroll = INITIAL_BANKROLL;
  const bets = [];
  let totalEV = 0, totalStake = 0;

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    // Wrap pools if flat
    if (!m.pools) {
      m.pools = {};
      for (const pt of ["had","hhad","hafu","ttg","crs"]) {
        if (m[pt]) m.pools[pt] = m[pt];
      }
    }

    // Run V4 engine
    let model;
    try {
      const r = buildFullV32Model({
        match: m, research: null,
        controls: { matchStage: "group", motivation: "neutral" },
        drawState: { matchesPlayed: i, draws: bets.filter(b => b.resolved && b.won === false && b.play === "had" && b.key === "d").length },
      });
      model = r.model;
    } catch (e) {
      console.log(`[${i+1}/${matches.length}] ${m.home} vs ${m.away} — engine error: ${e.message}`);
      continue;
    }

    if (!model?.byPlay) continue;

    // Find best HAD/HHAD/TTG picks
    const picks = [];
    for (const play of ["had","hhad","ttg"]) {
      const pool = m.pools[play] || [];
      const probs = model.byPlay[play] || {};
      for (const item of pool) {
        const prob = probs[item.key];
        if (!Number.isFinite(prob) || prob <= 0) continue;
        if (item.odds > MAX_SINGLE_ODDS) continue;
        const ev = prob * item.odds - 1;
        if (ev <= MIN_EV) continue;
        picks.push({ play, key: item.key, label: item.label || item.key, odds: item.odds, prob, ev });
      }
    }
    if (!picks.length) {
      console.log(`[${i+1}/${matches.length}] ${m.home} vs ${m.away} — no value picks (all EV ≤ ${(MIN_EV*100).toFixed(0)}%)`);
      continue;
    }

    // Pick best EV per match
    picks.sort((a, b) => b.ev - a.ev);
    const best = picks[0];
    const stake = computeKelly(bankroll, best.prob, best.odds);
    if (stake <= 0) continue;

    // Place bet
    const bet = {
      matchId: m.id,
      home: m.homeShort || m.home,
      away: m.awayShort || m.away,
      date: m.matchDate || "",
      play: best.play,
      key: best.key,
      label: best.label,
      odds: best.odds,
      modelProb: best.prob,
      ev: best.ev,
      stake,
      positionPct: stake / bankroll,
      potentialReturn: stake * best.odds,
      bankrollBefore: bankroll,
      hhadGoalLine: m.hhadGoalLine || 0,
      resolved: false,
    };

    // Check result
    if (m.result?.full) {
      const outcome = betResolved(bet, m.result);
      if (outcome) {
        bet.won = outcome.won;
        bet.profit = outcome.profit;
        bet.resolved = true;
        bet.bankrollAfter = bankroll + outcome.profit;
        bankroll = bet.bankrollAfter;
      }
    }

    bets.push(bet);
    totalEV += best.ev * stake;
    totalStake += stake;

    const tag = bet.resolved ? (bet.won ? "✅ +" : "❌ ") : "⏳";
    const pnl = bet.resolved ? (bet.profit >= 0 ? "+" : "") + bet.profit.toFixed(0) : "pending";
    console.log(`[${i+1}/${matches.length}] ${tag} ${bet.home} vs ${bet.away} | ${bet.play}·${bet.label} @${bet.odds} | EV ${bet.ev >= 0 ? "+" : ""}${(bet.ev*100).toFixed(1)}% | 仓位 ${(bet.positionPct*100).toFixed(1)}% ¥${bet.stake} | 盈亏 ${pnl} | 余额 ¥${Math.round(bankroll)}`);
  }

  // ── Report ─────────────────────────────────────────────────
  const resolved = bets.filter(b => b.resolved);
  const won = resolved.filter(b => b.won);
  const totalPnL = resolved.reduce((s, b) => s + b.profit, 0);
  const totalTheoreticalEV = resolved.reduce((s, b) => s + b.ev * b.stake, 0);

  console.log("\n" + "=".repeat(60));
  console.log("  V4.0 回测报告");
  console.log("=".repeat(60));
  console.log(`  初始资金:     ¥${INITIAL_BANKROLL.toLocaleString()}`);
  console.log(`  最终资金:     ¥${Math.round(bankroll).toLocaleString()}  (${((bankroll/INITIAL_BANKROLL-1)*100 >= 0 ? "+" : "")}${((bankroll/INITIAL_BANKROLL-1)*100).toFixed(2)}%)`);
  console.log(`  总投注:       ${bets.length} 场 (已结算 ${resolved.length}, 待赛 ${bets.length - resolved.length})`);
  console.log(`  命中:         ${won.length}/${resolved.length || 1} (${resolved.length ? (won.length/resolved.length*100).toFixed(1) : "N/A"}%)`);
  console.log(`  总投入:       ¥${totalStake.toLocaleString()}`);
  console.log(`  实际盈亏:     ¥${Math.round(totalPnL).toLocaleString()}`);
  console.log(`  理论预期 EV:  ¥${Math.round(totalTheoreticalEV).toLocaleString()}`);
  console.log(`  EV 偏差:      ${((totalPnL - totalTheoreticalEV) >= 0 ? "+" : "")}¥${Math.round(totalPnL - totalTheoreticalEV).toLocaleString()}`);
  if (totalTheoreticalEV !== 0) {
    const ratio = totalPnL / totalTheoreticalEV;
    const verdict = ratio >= 0.8 ? "模型 EV 与实际盈亏高度吻合 ✅" : ratio >= 0 ? "模型 EV 方向正确但量级偏乐观 ⚠️" : "模型 EV 与实际盈亏方向相反 — 严重错误 🔴";
    console.log(`  EV/实际比:    ${ratio.toFixed(2)}x → ${verdict}`);
  }
  console.log("-".repeat(60));

  // Output detailed report
  const report = {
    timestamp: new Date().toISOString(),
    engine: "V4.0 NB+Copula+DC+xG",
    config: { kelly_mult: KELLY_MULT, max_pct: MAX_PCT, bankroll: INITIAL_BANKROLL, min_ev: MIN_EV },
    summary: {
      totalBets: bets.length,
      resolved: resolved.length,
      won: won.length,
      winRate: resolved.length ? won.length / resolved.length : 0,
      initialBankroll: INITIAL_BANKROLL,
      finalBankroll: bankroll,
      return: bankroll / INITIAL_BANKROLL - 1,
      totalPnL: totalPnL,
      totalTheoreticalEV: totalTheoreticalEV,
      evDeviation: totalPnL - totalTheoreticalEV,
    },
    bets: bets.map(b => ({
      home: b.home, away: b.away, date: b.date,
      play: b.play, key: b.key, label: b.label,
      odds: b.odds, modelProb: b.modelProb, ev: b.ev,
      stake: b.stake, positionPct: b.positionPct,
      resolved: b.resolved, won: b.won, profit: b.profit,
      bankrollBefore: b.bankrollBefore, bankrollAfter: b.bankrollAfter,
    })),
  };

  const outFile = inputFile.replace(/\.json$/i, "-backtest.json");
  writeFileSync(outFile, JSON.stringify(report, null, 2));
  console.log(`\n报告已写入: ${outFile}`);
}

main().catch(e => { console.error(e); process.exit(1); });
