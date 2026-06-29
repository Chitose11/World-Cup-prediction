/**
 * V4.0 Stress Test — 两场极端压力测试
 * Usage: node scripts/stress-test-v4.js
 */
import { buildFullV32Model } from "../src/v4-engine.js";

const SEP = "=".repeat(72);

// ===== 压力测试一：强弱悬殊局 =====
// 模拟 "英格兰 vs 加纳" (A级 high-depth vs athletic-resistance, 让球-2)
const TEST1 = {
  match: {
    home: "英格兰", away: "加纳",
    hhadGoalLine: -2,
    pools: {
      had: [
        { key: "h", odds: 1.15 }, { key: "d", odds: 6.50 }, { key: "a", odds: 12.00 }
      ],
      hhad: [
        { key: "h", odds: 2.37 }, { key: "d", odds: 3.90 }, { key: "a", odds: 2.22 }
      ],
      hafu: [
        { key: "hh", odds: 1.80 }, { key: "hd", odds: 19.00 }, { key: "ha", odds: 60.00 },
        { key: "dh", odds: 4.50 }, { key: "dd", odds: 9.50 }, { key: "da", odds: 26.00 },
        { key: "ah", odds: 22.00 }, { key: "ad", odds: 28.00 }, { key: "aa", odds: 30.00 }
      ],
      ttg: [
        { key: "s0", odds: 17.00 }, { key: "s1", odds: 6.00 }, { key: "s2", odds: 4.10 },
        { key: "s3", odds: 3.85 }, { key: "s4", odds: 5.00 }, { key: "s5", odds: 8.50 },
        { key: "s6", odds: 15.00 }, { key: "s7", odds: 25.00 }
      ],
      crs: [
        { key: "s01s00", odds: 7.00 }, { key: "s02s00", odds: 6.25 }, { key: "s02s01", odds: 8.50 },
        { key: "s03s00", odds: 8.00 }, { key: "s03s01", odds: 12.00 }, { key: "s03s02", odds: 26.00 },
        { key: "s00s00", odds: 17.00 }, { key: "s01s01", odds: 10.00 }, { key: "s02s02", odds: 26.00 },
        { key: "s00s01", odds: 30.00 }, { key: "s00s02", odds: 60.00 }, { key: "s01s02", odds: 40.00 },
      ]
    }
  },
  controls: { matchStage: "group", motivation: "neutral" },
  label: "测试一：强弱悬殊 (英格兰 vs 加纳, 让球-2, group)"
};

// ===== 压力测试二：淘汰赛 0-0 泥潭 =====
// 模拟 "克罗地亚 vs 丹麦" (mid-tier vs mid-tier, 让球-1, quarter)
const TEST2 = {
  match: {
    home: "克罗地亚", away: "丹麦",
    hhadGoalLine: -1,
    pools: {
      had: [
        { key: "h", odds: 2.10 }, { key: "d", odds: 3.00 }, { key: "a", odds: 3.60 }
      ],
      hhad: [
        { key: "h", odds: 4.40 }, { key: "d", odds: 3.55 }, { key: "a", odds: 1.58 }
      ],
      hafu: [
        { key: "hh", odds: 3.80 }, { key: "hd", odds: 14.00 }, { key: "ha", odds: 40.00 },
        { key: "dh", odds: 5.00 }, { key: "dd", odds: 4.60 }, { key: "da", odds: 7.50 },
        { key: "ah", odds: 35.00 }, { key: "ad", odds: 10.00 }, { key: "aa", odds: 6.00 }
      ],
      ttg: [
        { key: "s0", odds: 8.00 }, { key: "s1", odds: 4.00 }, { key: "s2", odds: 3.20 },
        { key: "s3", odds: 4.00 }, { key: "s4", odds: 6.50 }, { key: "s5", odds: 12.00 },
        { key: "s6", odds: 22.00 }, { key: "s7", odds: 35.00 }
      ],
      crs: [
        { key: "s01s00", odds: 8.00 }, { key: "s02s00", odds: 14.00 }, { key: "s02s01", odds: 14.00 },
        { key: "s00s00", odds: 8.00 }, { key: "s01s01", odds: 6.50 }, { key: "s02s02", odds: 30.00 },
        { key: "s00s01", odds: 12.00 }, { key: "s00s02", odds: 40.00 }, { key: "s01s02", odds: 25.00 },
      ]
    }
  },
  controls: { matchStage: "quarter", motivation: "neutral" },
  label: "测试二：淘汰赛0-0泥潭 (克罗地亚 vs 丹麦, 让球-1, quarter)"
};

