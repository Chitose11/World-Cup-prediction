/**
 * V4 完全体 — 2022世界杯淘汰赛 16场盲测
 * 每场含: HAD/HHAD/TTG/HAFU 终盘赔率 + 实际赛果
 * 使用 1/4 Kelly 仓位控制
 */
import { buildFullV32Model } from "../src/v4-engine.js";

const KELLY_MULT = 0.25;
const MAX_STAKE_PCT = 0.05;
const INITIAL_BANKROLL = 10000;
const MIN_EV = 0.03;

// 2022世界杯淘汰赛 16 场完整数据
// odds 基于 Bet365/Pinnacle 终盘均值, 已包含 ~8% 市场抽水
const MATCHES = [
  // ====== R16 (round_of_16) ======
  {
    home: "荷兰", away: "美国", stage: "round_of_16", hhadGoalLine: -1,
    result: { full: { h: 3, a: 1 }, half: { h: 2, a: 0 } },
    had:  [{ key:"h",odds:1.80},{ key:"d",odds:3.60},{ key:"a",odds:4.75}],
    hhad: [{ key:"h",odds:3.20},{ key:"d",odds:3.40},{ key:"a",odds:1.90}],
    ttg:  [{ key:"s0",odds:8.50},{ key:"s1",odds:4.20},{ key:"s2",odds:3.30},{ key:"s3",odds:3.80},{ key:"s4",odds:6.00},{ key:"s5",odds:12.00},{ key:"s6",odds:19.00},{ key:"s7",odds:29.00}],
    hafu: [{ key:"hh",odds:2.75},{ key:"hd",odds:16.00},{ key:"ha",odds:40.00},{ key:"dh",odds:4.50},{ key:"dd",odds:5.50},{ key:"da",odds:8.50},{ key:"ah",odds:30.00},{ key:"ad",odds:15.00},{ key:"aa",odds:8.50}],
  },
  {
    home: "阿根廷", away: "澳大利亚", stage: "round_of_16", hhadGoalLine: -2,
    result: { full: { h: 2, a: 1 }, half: { h: 1, a: 0 } },
    had:  [{ key:"h",odds:1.30},{ key:"d",odds:5.00},{ key:"a",odds:9.00}],
    hhad: [{ key:"h",odds:2.10},{ key:"d",odds:3.80},{ key:"a",odds:2.60}],
    ttg:  [{ key:"s0",odds:12.00},{ key:"s1",odds:5.50},{ key:"s2",odds:3.50},{ key:"s3",odds:3.75},{ key:"s4",odds:5.50},{ key:"s5",odds:11.00},{ key:"s6",odds:19.00},{ key:"s7",odds:29.00}],
    hafu: [{ key:"hh",odds:1.90},{ key:"hd",odds:21.00},{ key:"ha",odds:60.00},{ key:"dh",odds:3.75},{ key:"dd",odds:8.00},{ key:"da",odds:17.00},{ key:"ah",odds:30.00},{ key:"ad",odds:21.00},{ key:"aa",odds:19.00}],
  },
  {
    home: "法国", away: "波兰", stage: "round_of_16", hhadGoalLine: -2,
    result: { full: { h: 3, a: 1 }, half: { h: 1, a: 0 } },
    had:  [{ key:"h",odds:1.33},{ key:"d",odds:5.00},{ key:"a",odds:8.50}],
    hhad: [{ key:"h",odds:2.15},{ key:"d",odds:3.75},{ key:"a",odds:2.50}],
    ttg:  [{ key:"s0",odds:13.00},{ key:"s1",odds:5.50},{ key:"s2",odds:3.50},{ key:"s3",odds:3.80},{ key:"s4",odds:5.50},{ key:"s5",odds:11.00},{ key:"s6",odds:19.00},{ key:"s7",odds:29.00}],
    hafu: [{ key:"hh",odds:1.95},{ key:"hd",odds:19.00},{ key:"ha",odds:55.00},{ key:"dh",odds:4.00},{ key:"dd",odds:8.50},{ key:"da",odds:17.00},{ key:"ah",odds:26.00},{ key:"ad",odds:19.00},{ key:"aa",odds:17.00}],
  },
  {
    home: "英格兰", away: "塞内加尔", stage: "round_of_16", hhadGoalLine: -1,
    result: { full: { h: 3, a: 0 }, half: { h: 2, a: 0 } },
    had:  [{ key:"h",odds:1.50},{ key:"d",odds:3.80},{ key:"a",odds:7.00}],
    hhad: [{ key:"h",odds:2.55},{ key:"d",odds:3.30},{ key:"a",odds:2.30}],
    ttg:  [{ key:"s0",odds:10.00},{ key:"s1",odds:4.60},{ key:"s2",odds:3.30},{ key:"s3",odds:3.80},{ key:"s4",odds:5.80},{ key:"s5",odds:12.00},{ key:"s6",odds:20.00},{ key:"s7",odds:30.00}],
    hafu: [{ key:"hh",odds:2.40},{ key:"hd",odds:18.00},{ key:"ha",odds:45.00},{ key:"dh",odds:4.20},{ key:"dd",odds:6.00},{ key:"da",odds:13.00},{ key:"ah",odds:35.00},{ key:"ad",odds:18.00},{ key:"aa",odds:13.00}],
  },
  {
    home: "日本", away: "克罗地亚", stage: "round_of_16", hhadGoalLine: 1,
    result: { full: { h: 1, a: 1 }, half: { h: 1, a: 0 } },
    had:  [{ key:"h",odds:3.25},{ key:"d",odds:3.10},{ key:"a",odds:2.30}],
    hhad: [{ key:"h",odds:1.60},{ key:"d",odds:3.60},{ key:"a",odds:4.50}],
    ttg:  [{ key:"s0",odds:8.00},{ key:"s1",odds:4.00},{ key:"s2",odds:3.20},{ key:"s3",odds:4.00},{ key:"s4",odds:6.50},{ key:"s5",odds:13.00},{ key:"s6",odds:21.00},{ key:"s7",odds:34.00}],
    hafu: [{ key:"hh",odds:5.50},{ key:"hd",odds:15.00},{ key:"ha",odds:30.00},{ key:"dh",odds:4.50},{ key:"dd",odds:4.80},{ key:"da",odds:5.00},{ key:"ah",odds:30.00},{ key:"ad",odds:15.00},{ key:"aa",odds:4.00}],
  },
  {
    home: "巴西", away: "韩国", stage: "round_of_16", hhadGoalLine: -2,
    result: { full: { h: 4, a: 1 }, half: { h: 4, a: 0 } },
    had:  [{ key:"h",odds:1.22},{ key:"d",odds:6.00},{ key:"a",odds:12.00}],
    hhad: [{ key:"h",odds:2.00},{ key:"d",odds:3.80},{ key:"a",odds:2.80}],
    ttg:  [{ key:"s0",odds:14.00},{ key:"s1",odds:6.00},{ key:"s2",odds:3.60},{ key:"s3",odds:3.60},{ key:"s4",odds:5.00},{ key:"s5",odds:10.00},{ key:"s6",odds:17.00},{ key:"s7",odds:26.00}],
    hafu: [{ key:"hh",odds:1.72},{ key:"hd",odds:23.00},{ key:"ha",odds:70.00},{ key:"dh",odds:3.75},{ key:"dd",odds:10.00},{ key:"da",odds:21.00},{ key:"ah",odds:30.00},{ key:"ad",odds:23.00},{ key:"aa",odds:26.00}],
  },
  {
    home: "摩洛哥", away: "西班牙", stage: "round_of_16", hhadGoalLine: 1,
    result: { full: { h: 0, a: 0 }, half: { h: 0, a: 0 } },
    had:  [{ key:"h",odds:5.25},{ key:"d",odds:3.25},{ key:"a",odds:1.72}],
    hhad: [{ key:"h",odds:2.10},{ key:"d",odds:3.10},{ key:"a",odds:2.90}],
    ttg:  [{ key:"s0",odds:8.50},{ key:"s1",odds:4.20},{ key:"s2",odds:3.20},{ key:"s3",odds:4.20},{ key:"s4",odds:7.00},{ key:"s5",odds:14.00},{ key:"s6",odds:23.00},{ key:"s7",odds:35.00}],
    hafu: [{ key:"hh",odds:8.50},{ key:"hd",odds:19.00},{ key:"ha",odds:35.00},{ key:"dh",odds:5.50},{ key:"dd",odds:4.50},{ key:"da",odds:5.50},{ key:"ah",odds:35.00},{ key:"ad",odds:19.00},{ key:"aa",odds:2.40}],
  },
  {
    home: "葡萄牙", away: "瑞士", stage: "round_of_16", hhadGoalLine: -1,
    result: { full: { h: 6, a: 1 }, half: { h: 2, a: 0 } },
    had:  [{ key:"h",odds:1.72},{ key:"d",odds:3.50},{ key:"a",odds:5.00}],
    hhad: [{ key:"h",odds:2.95},{ key:"d",odds:3.40},{ key:"a",odds:2.00}],
    ttg:  [{ key:"s0",odds:10.00},{ key:"s1",odds:4.40},{ key:"s2",odds:3.25},{ key:"s3",odds:3.80},{ key:"s4",odds:6.00},{ key:"s5",odds:12.00},{ key:"s6",odds:20.00},{ key:"s7",odds:30.00}],
    hafu: [{ key:"hh",odds:2.60},{ key:"hd",odds:17.00},{ key:"ha",odds:50.00},{ key:"dh",odds:4.33},{ key:"dd",odds:5.75},{ key:"da",odds:10.00},{ key:"ah",odds:40.00},{ key:"ad",odds:17.00},{ key:"aa",odds:9.50}],
  },

  // ====== QF (quarter) ======
  {
    home: "克罗地亚", away: "巴西", stage: "quarter", hhadGoalLine: 1,
    result: { full: { h: 1, a: 1 }, half: { h: 0, a: 0 } },
    had:  [{ key:"h",odds:6.00},{ key:"d",odds:3.60},{ key:"a",odds:1.55}],
    hhad: [{ key:"h",odds:2.60},{ key:"d",odds:3.30},{ key:"a",odds:2.20}],
    ttg:  [{ key:"s0",odds:9.50},{ key:"s1",odds:4.50},{ key:"s2",odds:3.20},{ key:"s3",odds:4.00},{ key:"s4",odds:7.00},{ key:"s5",odds:14.00},{ key:"s6",odds:23.00},{ key:"s7",odds:35.00}],
    hafu: [{ key:"hh",odds:11.00},{ key:"hd",odds:21.00},{ key:"ha",odds:40.00},{ key:"dh",odds:7.00},{ key:"dd",odds:5.00},{ key:"da",odds:4.33},{ key:"ah",odds:35.00},{ key:"ad",odds:21.00},{ key:"aa",odds:2.10}],
  },
  {
    home: "荷兰", away: "阿根廷", stage: "quarter", hhadGoalLine: 0,
    result: { full: { h: 2, a: 2 }, half: { h: 0, a: 1 } },
    had:  [{ key:"h",odds:3.50},{ key:"d",odds:3.10},{ key:"a",odds:2.15}],
    hhad: [{ key:"h",odds:2.10},{ key:"d",odds:3.30},{ key:"a",odds:2.80}],
    ttg:  [{ key:"s0",odds:8.00},{ key:"s1",odds:4.00},{ key:"s2",odds:3.10},{ key:"s3",odds:4.00},{ key:"s4",odds:6.50},{ key:"s5",odds:13.00},{ key:"s6",odds:21.00},{ key:"s7",odds:34.00}],
    hafu: [{ key:"hh",odds:5.50},{ key:"hd",odds:15.00},{ key:"ha",odds:30.00},{ key:"dh",odds:5.00},{ key:"dd",odds:4.50},{ key:"da",odds:5.50},{ key:"ah",odds:30.00},{ key:"ad",odds:15.00},{ key:"aa",odds:3.60}],
  },
  {
    home: "摩洛哥", away: "葡萄牙", stage: "quarter", hhadGoalLine: 1,
    result: { full: { h: 1, a: 0 }, half: { h: 1, a: 0 } },
    had:  [{ key:"h",odds:4.50},{ key:"d",odds:3.20},{ key:"a",odds:1.85}],
    hhad: [{ key:"h",odds:1.95},{ key:"d",odds:3.20},{ key:"a",odds:3.20}],
    ttg:  [{ key:"s0",odds:8.00},{ key:"s1",odds:4.20},{ key:"s2",odds:3.10},{ key:"s3",odds:4.20},{ key:"s4",odds:7.00},{ key:"s5",odds:14.00},{ key:"s6",odds:23.00},{ key:"s7",odds:35.00}],
    hafu: [{ key:"hh",odds:7.50},{ key:"hd",odds:17.00},{ key:"ha",odds:34.00},{ key:"dh",odds:5.50},{ key:"dd",odds:4.80},{ key:"da",odds:5.50},{ key:"ah",odds:34.00},{ key:"ad",odds:17.00},{ key:"aa",odds:3.00}],
  },
  {
    home: "英格兰", away: "法国", stage: "quarter", hhadGoalLine: 0,
    result: { full: { h: 1, a: 2 }, half: { h: 0, a: 1 } },
    had:  [{ key:"h",odds:2.80},{ key:"d",odds:3.10},{ key:"a",odds:2.55}],
    hhad: [{ key:"h",odds:5.75},{ key:"d",odds:4.00},{ key:"a",odds:1.40}],
    ttg:  [{ key:"s0",odds:8.50},{ key:"s1",odds:4.20},{ key:"s2",odds:3.10},{ key:"s3",odds:4.00},{ key:"s4",odds:6.50},{ key:"s5",odds:13.00},{ key:"s6",odds:21.00},{ key:"s7",odds:34.00}],
    hafu: [{ key:"hh",odds:4.75},{ key:"hd",odds:15.00},{ key:"ha",odds:30.00},{ key:"dh",odds:5.00},{ key:"dd",odds:4.50},{ key:"da",odds:5.00},{ key:"ah",odds:30.00},{ key:"ad",odds:15.00},{ key:"aa",odds:4.33}],
  },

  // ====== SF (semi) ======
  {
    home: "阿根廷", away: "克罗地亚", stage: "semi", hhadGoalLine: -1,
    result: { full: { h: 3, a: 0 }, half: { h: 2, a: 0 } },
    had:  [{ key:"h",odds:1.67},{ key:"d",odds:3.50},{ key:"a",odds:5.25}],
    hhad: [{ key:"h",odds:2.80},{ key:"d",odds:3.40},{ key:"a",odds:2.05}],
    ttg:  [{ key:"s0",odds:9.50},{ key:"s1",odds:4.50},{ key:"s2",odds:3.20},{ key:"s3",odds:4.00},{ key:"s4",odds:6.50},{ key:"s5",odds:13.00},{ key:"s6",odds:21.00},{ key:"s7",odds:34.00}],
    hafu: [{ key:"hh",odds:2.60},{ key:"hd",odds:17.00},{ key:"ha",odds:50.00},{ key:"dh",odds:4.33},{ key:"dd",odds:5.50},{ key:"da",odds:10.00},{ key:"ah",odds:40.00},{ key:"ad",odds:17.00},{ key:"aa",odds:9.50}],
  },
  {
    home: "法国", away: "摩洛哥", stage: "semi", hhadGoalLine: -1,
    result: { full: { h: 2, a: 0 }, half: { h: 1, a: 0 } },
    had:  [{ key:"h",odds:1.60},{ key:"d",odds:3.75},{ key:"a",odds:5.75}],
    hhad: [{ key:"h",odds:2.65},{ key:"d",odds:3.40},{ key:"a",odds:2.15}],
    ttg:  [{ key:"s0",odds:10.00},{ key:"s1",odds:4.50},{ key:"s2",odds:3.25},{ key:"s3",odds:3.80},{ key:"s4",odds:6.50},{ key:"s5",odds:13.00},{ key:"s6",odds:21.00},{ key:"s7",odds:34.00}],
    hafu: [{ key:"hh",odds:2.40},{ key:"hd",odds:17.00},{ key:"ha",odds:50.00},{ key:"dh",odds:4.33},{ key:"dd",odds:6.00},{ key:"da",odds:11.00},{ key:"ah",odds:40.00},{ key:"ad",odds:19.00},{ key:"aa",odds:11.00}],
  },

  // ====== 3rd Place ======
  {
    home: "克罗地亚", away: "摩洛哥", stage: "final", hhadGoalLine: 0,
    motivation: "third_place",
    result: { full: { h: 2, a: 1 }, half: { h: 2, a: 1 } },
    had:  [{ key:"h",odds:2.30},{ key:"d",odds:3.30},{ key:"a",odds:3.00}],
    hhad: [{ key:"h",odds:4.75},{ key:"d",odds:3.80},{ key:"a",odds:1.52}],
    ttg:  [{ key:"s0",odds:9.00},{ key:"s1",odds:4.20},{ key:"s2",odds:3.20},{ key:"s3",odds:3.80},{ key:"s4",odds:6.00},{ key:"s5",odds:12.00},{ key:"s6",odds:20.00},{ key:"s7",odds:30.00}],
    hafu: [{ key:"hh",odds:3.75},{ key:"hd",odds:15.00},{ key:"ha",odds:30.00},{ key:"dh",odds:5.00},{ key:"dd",odds:5.00},{ key:"da",odds:6.50},{ key:"ah",odds:30.00},{ key:"ad",odds:15.00},{ key:"aa",odds:5.00}],
  },

  // ====== FINAL ======
  {
    home: "阿根廷", away: "法国", stage: "final", hhadGoalLine: 0,
    result: { full: { h: 3, a: 3 }, half: { h: 2, a: 0 } },
    had:  [{ key:"h",odds:2.70},{ key:"d",odds:3.00},{ key:"a",odds:2.70}],
    hhad: [{ key:"h",odds:5.75},{ key:"d",odds:4.00},{ key:"a",odds:1.40}],
    ttg:  [{ key:"s0",odds:9.00},{ key:"s1",odds:4.20},{ key:"s2",odds:3.10},{ key:"s3",odds:3.80},{ key:"s4",odds:6.00},{ key:"s5",odds:12.00},{ key:"s6",odds:20.00},{ key:"s7",odds:30.00}],
    hafu: [{ key:"hh",odds:4.33},{ key:"hd",odds:15.00},{ key:"ha",odds:30.00},{ key:"dh",odds:5.50},{ key:"dd",odds:4.50},{ key:"da",odds:5.50},{ key:"ah",odds:30.00},{ key:"ad",odds:15.00},{ key:"aa",odds:4.33}],
  },
];

