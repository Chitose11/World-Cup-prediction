/**
 * V4.0 一站式回测：采集历史赛果 → 回测 → 报告
 * Usage: node scripts/fetch-and-backtest.js [fromDate] [toDate] [pageSize]
 * Example: node scripts/fetch-and-backtest.js 2026-04-01 2026-04-30 120
 */
import { writeFileSync } from "fs";
import { buildFullV32Model } from "../src/v4-engine.js";

const FROM = process.argv[2] || "2026-04-01";
const TO   = process.argv[3] || "2026-04-30";
const PAGE = Number(process.argv[4] || 120);

// ── Config ──────────────────────────────────────────────────
const KELLY_MULT = 0.25, MAX_PCT = 0.05, BANKROLL = 10000, MIN_EV = 0.05, MAX_ODDS = 15;

// ── Step 1: Fetch results ───────────────────────────────────
async function fetchResults(from, to, pageSize) {
  const url = new URL("https://webapi.sporttery.cn/gateway/uniform/football/getUniformMatchResultV1.qry");
  url.searchParams.set("matchBeginDate", from);
  url.searchParams.set("matchEndDate", to);
  url.searchParams.set("leagueId", "");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("isFix", "0");
  url.searchParams.set("matchPage", "1");
  url.searchParams.set("pcOrWap", "1");

  console.log(`Fetching results: ${from} ~ ${to} (pageSize=${pageSize})...`);
  const resp = await fetch(url, {
    headers: {
      accept: "application/json",
      origin: "https://www.sporttery.cn",
      referer: "https://www.sporttery.cn/jc/zqsgkj/",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  if (!data?.success && !data?.value) throw new Error("API response error");

  const matches = (data.value?.matchResultList || data.value?.list || []);
  console.log(`Got ${matches.length} matches with results`);
  return matches;
}

// ── Step 2: Fetch odds for each match ────────────────────────
async function fetchOdds(matchId) {
  const url = new URL("https://webapi.sporttery.cn/gateway/uniform/football/getMatchHeadV1.qry");
  url.searchParams.set("matchId", String(matchId));
  try {
    const resp = await fetch(url, {
      headers: {
        accept: "application/json",
        origin: "https://www.sporttery.cn",
        referer: "https://www.sporttery.cn/jc/zqsgkj/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.value || null;
  } catch (e) { return null; }
}

function extractOdds(oddsData) {
  if (!oddsData) return null;
  const pools = {};
  // had: 胜平负
  if (oddsData.hadList?.length) pools.had = oddsData.hadList.map(o => ({ key: mapHadKey(o.af) || "h", label: o.af || "", odds: Number(o.odds || 0) }));
  // hhad: 让球
  if (oddsData.hhadList?.length) pools.hhad = oddsData.hhadList.map(o => ({ key: mapHadKey(o.af) || "h", label: o.goalLine + o.af || "", odds: Number(o.odds || 0) }));
  // ttg: 总进球
  if (oddsData.ttgList?.length) pools.ttg = oddsData.ttgList.map((o, i) => ({ key: i >= 7 ? "s7" : `s${i}`, label: o.af || "", odds: Number(o.odds || 0) }));
  return pools;
}

function mapHadKey(af) {
  if (af === "胜" || af === "主胜") return "h";
  if (af === "平" || af === "平局") return "d";
  if (af === "负" || af === "客胜") return "a";
  return af;
}

function extractResult(raw) {
  const full = raw.fullScore || raw.wholeScore || "";
  const half = raw.halfScore || raw.halfCourtScore || "";
  const fullParts = String(full).split(":");
  const halfParts = String(half).split(":");
  const h = parseInt(fullParts[0]), a = parseInt(fullParts[1]);
  if (isNaN(h) || isNaN(a)) return null;
  return {
    full: { h, a },
    half: { h: parseInt(halfParts[0]) || 0, a: parseInt(halfParts[1]) || 0 },
  };
}

// ── Kelly ─────────────────────────────────────────────────────
function computeKelly(bankroll, prob, odds) {
  const ev = prob * odds - 1;
  if (ev <= 0 || odds <= 1) return 0;
  return Math.max(2, Math.round(bankroll * Math.min((ev / (odds - 1)) * KELLY_MULT, MAX_PCT) / 2) * 2);
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  // Step 1: Fetch results
  const rawMatches = await fetchResults(FROM, TO, PAGE);
  if (!rawMatches.length) { console.log("No matches found."); return; }

  // Step 2: Enrich with odds
  const enriched = [];
  for (let i = 0; i < rawMatches.length; i++) {
    const rm = rawMatches[i];
    const id = rm.matchId || rm.id || rm.matchNumStr || "";
    const result = extractResult(rm);
    if (!result) { console.log(`[${i+1}/${rawMatches.length}] No result — skip`); continue; }

    const oddsData = await fetchOdds(id);
    const pools = extractOdds(oddsData) || {};

    // Only include matches with at least HAD or HHAD odds
    if (!pools.had && !pools.hhad) {
      console.log(`[${i+1}/${rawMatches.length}] No odds pools — skip`);
      continue;
    }

    const match = {
      id: String(id),
      home: rm.homeTeam || rm.homeName || rm.home || "",
      away: rm.guestTeam || rm.awayName || rm.away || "",
      homeShort: (rm.homeTeam || rm.homeName || rm.home || "").slice(0, 2),
      awayShort: (rm.guestTeam || rm.awayName || rm.away || "").slice(0, 2),
      matchDate: rm.matchDate || rm.gameDate || "",
      matchTime: rm.matchTime || "",
      number: rm.matchNumStr || rm.issueNum || "",
      hhadGoalLine: Number(rm.hhadGoalLine || oddsData?.hhadGoalLine || 0),
      pools,
      result,
    };
    enriched.push(match);
    console.log(`[${i+1}/${rawMatches.length}] ${match.home} vs ${match.away} (${id}) — ${result.full.h}:${result.full.a}`);
  }
  console.log(`\nEnriched ${enriched.length}/${rawMatches.length} matches`);

  // Save raw data
  const rawFile = `backtest-raw-${FROM}.json`;
  writeFileSync(rawFile, JSON.stringify(enriched, null, 2));
  console.log(`Raw data saved: ${rawFile}`);

  // Step 3: Run backtest
  if (!enriched.length) { console.log("No valid matches for backtest."); return; }

  let bankroll = BANKROLL;
  const bets = [];
  let totalEV = 0;

  for (let i = 0; i < enriched.length; i++) {
    const m = enriched[i];
    let model;
    try {
      const r = buildFullV32Model({
        match: m, research: null,
        controls: { matchStage: "group", motivation: "neutral" },
        drawState: { matchesPlayed: i, draws: bets.filter(b => b.play === "had" && b.key === "d" && b.resolved && !b.won).length },
      });
      model = r.model;
    } catch (e) { continue; }
    if (!model?.byPlay) continue;

    // Find best HAD/HHAD/TTG pick
    let best = null, bestEV = -Infinity;
    for (const play of ["had","hhad","ttg"]) {
      const pool = m.pools[play] || [];
      const probs = model.byPlay[play] || {};
      for (const item of pool) {
        const prob = probs[item.key];
        if (!Number.isFinite(prob) || prob <= 0) continue;
        if (item.odds > MAX_ODDS) continue;
        const ev = prob * item.odds - 1;
        if (ev <= MIN_EV || ev <= bestEV) continue;
        best = { play, key: item.key, label: item.label || item.key, odds: item.odds, prob, ev };
        bestEV = ev;
      }
    }
    if (!best) {
      console.log(`[${i+1}/${enriched.length}] ${m.home} vs ${m.away} — no value`);
      continue;
    }

    const stake = computeKelly(bankroll, best.prob, best.odds);
    if (stake <= 0) continue;

    const bet = {
      home: m.homeShort || m.home, away: m.awayShort || m.away, date: m.matchDate,
      play: best.play, key: best.key, label: best.label,
      odds: best.odds, modelProb: best.prob, ev: best.ev,
      stake, positionPct: stake / bankroll,
      bankrollBefore: bankroll,
      hhadGoalLine: m.hhadGoalLine, result: m.result,
    };

    // Settle
    const r = m.result;
    let won = false;
    if (best.play === "had") {
      if (r.full.h > r.full.a && best.key === "h") won = true;
      else if (r.full.h === r.full.a && best.key === "d") won = true;
      else if (r.full.h < r.full.a && best.key === "a") won = true;
    } else if (best.play === "hhad") {
      const adj = r.full.h + (m.hhadGoalLine || 0) - r.full.a;
      if (adj > 0 && best.key === "h") won = true;
      else if (adj === 0 && best.key === "d") won = true;
      else if (adj < 0 && best.key === "a") won = true;
    } else if (best.play === "ttg") {
      const total = r.full.h + r.full.a;
      const bin = total >= 7 ? 7 : total;
      if (best.key === `s${bin}`) won = true;
    }

    const profit = won ? stake * best.odds - stake : -stake;
    bet.won = won;
    bet.profit = profit;
    bet.bankrollAfter = bankroll + profit;
    bet.resolved = true;
    bankroll = bet.bankrollAfter;
    bets.push(bet);
    totalEV += best.ev * stake;

    console.log(`[${i+1}/${enriched.length}] ${won ? "✅" : "❌"} ${bet.home} vs ${bet.away} | ${best.play}·${best.label} @${best.odds} | EV ${best.ev >= 0 ? "+" : ""}${(best.ev*100).toFixed(1)}% | ${(bet.positionPct*100).toFixed(1)}% ¥${bet.stake} | ${profit >= 0 ? "+" : ""}¥${Math.round(profit)} | 余额 ¥${Math.round(bankroll)}`);
  }

  // ── Report ─────────────────────────────────────────────────
  const resolved = bets.filter(b => b.resolved);
  const won = resolved.filter(b => b.won);
  const totalPnL = bankroll - BANKROLL;
  const theoreticalEV = resolved.reduce((s, b) => s + b.ev * b.stake, 0);

  console.log("\n" + "=".repeat(60));
  console.log("  V4.0 回测报告");
  console.log("=".repeat(60));
  console.log(`  日期范围: ${FROM} ~ ${TO}`);
  console.log(`  原始匹配: ${rawMatches.length} | 含赔率: ${enriched.length} | 投注: ${bets.length}`);
  console.log(`  初始资金: ¥${BANKROLL.toLocaleString()}`);
  console.log(`  最终资金: ¥${Math.round(bankroll).toLocaleString()}  (${((bankroll/BANKROLL-1)*100 >= 0 ? "+" : "")}${((bankroll/BANKROLL-1)*100).toFixed(2)}%)`);
  console.log(`  命中率:   ${won.length}/${resolved.length} (${(won.length/resolved.length*100).toFixed(1)}%)`);
  console.log(`  实际盈亏: ¥${Math.round(totalPnL).toLocaleString()}`);
  console.log(`  理论 EV:  ¥${Math.round(theoreticalEV).toLocaleString()}`);
  console.log(`  EV/实际比: ${theoreticalEV ? (totalPnL/theoreticalEV).toFixed(2) : "N/A"}x`);
  const verdict = theoreticalEV > 0 && totalPnL > 0 ? "✅ 方向正确" : theoreticalEV > 0 ? "🔴 EV正向但实际亏损" : theoreticalEV < 0 && totalPnL < 0 ? "⚠️ 双负" : "";
  console.log(`  判定:     ${verdict}`);
  console.log("-".repeat(60));

  const reportFile = `backtest-report-${FROM}.json`;
  writeFileSync(reportFile, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { from: FROM, to: TO, kelly: KELLY_MULT, maxPct: MAX_PCT, bankroll: BANKROLL },
    summary: {
      totalBets: bets.length, resolved: resolved.length, won: won.length,
      initialBankroll: BANKROLL, finalBankroll: bankroll, return: bankroll / BANKROLL - 1,
      totalPnL, theoreticalEV,
    },
    bets: bets.map(b => ({
      home: b.home, away: b.away, date: b.date,
      play: b.play, label: b.label, odds: b.odds,
      modelProb: b.modelProb, ev: b.ev,
      stake: b.stake, positionPct: b.positionPct,
      won: b.won, profit: b.profit,
      result: `${b.result.full.h}:${b.result.full.a}`,
    })),
  }, null, 2));
  console.log(`报告: ${reportFile}`);
}

main().catch(e => { console.error(e); process.exit(1); });
