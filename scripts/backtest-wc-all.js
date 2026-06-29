/**
 * V4 完全体 — 2010+2014+2018 世界杯淘汰赛 48场盲测
 * 1/4 Kelly 仓位 | Min EV=3%
 */
import { buildFullV32Model } from "../src/v4-engine.js";

const KELLY_MULT = 0.25, MAX_STAKE_PCT = 0.05, BANKROLL = 10000, MIN_EV = 0.03;

// Pre-match strength tiers → typical HAD odds ranges
function oddsTier(tier, favIsHome) {
  const T = {
    S: { hFav:[1.25,4.75,8.50], aFav:[6.50,4.00,1.45], hhadLine:-2, hhadFav:[2.15,3.75,2.50], ttg0:13, ttg1:5.5 },
    A: { hFav:[1.45,4.00,6.50], aFav:[5.00,3.80,1.80], hhadLine:-1, hhadFav:[2.55,3.30,2.25], ttg0:11, ttg1:4.8 },
    B: { hFav:[1.80,3.40,4.33], aFav:[3.75,3.30,2.10], hhadLine:-1, hhadFav:[3.00,3.40,2.00], ttg0:9, ttg1:4.2 },
    C: { hFav:[2.10,3.20,3.50], aFav:[3.25,3.10,2.30], hhadLine: 0, hhadFav:[3.80,3.40,1.80], ttg0:8, ttg1:4.0 },
    D: { hFav:[2.50,3.10,2.80], aFav:[2.80,3.10,2.50], hhadLine: 0, hhadFav:[5.00,3.80,1.50], ttg0:8, ttg1:4.0 },
  };
  const t = T[tier];
  const [h, d, a] = favIsHome ? t.hFav : t.aFav;
  const hhad = favIsHome
    ? [{ key:"h",odds:t.hhadFav[0]},{ key:"d",odds:t.hhadFav[1]},{ key:"a",odds:t.hhadFav[2] }]
    : [{ key:"h",odds:t.hhadFav[2]},{ key:"d",odds:t.hhadFav[1]},{ key:"a",odds:t.hhadFav[0] }];
  const ttg = [
    { key:"s0",odds:t.ttg0},{ key:"s1",odds:t.ttg1},{ key:"s2",odds:3.25},
    { key:"s3",odds:3.80},{ key:"s4",odds:6.00},{ key:"s5",odds:12.00},
    { key:"s6",odds:20.00},{ key:"s7",odds:30.00}
  ];
  // HAFU approximate
  const hh = favIsHome ? (1/h+0.05 > 1.4 ? 1/h+0.05 : 1/h) : (1/a+0.05 > 1.4 ? 1/a+0.05 : 1/a);
  const hafu = [
    { key:"hh",odds:Math.round(hh*100)/100},{ key:"hd",odds:Math.round(1/(0.07)*10)/10},{ key:"ha",odds:Math.round(1/(0.02)*10)/10},
    { key:"dh",odds:Math.round(1/(0.07)*10)/10},{ key:"dd",odds:Math.round(1/(0.16)*10)/10},{ key:"da",odds:Math.round(1/(0.08)*10)/10},
    { key:"ah",odds:Math.round(1/(0.03)*10)/10},{ key:"ad",odds:Math.round(1/(0.06)*10)/10},{ key:"aa",odds:Math.round(1/(0.10)*10)/10},
  ];
  return { had: [{ key:"h",odds:h},{ key:"d",odds:d},{ key:"a",odds:a }], hhad, ttg, hafu, hhadGoalLine: t.hhadLine };
}

function buildMatch(home, away, stage, homeGoals, awayGoals, halfH, halfA, tier, favIsHome, motivation = "neutral") {
  const odds = oddsTier(tier, favIsHome);
  return {
    home, away, stage, motivation,
    result: { full: { h: homeGoals, a: awayGoals }, half: { h: halfH ?? 0, a: halfA ?? 0 } },
    hhadGoalLine: odds.hhadGoalLine,
    had: odds.had, hhad: odds.hhad, ttg: odds.ttg, hafu: odds.hafu,
  };
}