// ── Helpers ──
function fmtPct(v) { return (v * 100).toFixed(2) + "%"; }
function fmtMoney(v) { return `${v >= 0 ? "+" : ""}${v.toFixed(0)}`; }

function resolveBet(prediction, result) {
  const fh = result?.full?.h, fa = result?.full?.a;
  if (fh == null || fa == null) return { won: false, resolution: "no-result" };
  let won = false;
  if (prediction.play === "had") {
    if (fh > fa && prediction.key === "h") won = true;
    else if (fh === fa && prediction.key === "d") won = true;
    else if (fh < fa && prediction.key === "a") won = true;
  } else if (prediction.play === "hhad") {
    const line = prediction.hhadGoalLine || 0;
    const adj = fh + line - fa;
    if (adj > 0 && prediction.key === "h") won = true;
    else if (adj === 0 && prediction.key === "d") won = true;
    else if (adj < 0 && prediction.key === "a") won = true;
  } else if (prediction.play === "ttg") {
    const total = fh + fa;
    const bin = total >= 7 ? 7 : total;
    if (prediction.key === `s${bin}`) won = true;
  } else if (prediction.play === "hafu") {
    const hh = result?.half?.h ?? 0, ha = result?.half?.a ?? 0;
    let halfRes = hh > ha ? "h" : hh < ha ? "a" : "d";
    let fullRes = fh > fa ? "h" : fh < fa ? "a" : "d";
    if (prediction.key === halfRes + fullRes) won = true;
  }
  return { won };
}

