/**
 * Jingcai Scanner — V4.0 Step 5 (Full)
 * 中国体彩价值扫描器：HAD(胜平负) + HHAD(让球) + TTG(总进球) + HAFU(半全场)
 *
 * Pipeline: V4 model output → devig market → EV/Kelly → value picks
 */

// ── Shared devig + EV logic ──────────────────────────────────
function devig(spArray) {
  const sumInv = spArray.reduce((s, sp) => s + 1 / sp, 0);
  return {
    probs: spArray.map(sp => (1 / sp) / sumInv),
    margin: +(sumInv - 1),
    marginPct: +((sumInv - 1) * 100).toFixed(1),
  };
}

function evaluateBins(modelProbs, spArray, labels) {
  const market = devig(spArray);
  const bins = [];
  for (let k = 0; k < spArray.length; k++) {
    const mp = modelProbs[k] || 0;
    const odds = spArray[k];
    const mktP = market.probs[k];
    const ev = mp * odds - 1;
    const rawKelly = odds > 1 ? ev / (odds - 1) : 0;
    const quarterKelly = Math.max(0, Math.min(rawKelly * 0.25, 0.01));

    bins.push({
      key: labels[k],
      label: labels[k],
      odds: +odds.toFixed(2),
      modelProb: +mp.toFixed(6),
      marketProb: +mktP.toFixed(6),
      edge: +(mp - mktP).toFixed(6),
      ev: +ev.toFixed(4),
      kelly_1_4: +quarterKelly.toFixed(6),
      isValue: ev > 0.05 && quarterKelly > 0.0005,
    });
  }
  return { bins, marketMargin: market.marginPct };
}

// ── Main scanner class ────────────────────────────────────────
export class JingcaiScanner {
  /**
   * @param {object} model — V4 model output: { states, byPlay, scores }
   * @param {object} match — sporttery match data with pools
   */
  constructor(model, match) {
    this.model = model;
    this.match = match;
  }

  // ── HAD: 胜平负 (3 options) ──────────────────────────────────
  scanHAD() {
    const pool = this.match?.pools?.had || [];
    if (pool.length !== 3) return null;
    const spArray = pool.map(item => item.odds);
    const modelProbs = [this.model.states.h, this.model.states.d, this.model.states.a];
    const result = evaluateBins(modelProbs, spArray, ["主胜", "平局", "客胜"]);
    return { play: "had", label: "胜平负", ...result };
  }

  // ── HHAD: 让球胜平负 (3 options) ─────────────────────────────
  scanHHAD() {
    const pool = this.match?.pools?.hhad || [];
    if (pool.length !== 3) return null;
    const hhad = this.model.byPlay?.hhad;
    if (!hhad) return null;
    const spArray = pool.map(item => item.odds);
    const modelProbs = [hhad.h || 0, hhad.d || 0, hhad.a || 0];
    const goalLine = this.match?.hhadGoalLine ?? 0;
    const result = evaluateBins(modelProbs, spArray,
      [`让${goalLine}主胜`, `让${goalLine}平`, `让${goalLine}客胜`]);
    return { play: "hhad", label: `让球(${goalLine > 0 ? "+" + goalLine : goalLine})`, ...result };
  }

  // ── TTG: 总进球数 (8 options) ────────────────────────────────
  scanTTG() {
    const pool = this.match?.pools?.ttg || [];
    if (pool.length !== 8) return null;
    const spArray = pool.map(item => item.odds);
    const scores = this.model.scores || [];
    // Flatten score matrix → TTG bins
    const bins = new Array(8).fill(0);
    for (const s of scores) {
      const p = s.prob;
      if (!Number.isFinite(p) || p < 0) continue;
      const total = (s.h || 0) + (s.a || 0);
      const bin = total >= 7 ? 7 : total;
      bins[bin] += p;
    }
    const sum = bins.reduce((t, v) => t + v, 0) || 1;
    const modelProbs = bins.map(v => v / sum);
    const labels = ["0球", "1球", "2球", "3球", "4球", "5球", "6球", "7+球"];
    const result = evaluateBins(modelProbs, spArray, labels);
    return { play: "ttg", label: "总进球", ...result };
  }

  // ── HAFU: 半全场 (9 options — 3x3 matrix) ──────────────────────
  scanHAFU() {
    const pool = this.match?.pools?.hafu || [];
    if (pool.length !== 9) return null;
    const hafu = this.model.byPlay?.hafu;
    if (!hafu) return null;
    const labels = ["胜胜", "胜平", "胜负", "平胜", "平平", "平负", "负胜", "负平", "负负"];
    const keys = ["hh", "hd", "ha", "dh", "dd", "da", "ah", "ad", "aa"];
    const spArray = keys.map(k => pool.find(p => p.key === k)?.odds || 0);
    const modelProbs = keys.map(k => hafu[k] || 0);
    const result = evaluateBins(modelProbs, spArray, labels);
    // Attach keys for 3x3 matrix rendering
    result.keys = keys;
    result.bins.forEach((b, i) => { b.key = keys[i]; });
    return { play: "hafu", label: "半全场", ...result };
  }

