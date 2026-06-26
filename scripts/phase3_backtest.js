/**
 * Phase 3+4: Synthetic Sporttery SP + V4 Backtest
 * MVP: 380 PL 22-23 matches
 *
 * Pipeline:
 * 1. Devig B365 HAD → true market probs
 * 2. Apply 82% return rate → synthetic SP
 * 3. Feed SP to V4 engine + Selector V2 filter
 * 4. Settle against real scores, track PnL
 */
import { readFileSync, writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const CSV = "D:/1/omega-copula-engine/fd_data/mvp_premier_league_2223.csv";
const OUT = "D:/1/omega-copula-engine/fd_data/phase3_backtest.json";

// ── Config ──────────────────────────────────────────────────
const BANKROLL = 10000;
const RETURN_RATE = 0.82;        // sporttery ~82% return
const MIN_EV = 0.025;            // 2.5%
const DIV_CAP = 1.5;             // divergence fuse
const KELLY_MULT = 0.25;
const MAX_PCT = 0.05;
const MAX_ODDS = 8;

// ── Devig ───────────────────────────────────────────────────
function devig(h, d, a) {
  const s = 1/h + 1/d + 1/a;
  return { h: (1/h)/s, d: (1/d)/s, a: (1/a)/s, margin: s - 1 };
}

// ── Synthetic SP ─────────────────────────────────────────────
function synthSP(devigged, rate) {
  return {
    h: +(rate / devigged.h).toFixed(2),
    d: +(rate / devigged.d).toFixed(2),
    a: +(rate / devigged.a).toFixed(2),
  };
}

// ── Selector ─────────────────────────────────────────────────
function selectorEvaluate(prob, odds, trueImplied) {
  if (!Number.isFinite(prob) || !Number.isFinite(odds) || odds <= 1) return { reject: true };
  if (odds > MAX_ODDS) return { reject: true };
  if (prob < 0.20) return { reject: true }; // V4.0: min 20% model prob floor — kills false draws
  const ev = prob * odds - 1;
  if (ev <= MIN_EV) return { reject: true };
  const div = prob / trueImplied;
  if (div > DIV_CAP) return { reject: true };
  const fullKelly = (odds > 1) ? ev / (odds - 1) : 0;
  const fracKelly = fullKelly * KELLY_MULT;
  if (fracKelly < 0.002) return { reject: true };
  const pct = Math.min(fracKelly, MAX_PCT);
  const stake = Math.max(2, Math.round(BANKROLL * pct / 2) * 2);
  return { reject: false, ev, div, pct, stake };
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const raw = readFileSync(CSV, "utf-8");
  const lines = raw.trim().split("\n").slice(1);
  const rows = lines.map(l => {
    const c = l.split(",");
    return { date:c[2], home:c[3], away:c[4], fthg:+c[5], ftag:+c[6], hthg:+c[7]||0, htag:+c[8]||0, b365h:+c[9], b365d:+c[10], b365a:+c[11], ah:+c[12] };
  }).filter(r => r.b365h && r.b365d && r.b365a);

  console.log(`Phase 3+4: ${rows.length} matches | Return rate: ${(RETURN_RATE*100).toFixed(0)}% | EV≥${(MIN_EV*100).toFixed(0)}%\n`);

  let bankroll = BANKROLL;
  let peak = BANKROLL;
  let trough = BANKROLL;
  const bets = [];
  let rejects = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    // Phase 3: Generate synthetic SP
    const mkt = devig(r.b365h, r.b365d, r.b365a);
    const sp = synthSP(mkt, RETURN_RATE);

    // Build match with synth SP for engine
    const match = {
      home: r.home, away: r.away,
      pools: { had: [{ key: "h", odds: sp.h }, { key: "d", odds: sp.d }, { key: "a", odds: sp.a }] },
    };

    // Run V4 engine
    let model;
    try {
      const out = buildFullV32Model({
        match, research: null,
        controls: { matchStage: "group", motivation: "neutral" },
        drawState: { matchesPlayed: i % 38, draws: Math.round(i * 0.24) },
      });
      model = out.model;
    } catch (e) { continue; }
    if (!model?.states) continue;

    // Selector: evaluate each option
    const candidates = [];
    const probs = [
      { key: "h", label: "主胜", prob: model.states.h, odds: sp.h, true: mkt.h },
      { key: "d", label: "平局", prob: model.states.d, odds: sp.d, true: mkt.d },
      { key: "a", label: "客胜", prob: model.states.a, odds: sp.a, true: mkt.a },
    ];
    for (const p of probs) {
      const res = selectorEvaluate(p.prob, p.odds, p.true);
      if (res.reject) { rejects++; continue; }
      candidates.push({ ...p, ...res });
    }
    if (!candidates.length) continue;

    // Pick best EV
    candidates.sort((a, b) => b.ev - a.ev);
    const best = candidates[0];
    if (best.stake <= 0) continue;

    // Settle
    const won =
      (best.key === "h" && r.fthg > r.ftag) ||
      (best.key === "d" && r.fthg === r.ftag) ||
      (best.key === "a" && r.fthg < r.ftag);
    const profit = won ? best.stake * best.odds - best.stake : -best.stake;
    bankroll += profit;
    if (bankroll > peak) peak = bankroll;
    if (bankroll < trough) trough = bankroll;

    bets.push({
      date: r.date, home: r.home, away: r.away,
      score: `${r.fthg}:${r.ftag}`,
      pick: best.key, label: best.label,
      sp: best.odds, modelProb: best.prob, trueProb: best.true,
      ev: best.ev, div: best.div, pct: best.pct,
      stake: best.stake, won, profit, bankroll,
    });

    if (i % 40 === 0 || bets.length <= 3 || won) {
      const tag = won ? "✅" : "❌";
      console.log(`[${i+1}] ${tag} ${r.home} vs ${r.away} ${r.fthg}:${r.ftag} | ${best.label} SP${best.odds} | EV ${best.ev>=0?"+":""}${(best.ev*100).toFixed(1)}% | ${(best.pct*100).toFixed(1)}% ¥${best.stake} | ${profit>=0?"+":""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
    }
  }

  // ── Report ─────────────────────────────────────────────────
  const wonCount = bets.filter(b => b.won).length;
  const pnl = bankroll - BANKROLL;
  const roi = (pnl / BANKROLL * 100);
  const maxDD = ((trough - peak) / peak * 100);
  const theory = bets.reduce((s, b) => s + b.ev * b.stake, 0);
  const evRatio = theory ? pnl / theory : 0;
  const totalStake = bets.reduce((s, b) => s + b.stake, 0);
  const avgOdds = bets.reduce((s, b) => s + b.sp, 0) / (bets.length || 1);

  // By season half
  const half1 = bets.filter((b, i) => i < bets.length / 2);
  const half2 = bets.filter((b, i) => i >= bets.length / 2);
  const pnl1 = half1.reduce((s, b) => s + b.profit, 0);
  const pnl2 = half2.reduce((s, b) => s + b.profit, 0);

  const rpt = [
    "", "=".repeat(60),
    "  V4 Phase 3+4 Backtest — Synth SP (82% return rate)",
    "=".repeat(60),
    `  Matches: ${rows.length} | Bets: ${bets.length} | Rejected: ${rejects}`,
    `  Hit: ${wonCount}/${bets.length} (${(wonCount/bets.length*100).toFixed(1)}%) | Avg Odds: ${avgOdds.toFixed(2)}`,
    `  Initial: ¥${BANKROLL.toLocaleString()} → Final: ¥${Math.round(bankroll).toLocaleString()} (${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%)`,
    `  Total PnL: ${pnl >= 0 ? "+" : ""}¥${Math.round(pnl).toLocaleString()} | Stake: ¥${Math.round(totalStake).toLocaleString()}`,
    `  Max DD: ${maxDD.toFixed(1)}% | EV/Actual: ${evRatio.toFixed(2)}x`,
    `  1st half: ${pnl1 >= 0 ? "+" : ""}¥${Math.round(pnl1)} | 2nd half: ${pnl2 >= 0 ? "+" : ""}¥${Math.round(pnl2)}`,
    "-".repeat(60),
  ].join("\n");
  console.log(rpt);

  writeFileSync(OUT, JSON.stringify({
    config: { bankroll: BANKROLL, returnRate: RETURN_RATE, minEv: MIN_EV, divCap: DIV_CAP, kelly: KELLY_MULT },
    summary: {
      bets: bets.length, won: wonCount, hitRate: bets.length ? wonCount/bets.length : 0,
      bankroll, roi, maxDD, pnl, theory, evRatio, totalStake, avgOdds,
      half1pnl: pnl1, half2pnl: pnl2,
    },
    rejects,
    bets,
  }, null, 2));
  console.log(`Report: ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