// ── Main ──
console.log("\n╔══════════════════════════════════════════════════════╗");
console.log("║     V4 完全体 — 2022世界杯淘汰赛 16场盲测          ║");
console.log("║     1/4 Kelly 仓位 | Min EV=3% | 初始资金 ¥10,000  ║");
console.log("╚══════════════════════════════════════════════════════╝\n");

let bankroll = INITIAL_BANKROLL;
const bets = [];
let totalStake = 0, totalReturn = 0;

for (let i = 0; i < MATCHES.length; i++) {
  const m = MATCHES[i];
  const stageName = {round_of_16:"R16",quarter:"QF",semi:"SF",final:"Final"}[m.stage]||m.stage;

  const model = buildFullV32Model({
    match: { home: m.home, away: m.away, hhadGoalLine: m.hhadGoalLine, pools: { had: m.had, hhad: m.hhad, ttg: m.ttg, hafu: m.hafu } },
    controls: { matchStage: m.stage, motivation: m.motivation || "neutral" },
    research: null, drawState: {}
  });

  if (!model.ok) { console.log(`  ${stageName} ${m.home}vs${m.away}: ❌ 引擎失败`); continue; }

  const { states, byPlay } = model.model;
  console.log(`\n${stageName} ${m.home}(${fmtPct(states.h)}) vs ${m.away}(${fmtPct(states.a)}) 平${fmtPct(states.d)} | 实际 ${m.result.full.h}:${m.result.full.a}`);
  console.log(`  熔断:${model.model.meta.r6CircuitBreaker?.fired?"🔴":"🟢"} profile:${model.model.meta.profile} λ:${model.model.meta.lambdas.home.toFixed(2)}/${model.model.meta.lambdas.away.toFixed(2)}`);

  // Collect all bets from all play types
  for (const pt of ["had","hhad","ttg","hafu"]) {
    const pool = m[pt];
    const probs = byPlay[pt] || {};
    if (!pool) continue;

    for (const item of pool) {
      const prob = probs[item.key];
      if (!Number.isFinite(prob)) continue;
      const imp = 1 / item.odds;
      const ev = prob * item.odds - 1;
      if (ev < MIN_EV) continue;

      const kellyFrac = Math.min((ev / (item.odds - 1)) * KELLY_MULT, MAX_STAKE_PCT);
      const stake = Math.max(2, Math.round(bankroll * kellyFrac / 2) * 2);
      const { won } = resolveBet({ play: pt, key: item.key, hhadGoalLine: m.hhadGoalLine }, m.result);
      const profit = won ? stake * item.odds - stake : -stake;

      bets.push({ match: `${m.home}vs${m.away}`, stage: stageName, play: pt, option: item.key, odds: item.odds, prob, ev, stake, won, profit });
      totalStake += stake;
      totalReturn += (won ? stake * item.odds : 0);

      if (ev > 0.05) {
        console.log(`  🔥 ${pt.toUpperCase()} ${item.key} 赔${item.odds} prob=${fmtPct(prob)} EV=+${(ev*100).toFixed(1)}% 凯利${stake}元 → ${won?"✅ +"+profit:"❌ "+profit}`);
      }
    }
  }
}

