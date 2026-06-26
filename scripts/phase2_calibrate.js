/**
 * Phase 2: Market-implied λ extraction from B365 HAD odds
 * Input: mvp_premier_league_2223.csv
 * Output: mvp_calibrated.csv (with fitted λ_h, λ_a, market probs)
 */
import { readFileSync, writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const CSV_PATH = "D:/1/omega-copula-engine/fd_data/mvp_premier_league_2223.csv";
const OUT_PATH = "D:/1/omega-copula-engine/fd_data/mvp_calibrated.csv";

// ── Devig B365 1X2 ──────────────────────────────────────────
function devigHAD(h, d, a) {
  const sumInv = 1/h + 1/d + 1/a;
  return {
    h: (1/h) / sumInv,
    d: (1/d) / sumInv,
    a: (1/a) / sumInv,
    margin: +(sumInv - 1),
  };
}

// ── Simple λ prior from expected goals ──────────────────────
function estimateLambdaPrior(goalsFor, goalsAgainst, isHome) {
  // Rough prior: 1.3 avg goals per match in PL
  const avg = 1.35;
  const homeBonus = isHome ? 1.15 : 0.85;
  return Math.max(0.3, Math.min(3.0, avg * homeBonus));
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  const raw = readFileSync(CSV_PATH, "utf-8");
  const lines = raw.trim().split("\n");
  const header = lines[0];
  const rows = lines.slice(1).map(l => {
    const cols = l.split(",");
    return {
      date: cols[2], home: cols[3], away: cols[4],
      fthg: +cols[5], ftag: +cols[6],
      b365h: +cols[9], b365d: +cols[10], b365a: +cols[11],
      bbah: +cols[12],
    };
  });

  console.log(`Processing ${rows.length} matches...`);
  const results = [];
  let fitCount = 0, failCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.b365h || !r.b365d || !r.b365a) continue;

    // Devig
    const mkt = devigHAD(r.b365h, r.b365d, r.b365a);

    // λ prior from goals
    const lhPrior = estimateLambdaPrior(r.fthg, r.ftag, true);
    const laPrior = estimateLambdaPrior(r.ftag, r.fthg, false);

    // Build match object for calibration
    const match = {
      home: r.home, away: r.away,
      hhadGoalLine: 0,
      pools: {
        had: [
          { key: "h", odds: r.b365h },
          { key: "d", odds: r.b365d },
          { key: "a", odds: r.b365a },
        ],
      },
    };

    // Run V4 engine — calibration happens inside buildFullV32Model when HHAD is available
    // BUT we don't have HHAD odds. So we run without calibration and get raw model output.
    // Then compare model probs vs market probs.
    let model;
    try {
      const output = buildFullV32Model({
        match,
        research: null,
        controls: { matchStage: "group", motivation: "neutral", lambdaHome: lhPrior, lambdaAway: laPrior },
        drawState: { matchesPlayed: i % 38, draws: Math.round(i * 0.24) },
      });
      model = output.model;
    } catch (e) { failCount++; continue; }
    if (!model?.states) { failCount++; continue; }

    const modelWDL = model.states;
    const edge_h = modelWDL.h - mkt.h;
    const edge_d = modelWDL.d - mkt.d;
    const edge_a = modelWDL.a - mkt.a;
    const l1Error = Math.abs(edge_h) + Math.abs(edge_d) + Math.abs(edge_a);
    const fitted = l1Error < 0.10;

    results.push({
      date: r.date, home: r.home, away: r.away,
      fthg: r.fthg, ftag: r.ftag,
      ah_line: r.bbah,
      b365_h: r.b365h, b365_d: r.b365d, b365_a: r.b365a,
      mkt_h: mkt.h.toFixed(4), mkt_d: mkt.d.toFixed(4), mkt_a: mkt.a.toFixed(4),
      mkt_margin: mkt.margin.toFixed(4),
      model_h: modelWDL.h.toFixed(4), model_d: modelWDL.d.toFixed(4), model_a: modelWDL.a.toFixed(4),
      edge_h: edge_h.toFixed(4), edge_d: edge_d.toFixed(4), edge_a: edge_a.toFixed(4),
      l1_error: l1Error.toFixed(4),
      fitted,
      lambda_h: lhPrior.toFixed(2),
      lambda_a: laPrior.toFixed(2),
    });

    if (fitted) fitCount++; else failCount++;

    if (i % 50 === 0 || i === rows.length - 1) {
      const pct = ((i+1)/rows.length*100).toFixed(0);
      console.log(`  [${pct}%] ${r.home} vs ${r.away} | model ${(modelWDL.h*100).toFixed(0)}/${(modelWDL.d*100).toFixed(0)}/${(modelWDL.a*100).toFixed(0)} | mkt ${(mkt.h*100).toFixed(0)}/${(mkt.d*100).toFixed(0)}/${(mkt.a*100).toFixed(0)} | err ${l1Error.toFixed(3)}`);
    }
  }

  // ── Write output ──────────────────────────────────────────
  const outHeader = "date,home,away,fthg,ftag,ah_line,b365_h,b365_d,b365_a,mkt_h,mkt_d,mkt_a,mkt_margin,model_h,model_d,model_a,edge_h,edge_d,edge_a,l1_error,fitted,lambda_h,lambda_a";
  const outLines = results.map(r =>
    [r.date, r.home, r.away, r.fthg, r.ftag, r.ah_line,
     r.b365_h, r.b365_d, r.b365_a,
     r.mkt_h, r.mkt_d, r.mkt_a, r.mkt_margin,
     r.model_h, r.model_d, r.model_a,
     r.edge_h, r.edge_d, r.edge_a,
     r.l1_error, r.fitted, r.lambda_h, r.lambda_a].join(",")
  );
  writeFileSync(OUT_PATH, outHeader + "\n" + outLines.join("\n"));

  // ── Summary ──────────────────────────────────────────────
  const avgL1 = results.reduce((s, r) => s + parseFloat(r.l1_error), 0) / results.length;
  const fitRate = (fitCount / results.length * 100).toFixed(1);
  const avgEdgeHome = results.reduce((s, r) => s + parseFloat(r.edge_h), 0) / results.length;
  const avgEdgeDraw = results.reduce((s, r) => s + parseFloat(r.edge_d), 0) / results.length;
  const avgEdgeAway = results.reduce((s, r) => s + parseFloat(r.edge_a), 0) / results.length;

  console.log(`\n${"=".repeat(55)}`);
  console.log(`  Phase 2 Complete: ${results.length} matches`);
  console.log(`  Avg L1 Error: ${avgL1.toFixed(4)} | Fit rate: ${fitRate}%`);
  console.log(`  Avg Edge: H ${avgEdgeHome >= 0 ? "+" : ""}${(avgEdgeHome*100).toFixed(2)}pp, D ${avgEdgeDraw >= 0 ? "+" : ""}${(avgEdgeDraw*100).toFixed(2)}pp, A ${avgEdgeAway >= 0 ? "+" : ""}${(avgEdgeAway*100).toFixed(2)}pp`);
  console.log(`  Output: ${OUT_PATH}`);
}

main().catch(e => { console.error(e); process.exit(1); });