  // ── Full scan: all play types ────────────────────────────────
  scanAll() {
    const results = [];
    const had = this.scanHAD();
    if (had) results.push(had);
    const hhad = this.scanHHAD();
    if (hhad) results.push(hhad);
    const ttg = this.scanTTG();
    if (ttg) results.push(ttg);
    const hafu = this.scanHAFU();
    if (hafu) results.push(hafu);

    const allValuePicks = results.flatMap(r =>
      r.bins.filter(b => b.isValue).map(b => ({ play: r.play, ...b }))
    ).sort((a, b) => b.ev - a.ev);

    return {
      home: this.match?.homeShort || this.match?.home || "?",
      away: this.match?.awayShort || this.match?.away || "?",
      totalValuePicks: allValuePicks.length,
      valuePicks: allValuePicks,
      plays: results,
    };
  }

  // ── Static: batch scan via V4 engine ─────────────────────────
  static scanBatch(matches) {
    return matches.map(m => {
      try {
        const scanner = new JingcaiScanner(m.model, m.match);
        return scanner.scanAll();
      } catch (e) {
        return { home: m.match?.home || "?", away: m.match?.away || "?", error: e.message };
      }
    });
  }
}

// ── Test runner ────────────────────────────────────────────────
export function runFullTest() {
  // Mock V4 model output for Portugal vs Uzbekistan
  const mockModel = {
    states: { h: 0.467, d: 0.315, a: 0.218 },
    byPlay: {
      hhad: { h: 0.382, d: 0.283, a: 0.335 },
    },
    scores: (() => {
      // 9x9 matrix from V4 NB+Copula+DC
      const m = [
        [0.185,0.042,0.018,0.008,0.003,0.001,0.001,0.000,0.000],
        [0.058,0.055,0.026,0.012,0.005,0.002,0.001,0.001,0.000],
        [0.032,0.035,0.032,0.017,0.008,0.004,0.002,0.001,0.000],
        [0.016,0.019,0.022,0.020,0.012,0.006,0.003,0.002,0.001],
        [0.008,0.010,0.013,0.014,0.012,0.008,0.005,0.003,0.001],
        [0.004,0.005,0.007,0.008,0.009,0.008,0.006,0.004,0.002],
        [0.002,0.003,0.004,0.005,0.006,0.006,0.006,0.005,0.003],
        [0.001,0.001,0.002,0.003,0.004,0.004,0.005,0.005,0.004],
        [0.000,0.001,0.001,0.001,0.002,0.003,0.003,0.004,0.004],
      ];
      const scores = [];
      for (let i = 0; i < 9; i++)
        for (let j = 0; j < 9; j++)
          scores.push({ h: i, a: j, prob: m[i][j] });
      return scores;
    })(),
  };

  const mockMatch = {
    homeShort: "葡萄牙", awayShort: "乌兹别克",
    hhadGoalLine: -1,
    pools: {
      had: [{ key: "h", odds: 1.45 }, { key: "d", odds: 4.00 }, { key: "a", odds: 6.50 }],
      hhad: [{ key: "h", odds: 2.05 }, { key: "d", odds: 3.45 }, { key: "a", odds: 2.85 }],
      ttg: [{ key: "s0", odds: 12.5 }, { key: "s1", odds: 5.4 }, { key: "s2", odds: 3.6 },
            { key: "s3", odds: 3.7 }, { key: "s4", odds: 5.2 }, { key: "s5", odds: 9.5 },
            { key: "s6", odds: 18.0 }, { key: "s7", odds: 25.0 }],
    },
  };

  const scanner = new JingcaiScanner(mockModel, mockMatch);
  const result = scanner.scanAll();

  console.log("=".repeat(68));
  console.log(`  竞彩价值扫描器 — ${result.home} vs ${result.away}`);
  console.log("=".repeat(68));

  for (const play of result.plays) {
    const values = play.bins.filter(b => b.isValue);
    console.log(`\n── ${play.label} (抽水 ${play.marketMargin}%)  ${values.length ? "⭐" + values.length + "个价值" : "无价值"} ──`);
    console.log(" 选项         赔率    模型概率   市场概率    差值     EV    1/4Kelly");
    console.log(" " + "-".repeat(65));
    for (const b of play.bins) {
      const tag = b.isValue ? " ⭐" : "  ";
      const evStr = b.ev >= 0 ? `+${b.ev.toFixed(2)}` : b.ev.toFixed(2);
      console.log(
        ` ${b.label.padEnd(12)} ${String(b.odds).padStart(5)}  ${(b.modelProb * 100).toFixed(1).padStart(5)}%  ${(b.marketProb * 100).toFixed(1).padStart(5)}%  ${(b.edge * 100).toFixed(1).padStart(5)}%  ${evStr.padStart(5)}  ${b.kelly_1_4.toFixed(6)}${tag}`
      );
    }
  }

  if (result.totalValuePicks > 0) {
    console.log(`\n${"=".repeat(68)}`);
    console.log(`  ⭐ 汇总: ${result.totalValuePicks} 个价值投注`);
    console.log(`${"=".repeat(68)}`);
    for (const pick of result.valuePicks) {
      console.log(`  [${pick.play.toUpperCase()}] ${pick.label}: SP=${pick.odds} EV=${pick.ev >= 0 ? "+" : ""}${pick.ev.toFixed(2)}  模型${(pick.modelProb*100).toFixed(1)}% vs 市场${(pick.marketProb*100).toFixed(1)}%`);
    }
  }

  return result;
}

// Direct run
if (process.argv[1]?.includes("jingcai-ttg-scanner")) {
  runFullTest();
}