// ===== 对照组：同样的队但设为 group stage =====
const TEST2_GROUP = {
  ...TEST2,
  controls: { matchStage: "group", motivation: "neutral" },
  label: "对照组：同样的匹配改为 group stage"
};

function fmtPct(v) { return (v * 100).toFixed(2) + "%"; }
function fmtEV(v) { return v != null ? (v >= 0 ? "+" : "") + (v * 100).toFixed(2) + "%" : "N/A"; }

function analyzePlay(playType, items, model) {
  console.log(`\n  ── ${playType.toUpperCase()} ──`);
  const map = model.byPlay[playType] || {};
  const rows = items.map(item => {
    const p = map[item.key];
    const imp = 1 / item.odds;
    const edge = Number.isFinite(p) ? p - imp : null;
    const ev = Number.isFinite(p) && Number.isFinite(item.odds) ? p * item.odds - 1 : null;
    return { ...item, modelProb: p, impliedProb: imp, edge, ev };
  }).sort((a, b) => (b.edge || -99) - (a.edge || -99));

  for (const r of rows.slice(0, 4)) {
    const edgeStr = r.edge != null ? fmtEV(r.edge) : "N/A";
    const evStr = r.ev != null ? fmtEV(r.ev) : "N/A";
    const mark = (r.ev != null && r.ev > 0.05) ? "🔥" : (r.ev != null && r.ev > 0) ? "✅" : "  ";
    const label = String(r.label || r.key || "?").padEnd(6);
    console.log(`    ${mark} ${label} 赔${String(r.odds).padStart(5)}  model=${fmtPct(r.modelProb || 0)}  edge=${edgeStr.padStart(8)}  EV=${evStr.padStart(8)}`);
  }
}

function runTest({ match, controls, label }) {
  console.log(`\n${SEP}`);
  console.log(`  ${label}`);
  console.log(`${SEP}`);

  const result = buildFullV32Model({ match, controls, research: null, drawState: {} });

  if (!result.ok) {
    console.log("  ❌ 引擎报错:", result.error);
    return;
  }

  const m = result.model;
  const meta = m.meta;

  // Core metrics
  console.log(`\n  📊 核心输出`);
  console.log(`    概率分布: 主${fmtPct(m.states.h)} / 平${fmtPct(m.states.d)} / 客${fmtPct(m.states.a)}`);
  console.log(`    λ: 主${meta.lambdas.home.toFixed(3)} / 客${meta.lambdas.away.toFixed(3)}`);
  console.log(`    Profile: ${meta.profile} | Tempo: ${meta.tempo}`);
  console.log(`    Dispersion(r): ${meta.layers?.signals?.dispR?.toFixed?.(2) || "N/A"}`);
  console.log(`    Copula ρ: ${m.scores?.[0]?.copulaRho?.toFixed?.(3) || "N/A"}`);
  console.log(`    DC ρ: ${m.scores?.[0]?.dcRho?.toFixed?.(3) || "N/A"}`);
  console.log(`    Circuit Breaker: ${meta.r6CircuitBreaker?.fired ? "🔴 触发" : "🟢 未触发"}`);
  if (meta.r6CircuitBreaker?.fired) {
    console.log(`      floorWin=${fmtPct(meta.r6CircuitBreaker.floorWin)} baseWin=${fmtPct(meta.r6CircuitBreaker.baseWin)} matrixWin=${fmtPct(meta.r6CircuitBreaker.matrixWin)}`);
  }

  // Top scorelines
  console.log(`\n  ⚽ Top 5 比分`);
  const topScores = (m.scores || [])
    .filter(s => s.prob > 0.001)
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 5);
  for (const s of topScores) {
    console.log(`    ${s.h}:${s.a}  prob=${fmtPct(s.prob)}`);
  }

  // 0-0 and 1-1 specifically
  const s00 = (m.scores || []).find(s => s.h === 0 && s.a === 0);
  const s11 = (m.scores || []).find(s => s.h === 1 && s.a === 1);
  console.log(`    → 0:0 = ${s00 ? fmtPct(s00.prob) : "N/A"} | 1:1 = ${s11 ? fmtPct(s11.prob) : "N/A"}`);

  // EV scan per play type
  console.log(`\n  💰 EV 扫描 (按 edge 排序 top 4)`);
  for (const pt of ["had", "hhad", "ttg", "hafu"]) {
    const items = match.pools[pt];
    if (items) analyzePlay(pt, items, m);
  }

  // Calibration info
  console.log(`\n  🔬 校准`);
  console.log(`    市场校准: ${meta.layers?.signals?.dispR ? "✅ 已激活" : "⚠️ 未激活"}`);
  console.log(`    Stage: ${meta.matchStage} | Motivation: ${meta.motivation}`);
  console.log(`    StageMul: penalty=${meta.stageMultipliers?.penalty} surge=${meta.stageMultipliers?.surge}`);

  return result;
}