// ====== 2018 World Cup ======
const WC2018 = [
  buildMatch("法国","阿根廷","round_of_16",4,3,1,1,"C",true),   // France slightly favored
  buildMatch("乌拉圭","葡萄牙","round_of_16",2,1,1,0,"B",true),
  buildMatch("西班牙","俄罗斯","round_of_16",1,1,1,1,"B",true),  // 1-1, Russia won pens
  buildMatch("克罗地亚","丹麦","round_of_16",1,1,1,1,"C",true),  // 1-1, Croatia won pens
  buildMatch("巴西","墨西哥","round_of_16",2,0,1,0,"A",true),
  buildMatch("比利时","日本","round_of_16",3,2,0,0,"A",true),    // Belgium came from 0-2
  buildMatch("瑞典","瑞士","round_of_16",1,0,0,0,"D",true),
  buildMatch("哥伦比亚","英格兰","round_of_16",1,1,0,0,"C",false), // 1-1, ENG won pens

  buildMatch("乌拉圭","法国","quarter",0,2,0,1,"B",false),
  buildMatch("巴西","比利时","quarter",1,2,0,2,"B",true),
  buildMatch("瑞典","英格兰","quarter",0,2,0,1,"B",false),
  buildMatch("俄罗斯","克罗地亚","quarter",2,2,1,1,"C",false),

  buildMatch("法国","比利时","semi",1,0,0,0,"C",true),
  buildMatch("克罗地亚","英格兰","semi",2,1,0,1,"D",true),

  buildMatch("比利时","英格兰","final",2,0,1,0,"C",true,"third_place"), // 3rd place
  buildMatch("法国","克罗地亚","final",4,2,2,1,"A",true),         // Final
];

// ====== 2014 World Cup ======
const WC2014 = [
  buildMatch("巴西","智利","round_of_16",1,1,1,1,"A",true),       // 1-1, BRA won pens
  buildMatch("哥伦比亚","乌拉圭","round_of_16",2,0,1,0,"C",true),
  buildMatch("荷兰","墨西哥","round_of_16",2,1,0,0,"B",true),
  buildMatch("哥斯达黎加","希腊","round_of_16",1,1,0,0,"D",true),  // 1-1, CRC won pens
  buildMatch("法国","尼日利亚","round_of_16",2,0,0,0,"B",true),
  buildMatch("德国","阿尔及利亚","round_of_16",2,1,0,0,"A",true),
  buildMatch("阿根廷","瑞士","round_of_16",1,0,0,0,"A",true),
  buildMatch("比利时","美国","round_of_16",2,1,0,0,"B",true),

  buildMatch("法国","德国","quarter",0,1,0,1,"C",true),
  buildMatch("巴西","哥伦比亚","quarter",2,1,1,0,"A",true),
  buildMatch("阿根廷","比利时","quarter",1,0,1,0,"C",true),
  buildMatch("荷兰","哥斯达黎加","quarter",0,0,0,0,"B",true),     // 0-0, NED won pens

  buildMatch("巴西","德国","semi",1,7,0,5,"B",true),              // 😱
  buildMatch("阿根廷","荷兰","semi",0,0,0,0,"C",true),            // 0-0, ARG won pens

  buildMatch("巴西","荷兰","final",0,3,0,2,"C",true,"third_place"),             // 3rd place
  buildMatch("德国","阿根廷","final",1,0,0,0,"C",true),            // Final
];

// ====== 2010 World Cup ======
const WC2010 = [
  buildMatch("乌拉圭","韩国","round_of_16",2,1,1,0,"C",true),
  buildMatch("美国","加纳","round_of_16",1,2,0,1,"D",true),
  buildMatch("德国","英格兰","round_of_16",4,1,2,1,"B",true),
  buildMatch("阿根廷","墨西哥","round_of_16",3,1,2,0,"A",true),
  buildMatch("荷兰","斯洛伐克","round_of_16",2,1,1,0,"B",true),
  buildMatch("巴西","智利","round_of_16",3,0,2,0,"A",true),
  buildMatch("巴拉圭","日本","round_of_16",0,0,0,0,"D",true),     // 0-0, PAR won pens
  buildMatch("西班牙","葡萄牙","round_of_16",1,0,0,0,"C",true),

  buildMatch("巴西","荷兰","quarter",1,2,1,0,"B",true),
  buildMatch("乌拉圭","加纳","quarter",1,1,0,1,"C",true),          // 1-1, URU won pens
  buildMatch("阿根廷","德国","quarter",0,4,0,1,"B",true),
  buildMatch("巴拉圭","西班牙","quarter",0,1,0,0,"B",false),

  buildMatch("荷兰","乌拉圭","semi",3,2,1,1,"B",true),
  buildMatch("德国","西班牙","semi",0,1,0,0,"C",true),

  buildMatch("德国","乌拉圭","final",3,2,1,1,"B",true,"third_place"),           // 3rd place
  buildMatch("荷兰","西班牙","final",0,1,0,0,"C",true),            // Final (0-0 aet, ESP 1-0)
];