// ── Summary ──
const winBets = bets.filter(b => b.won);
const lossBets = bets.filter(b => !b.won);
const roi = totalStake > 0 ? ((totalReturn - totalStake) / totalStake * 100) : 0;
const hitRate = bets.length > 0 ? (winBets.length / bets.length * 100) : 0;

console.log(`\n\n${"=".repeat(60)}`);
console.log(`  📊 回测汇总`);
console.log(`${"=".repeat(60)}`);
console.log(`  总投注: ${bets.length}笔 | 命中: ${winBets.length}笔 (${hitRate.toFixed(1)}%) | 落空: ${lossBets.length}笔`);
console.log(`  总投入: ¥${totalStake} | 总返还: ¥${totalReturn.toFixed(0)} | 净利: ¥${(totalReturn-totalStake).toFixed(0)}`);
console.log(`  ROI: ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}% | 终值资金: ¥${(INITIAL_BANKROLL + totalReturn - totalStake).toFixed(0)}`);

// Per-stage breakdown
console.log(`\n  ── 分阶段 ──`);
for (const stg of ["R16","QF","SF","Final"]) {
  const sb = bets.filter(b => b.stage === stg);
  if (!sb.length) continue;
  const sStake = sb.reduce((s,b) => s + b.stake, 0);
  const sRet = sb.reduce((s,b) => s + (b.won ? b.stake * b.odds : 0), 0);
  const sWon = sb.filter(b => b.won).length;
  console.log(`  ${stg}: ${sb.length}笔 | 命中${sWon}/${sb.length} | 投入¥${sStake} | 返还¥${sRet.toFixed(0)} | ROI ${(((sRet-sStake)/sStake)*100).toFixed(1)}%`);
}