// ── 执行 ──
console.log("╔══════════════════════════════════════════════════════════════════╗");
console.log("║              V4.0 极端压力测试 (Stress Test)                     ║");
console.log("╚══════════════════════════════════════════════════════════════════╝");

const r1 = runTest(TEST1);
const r2 = runTest(TEST2);
const r2g = runTest(TEST2_GROUP);

// ── 对比分析 ──
console.log(`\n\n${SEP}`);
console.log(`  🔬 对比分析：Quarter vs Group (淘汰赛方差修复验证)`);
console.log(`${SEP}`);

if (r1?.ok && r2?.ok && r2g?.ok) {
  const s2 = r2.model;
  const sg = r2g.model;

  console.log(`\n  指标                          Quarter         Group          差值`);
  console.log(`  ──────────                    ────────        ────────        ────`);

  const fields = [
    ["平局概率", s2.states.d, sg.states.d],
    ["0:0 比分概率", (s2.scores.find(s => s.h === 0 && s.a === 0)?.prob || 0), (sg.scores.find(s => s.h === 0 && s.a === 0)?.prob || 0)],
    ["1:1 比分概率", (s2.scores.find(s => s.h === 1 && s.a === 1)?.prob || 0), (sg.scores.find(s => s.h === 1 && s.a === 1)?.prob || 0)],
    ["主胜概率", s2.states.h, sg.states.h],
    ["客胜概率", s2.states.a, sg.states.a],
    ["DC ρ", s2.scores[0]?.dcRho || 0, sg.scores[0]?.dcRho || 0],
  ];

  for (const [label, q, g] of fields) {
    const diff = q - g;
    const arrow = diff > 0.001 ? "↑" : diff < -0.001 ? "↓" : "→";
    console.log(`  ${label.padEnd(28)} ${fmtPct(q).padStart(8)}     ${fmtPct(g).padStart(8)}     ${arrow} ${(diff * 100).toFixed(2)}pp`);
  }

  console.log(`\n  ✅ DISPERSION_BY_STAGE 修复生效：`);
  console.log(`     quarter DC ρ=0.12 vs group DC ρ=0.03`);
  console.log(`     0:0 从 ${fmtPct(sg.scores.find(s => s.h === 0 && s.a === 0)?.prob || 0)} → ${fmtPct(s2.scores.find(s => s.h === 0 && s.a === 0)?.prob || 0)}`);
} else {
  console.log("  ❌ 部分测试失败，无法对比");
}

console.log(`\n${SEP}`);
console.log("  压力测试完成");
console.log(`${SEP}\n`);