// ── Runner ──
function resolveBet(pred, result) {
  const {full:{h:fh,a:fa},half:{h:hh,a:ha}} = result;
  let won = false;
  if (pred.play === "had") {
    if (fh > fa && pred.key === "h") won = true;
    else if (fh === fa && pred.key === "d") won = true;
    else if (fh < fa && pred.key === "a") won = true;
  } else if (pred.play === "hhad") {
    const line = pred.hhadGoalLine || 0;
    const adj = fh + line - fa;
    if (adj > 0 && pred.key === "h") won = true;
    else if (adj === 0 && pred.key === "d") won = true;
    else if (adj < 0 && pred.key === "a") won = true;
  } else if (pred.play === "ttg") {
    const total = fh + fa;
    const bin = total >= 7 ? 7 : total;
    if (pred.key === `s${bin}`) won = true;
  } else if (pred.play === "hafu") {
    let halfRes = hh > ha ? "h" : hh < ha ? "a" : "d";
    let fullRes = fh > fa ? "h" : fh < fa ? "a" : "d";
    if (pred.key === halfRes + fullRes) won = true;
  }
  return won;
}

function fmtPct(v) { return (v * 100).toFixed(2) + "%"; }

function runWC(name, matches) {
  console.log(`\n${"═".repeat(62)}`);
  console.log(`  ${name}`);
  console.log(`${"═".repeat(62)}`);

  const bets = [];
  for (const m of matches) {
    const model = buildFullV32Model({
      match: { home: m.home, away: m.away, hhadGoalLine: m.hhadGoalLine, pools: { had: m.had, hhad: m.hhad, ttg: m.ttg, hafu: m.hafu } },
      controls: { matchStage: m.stage, motivation: m.motivation || "neutral" },
      research: null, drawState: {}
    });
    if (!model.ok) continue;
    const { states, byPlay } = model.model;
    const res = m.result;

    let matchLine = `${m.stage==="round_of_16"?"R16":m.stage==="quarter"?"QF":m.stage==="semi"?"SF":"FNL"} ${m.home} ${res.full.h}:${res.full.a} ${m.away}`;
    if ((res.full.h === res.full.a || isExtraTime(m))) matchLine += " *";
    matchLine += ` | M:${fmtPct(states.h)}/${fmtPct(states.d)}/${fmtPct(states.a)}`;
    console.log(`  ${matchLine}`);

    for (const pt of ["had","hhad","ttg","hafu"]) {
      const pool = m[pt];
      const probs = byPlay[pt] || {};
      if (!pool) continue;
      for (const item of pool) {
        const prob = probs[item.key];
        if (!Number.isFinite(prob)) continue;
        const ev = prob * item.odds - 1;
        if (ev < MIN_EV) continue;
        const kellyFrac = Math.min((ev / (item.odds - 1)) * KELLY_MULT, MAX_STAKE_PCT);
        const stake = Math.max(2, Math.round(BANKROLL * kellyFrac / 2) * 2);
        const won = resolveBet({ play: pt, key: item.key, hhadGoalLine: m.hhadGoalLine }, res);
        const profit = won ? stake * item.odds - stake : -stake;
        bets.push({ match: `${m.home}vs${m.away}`, stage: m.stage, play: pt, option: item.key, odds: item.odds, prob, ev, stake, won, profit, hasET: isExtraTime(m) });
      }
    }
  }

  const totalStake = bets.reduce((s,b)=>s+b.stake,0);
  const totalReturn = bets.reduce((s,b)=>s+(b.won?b.stake*b.odds:0),0);
  const wins = bets.filter(b=>b.won).length;
  const roi = totalStake>0 ? ((totalReturn-totalStake)/totalStake*100) : 0;

  console.log(`\n  📊 ${bets.length}笔 | 命中${wins}( ${(wins/bets.length*100).toFixed(1)}% ) | ¥${totalStake}→¥${totalReturn.toFixed(0)} | ROI ${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`);

  // By play
  for (const pt of ["had","hhad","ttg","hafu"]) {
    const sb = bets.filter(b=>b.play===pt);
    if (!sb.length) continue;
    const sS = sb.reduce((s,b)=>s+b.stake,0);
    const sR = sb.reduce((s,b)=>s+(b.won?b.stake*b.odds:0),0);
    console.log(`    ${pt}: ${sb.length}笔 命中${sb.filter(b=>b.won).length} ¥${sS}→¥${sR.toFixed(0)} ROI ${(((sR-sS)/sS)*100).toFixed(1)}%`);
  }

  // By stage
  for (const stg of ["round_of_16","quarter","semi","final"]) {
    const sb = bets.filter(b=>b.stage===stg);
    if (!sb.length) continue;
    const sS = sb.reduce((s,b)=>s+b.stake,0);
    const sR = sb.reduce((s,b)=>s+(b.won?b.stake*b.odds:0),0);
    console.log(`    ${stg==="round_of_16"?"R16":stg}: ${sb.length}笔 ¥${sS}→¥${sR.toFixed(0)} ROI ${(((sR-sS)/sS)*100).toFixed(1)}%`);
  }

  return { bets, totalStake, totalReturn, wins, roi };
}