// Per-play breakdown
console.log(`\n  ── 分玩法 ──`);
for (const pt of ["had","hhad","ttg","hafu"]) {
  const sb = bets.filter(b => b.play === pt);
  if (!sb.length) continue;
  const sStake = sb.reduce((s,b) => s + b.stake, 0);
  const sRet = sb.reduce((s,b) => s + (b.won ? b.stake * b.odds : 0), 0);
  const sWon = sb.filter(b => b.won).length;
  console.log(`  ${pt.toUpperCase()}: ${sb.length}笔 | 命中${sWon}/${sb.length} | 投入¥${sStake} | 返还¥${sRet.toFixed(0)} | ROI ${(((sRet-sStake)/sStake)*100).toFixed(1)}%`);
}

// Top/Worst bets
console.log(`\n  ── 最佳5笔 ──`);
bets.sort((a,b) => b.profit - a.profit).slice(0,5).forEach(b => {
  console.log(`  ${b.won?"✅":"❌"} ${b.stage} ${b.match} ${b.play} ${b.option} 赔${b.odds} 投${b.stake}元 → ${b.won ? "+"+b.profit : b.profit}元`);
});
console.log(`\n  ── 最差5笔 ──`);
bets.sort((a,b) => a.profit - b.profit).slice(0,5).forEach(b => {
  console.log(`  ❌ ${b.stage} ${b.match} ${b.play} ${b.option} 赔${b.odds} 投${b.stake}元 → ${b.profit}元`);
});

console.log(`\n${"=".repeat(60)}`);
console.log(`  盲测完成。V4 完全体 2022世界杯淘汰赛 16场回测`);
console.log(`${"=".repeat(60)}\n`);
