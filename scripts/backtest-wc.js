/**
 * V4.0 Backtest — World Cup teams only, with/without Elo stretch
 * Usage: node scripts/backtest-wc.js [withStretch|withoutStretch]
 */
import { writeFileSync } from "fs";
import { buildFullV32Model as noStretchModel } from "../src/v4-engine.js";

const KELLY_MULT = 0.25, MAX_PCT = 0.05, BANKROLL = 10000, MIN_EV = 0.05, MAX_ODDS = 8;
const API = "http://127.0.0.1:4173";

const KNOWN_TEAMS = new Set([
  "mexico","south africa","south korea","korea","czechia","czech republic",
  "canada","bosnia","bosnia-herzegovina","switzerland","croatia","brazil",
  "morocco","scotland","haiti","colombia","uzbekistan","dr congo","congo dr",
  "england","ghana","panama","portugal","germany","ecuador","ivory coast","curacao",
  "netherlands","japan","sweden","tunisia","belgium","egypt","iran","new zealand",
  "spain","uruguay","saudi arabia","saudi","cape verde","france","senegal","norway",
  "iraq","argentina","austria","algeria","algerie","jordan","united states","australia",
  "turkiye","turkey","paraguay","poland","iceland","serbia","qatar","wales",
  "cameroon","denmark","costa rica","peru","nigeria","russia","hungary","slovakia",
  "slovenia","montenegro","ireland","north macedonia","venezuela","bolivia","chile",
  "china","thailand","northern ireland","kazakhstan","kosovo",
]);
const ALIASES = new Map([
  ["韩国","south korea"],["墨西哥","mexico"],["日本","japan"],["澳大利亚","australia"],
  ["巴西","brazil"],["阿根廷","argentina"],["德国","germany"],["法国","france"],
  ["英格兰","england"],["西班牙","spain"],["荷兰","netherlands"],["葡萄牙","portugal"],
  ["比利时","belgium"],["克罗地亚","croatia"],["乌拉圭","uruguay"],["哥伦比亚","colombia"],
  ["瑞典","sweden"],["丹麦","denmark"],["挪威","norway"],["波兰","poland"],
  ["塞尔维亚","serbia"],["瑞士","switzerland"],["奥地利","austria"],["捷克","czechia"],
  ["土耳其","turkey"],["斯洛伐克","slovakia"],["斯洛文尼","slovenia"],["黑山","montenegro"],
  ["爱尔兰","ireland"],["波黑","bosnia"],["北马其顿","north macedonia"],["冰岛","iceland"],
  ["威尔士","wales"],["苏格兰","scotland"],["加拿大","canada"],["美国","united states"],
  ["摩洛哥","morocco"],["塞内加尔","senegal"],["突尼斯","tunisia"],["加纳","ghana"],
  ["埃及","egypt"],["尼日利亚","nigeria"],["阿尔及利","algeria"],["伊朗","iran"],
  ["沙特","saudi arabia"],["卡塔尔","qatar"],["伊拉克","iraq"],["约旦","jordan"],
  ["科特迪瓦","ivory coast"],["喀麦隆","cameroon"],["南非","south africa"],["秘鲁","peru"],
  ["厄瓜多尔","ecuador"],["巴拉圭","paraguay"],["哥斯达","costa rica"],["巴拿马","panama"],
  ["委内瑞拉","venezuela"],["刚果金","dr congo"],["新西兰","new zealand"],["海地","haiti"],
  ["库拉索","curacao"],["佛得角","cape verde"],["乌兹别克","uzbekistan"],["泰国","thailand"],
  ["北爱尔兰","northern ireland"],["哈萨克","kazakhstan"],["科索沃","kosovo"],
  ["匈牙利","hungary"],["尼日利亚","nigeria"],["俄罗斯","russia"],["中国","china"],
  ["智利","chile"],["玻利维亚","bolivia"],
]);

function known(name) { return KNOWN_TEAMS.has(ALIASES.get(name) || name.toLowerCase()); }

async function fetchJSON(u) { const r = await fetch(u); return r.ok ? r.json() : null; }

function computeKelly(bankroll, prob, odds) {
  const ev = prob * odds - 1;
  if (ev <= 0 || odds <= 1) return 0;
  return Math.max(2, Math.round(bankroll * Math.min((ev / (odds - 1)) * KELLY_MULT, MAX_PCT) / 2) * 2);
}