function isExtraTime(m) {
  // Matches that went to ET (result shown as full 120min score, not regulation)
  // For WC backtests, we use full-time (120min) score since betting settles on that
  return false; // All our scores are 120min final scores for knockout
}

// ── Main ──
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║   V4 完全体 — 2010+2014+2018 世界杯淘汰赛 48场盲测     ║");
console.log("║   1/4 Kelly | ¥10,000/届 | Min EV=3%                    ║");
console.log("╚══════════════════════════════════════════════════════════╝");

console.log("\n⚠️ 注：淘汰赛计分使用120分钟最终比分（博彩以加时后结果结算）");

const r18 = runWC("2018 俄罗斯世界杯 (16场)", WC2018);
const r14 = runWC("2014 巴西世界杯 (16场)", WC2014);
const r10 = runWC("2010 南非世界杯 (16场)", WC2010);

// ── Aggregate ──
console.log(`\n\n${"═".repeat(62)}`);
console.log(`  🏆 三届世界杯合并汇总 (48场淘汰赛)`);
console.log(`${"═".repeat(62)}`);

const allBets = [...(r18.bets||[]), ...(r14.bets||[]), ...(r10.bets||[])];
const aggStake = allBets.reduce((s,b)=>s+b.stake,0);
const aggReturn = allBets.reduce((s,b)=>s+(b.won?b.stake*b.odds:0),0);
const aggWins = allBets.filter(b=>b.won).length;
const aggROI = aggStake>0 ? ((aggReturn-aggStake)/aggStake*100) : 0;

console.log(`  总投注: ${allBets.length}笔 | 命中: ${aggWins}笔 (${(aggWins/allBets.length*100).toFixed(1)}%)`);
console.log(`  总投入: ¥${aggStake} | 总返还: ¥${aggReturn.toFixed(0)} | 净利: ¥${(aggReturn-aggStake).toFixed(0)}`);
console.log(`  ROI: ${aggROI >= 0 ? "+" : ""}${aggROI.toFixed(1)}%`);

console.log(`\n  分届:`);
for (const [label, r] of [["2018",r18],["2014",r14],["2010",r10]]) {
  console.log(`  ${label}: ${r.bets.length}笔 命中${r.wins} ROI ${r.roi >= 0 ? "+" : ""}${r.roi.toFixed(1)}%`);
}

// Top winners
const topBets = [...allBets].sort((a,b)=>b.profit-a.profit).slice(0,5);
console.log(`\n  🏅 最佳5笔:`);
topBets.forEach(b => {
  console.log(`  ${b.won?"✅":"❌"} ${b.match} ${b.play} ${b.option} 赔${b.odds} 投${b.stake} → ${b.won?"+":""}${b.profit}元`);
});

console.log(`\n${"═".repeat(62)}`);
console.log(`  三届世界杯盲测完成`);
console.log(`${"═".repeat(62)}\n`);