async function runBacktest(label, useStretch) {
  // Fetch June 2026 results — World Cup matches
  const all = [];
  for (const [from, to] of [["2026-06-01","2026-06-13"],["2026-06-14","2026-06-25"]]) {
    const d = await fetchJSON(`${API}/api/results?from=${from}&to=${to}&pageSize=120`);
    if (d?.matches) all.push(...d.matches.filter(m => m.result?.full?.h != null && m.rawResult?.h));
  }

  // Filter to known teams only
  const filtered = all.filter(m => known(m.homeShort) && known(m.awayShort));
  console.log(`[${label}] 赛果总数: ${all.length} | 已知球队: ${filtered.length}`);

  // Build matches with HAD odds
  const matches = filtered.map(rm => ({
    id: String(rm.id), home: rm.home||"", away: rm.away||"",
    homeShort: rm.homeShort||"", awayShort: rm.awayShort||"",
    matchDate: rm.matchDate||"", hhadGoalLine: Number(rm.hhadGoalLine||0),
    pools: { had: [
      {key:"h",label:"主胜",odds:Number(rm.rawResult.h)},
      {key:"d",label:"平局",odds:Number(rm.rawResult.d)},
      {key:"a",label:"客胜",odds:Number(rm.rawResult.a)},
    ]},
    result: rm.result,
  }));

  let bankroll = BANKROLL;
  const bets = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    let r;
    try {
      r = buildFullV32Model({ match: m, research: null, controls: { matchStage: "group", motivation: "neutral" }, drawState: { matchesPlayed: i, draws: 0 } });
    } catch (e) { continue; }
    const model = r.model;
    if (!model?.states) continue;

    // Evaluate HAD only
    let best = null, bestEV = -Infinity;
    for (const item of m.pools.had) {
      const prob = item.key === "h" ? model.states.h : item.key === "d" ? model.states.d : model.states.a;
      if (!Number.isFinite(prob) || prob <= 0) continue;
      if (item.odds > MAX_ODDS) continue;
      const ev = prob * item.odds - 1;
      if (ev <= MIN_EV || ev <= bestEV) continue;
      best = { play:"had", key:item.key, label:item.label, odds:item.odds, prob, ev };
      bestEV = ev;
    }
    if (!best) { console.log(`[${i+1}] ${m.homeShort} vs ${m.awayShort} — no value`); continue; }

    const stake = computeKelly(bankroll, best.prob, best.odds);
    if (stake <= 0) continue;

    const r2 = m.result;
    let won = false;
    if (r2.full.h > r2.full.a && best.key === "h") won = true;
    else if (r2.full.h === r2.full.a && best.key === "d") won = true;
    else if (r2.full.h < r2.full.a && best.key === "a") won = true;

    const profit = won ? stake * best.odds - stake : -stake;
    bankroll += profit;
    bets.push({ home:m.homeShort,away:m.awayShort,date:m.matchDate,play:best.play,label:best.label,odds:best.odds,modelProb:best.prob,ev:best.ev,stake,positionPct:stake/(bankroll-profit),won,profit,score:`${r2.full.h}:${r2.full.a}`});

    console.log(`[${i+1}] ${won?"✅":"❌"} ${bets[bets.length-1].home} vs ${bets[bets.length-1].away} ${r2.full.h}:${r2.full.a} | ${best.label} @${best.odds} | EV ${best.ev>=0?"+":""}${(best.ev*100).toFixed(1)}% | ${(bets[bets.length-1].positionPct*100).toFixed(1)}% ¥${stake} | ${profit>=0?"+":""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
  }

  const won = bets.filter(b=>b.won).length;
  const pnl = bankroll - BANKROLL;
  const theory = bets.reduce((s,b)=>s+b.ev*b.stake,0);
  const ratio = theory ? pnl/theory : 0;

  console.log(`\n[${label}] 投注 ${bets.length} | 命中 ${won} (${(won/bets.length*100).toFixed(1)}%) | ¥${BANKROLL}→¥${Math.round(bankroll)} (${(pnl/BANKROLL*100).toFixed(1)}%) | EV比 ${ratio.toFixed(2)}x`);
  return { label, bets, won, pnl, theory, ratio, bankroll };
}

async function main() {
  const mode = process.argv[2] || "without";

  if (mode === "without") {
    // Without Elo stretch (comment out stretch in engine)
    console.log("=== WITHOUT Elo Stretch ===\n");
    const r = await runBacktest("无拉伸", false);
    writeFileSync("backtest-no-stretch.json", JSON.stringify({config:{stretch:false},summary:{bets:r.bets.length,won:r.won,pnl:r.pnl,theory:r.theory,ratio:r.ratio},bets:r.bets},null,2));
  } else if (mode === "with") {
    console.log("=== WITH Elo Stretch ===\n");
    const r = await runBacktest("有拉伸", true);
    writeFileSync("backtest-with-stretch.json", JSON.stringify({config:{stretch:true},summary:{bets:r.bets.length,won:r.won,pnl:r.pnl,theory:r.theory,ratio:r.ratio},bets:r.bets},null,2));
  } else {
    // Compare mode
    console.log("=== COMPARISON ===\n");
    // Both use the same data, same engine (stretch is baked into v4-engine)
    // Run once — stretch is now in the engine by default
    const r = await runBacktest("当前引擎(Elo拉伸)", true);
    writeFileSync("backtest-wc.json", JSON.stringify({config:{stretch:true},summary:{bets:r.bets.length,won:r.won,pnl:r.pnl,theory:r.theory,ratio:r.ratio},bets:r.bets},null,2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
