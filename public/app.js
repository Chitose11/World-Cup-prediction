const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const STORAGE_KEY = "sporttery-v33-workbench-state";
const APP_VERSION = "0.5.0";
const PLAN_SELECTION_VERSION = "model-rules-v2";
const DEFAULT_SIMULATION = { predictions: [], history: [] };
const DEFAULT_DAY_PLAN = { date: "", budget: 300, plans: [], generatedAt: null, progress: "", selectionVersion: PLAN_SELECTION_VERSION };
const savedState = loadSavedState();

const state = {
  matches: savedState.matches || [],
  selectedId: savedState.selectedId || null,
  selectedPlay: "had",
  lastPayload: savedState.lastPayload || null,
  activeView: routeViewFromHash() || savedState.activeView || "workbench",
  researchExpanded: false,
  modelIoExpanded: false,
  researchByMatch: savedState.researchByMatch || {},
  autoByMatch: savedState.autoByMatch || {},
  fullModelByMatch: savedState.fullModelByMatch || {},
  simulation: savedState.simulation || { predictions: [], history: [] },
  dayPlan: savedState.dayPlan || { ...DEFAULT_DAY_PLAN },
};

let persistentStateReady = false;
let persistTimer = null;

const playLabels = {
  hafu: "半全场",
  had: "胜平负",
  hhad: "让球胜平负",
  crs: "比分",
  ttg: "总进球",
};

const profileWeights = {
  default: { n: 0.67, l: 0.23, c: 0.10 },
  "elite-finisher": { n: 0.62, l: 0.20, c: 0.18 },
  "defensive-favorite": { n: 0.60, l: 0.30, c: 0.10 },
  balanced: { n: 0.58, l: 0.27, c: 0.15 },
};

const els = {
  viewTabs: $("#viewTabs"),
  workbenchView: $("#workbenchView"),
  dayPlanView: $("#dayPlanView"),
  simulationView: $("#simulationView"),
  poolSelect: $("#poolSelect"),
  syncBtn: $("#syncBtn"),
  statusLine: $("#statusLine"),
  matchSearch: $("#matchSearch"),
  matchList: $("#matchList"),
  matchHero: $("#matchHero"),
  lambdaHome: $("#lambdaHome"),
  lambdaAway: $("#lambdaAway"),
  lambdaHomeValue: $("#lambdaHomeValue"),
  lambdaAwayValue: $("#lambdaAwayValue"),
  profileSelect: $("#profileSelect"),
  tempoSelect: $("#tempoSelect"),
  autoJudgeBox: $("#autoJudgeBox"),
  inPlayPanel: $("#inPlayPanel"),
  inPlayToggleBtn: $("#inPlayToggleBtn"),
  inPlayRefreshBtn: $("#inPlayRefreshBtn"),
  inPlayMinutes: $("#inPlayMinutes"),
  inPlayHomeGoals: $("#inPlayHomeGoals"),
  inPlayAwayGoals: $("#inPlayAwayGoals"),
  inPlayResult: $("#inPlayResult"),
  summaryStrip: $("#summaryStrip"),
  scannerCards: $("#scannerCards"),
  oddsTable: $("#scannerCards"),  // legacy alias → V4 scanner container
  decisionBox: $("#decisionBox"),
  researchBtn: $("#researchBtn"),
  researchToggleBtn: $("#researchToggleBtn"),
  researchBox: $("#researchBox"),
  budgetInput: $("#budgetInput"),
  recommendBtn: $("#recommendBtn"),
  recommendBox: $("#recommendBox"),
  pasteJson: $("#pasteJson"),
  parsePasteBtn: $("#parsePasteBtn"),
  dayPlanDateSelect: $("#dayPlanDateSelect"),
  dayPlanBudgetInput: $("#dayPlanBudgetInput"),
  dayPlanGenerateBtn: $("#dayPlanGenerateBtn"),
  dayPlanExportBtn: $("#dayPlanExportBtn"),
  dayPlanClearBtn: $("#dayPlanClearBtn"),
  dayPlanProgress: $("#dayPlanProgress"),
  dayPlanSummary: $("#dayPlanSummary"),
  dayPlanResults: $("#dayPlanResults"),
  simStakeInput: $("#simStakeInput"),
  simBankrollInput: $("#simBankrollInput"),
  simBalanceDisplay: $("#simBalanceDisplay"),
  simGenerateBtn: $("#simGenerateBtn"),
  simFetchResultsBtn: $("#simFetchResultsBtn"),
  simCLVBtn: $("#simCLVBtn"),
  simSettleBtn: $("#simSettleBtn"),
  simClearBtn: $("#simClearBtn"),
  simulationSummary: $("#simulationSummary"),
  simulationFuture: $("#simulationFuture"),
  simulationHistory: $("#simulationHistory"),
};

function loadSavedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function appStatePayload() {
  return {
    schema: "sporttery-v33-workbench-state",
    appVersion: APP_VERSION,
    activeView: state.activeView,
    selectedId: state.selectedId,
    selectedPlay: state.selectedPlay,
    matches: state.matches,
    lastPayload: state.lastPayload,
    researchByMatch: state.researchByMatch,
    autoByMatch: state.autoByMatch,
    fullModelByMatch: state.fullModelByMatch,
    simulation: state.simulation,
    dayPlan: state.dayPlan,
  };
}

function persistState(options = {}) {
  const payload = appStatePayload();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (!persistentStateReady) return Promise.resolve();
  return options.immediate ? saveStateNow(payload) : scheduleStateSave(payload);
}

function scheduleStateSave(payload = appStatePayload()) {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    saveStateNow(payload).catch(() => {});
  }, 250);
  return Promise.resolve();
}

async function saveStateNow(payload = appStatePayload()) {
  clearTimeout(persistTimer);
  const body = JSON.stringify({ state: payload });
  try {
    await fetch("/api/state", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: body.length < 60_000,
    });
  } catch {
    // localStorage keeps an in-browser fallback if the local file endpoint is unavailable.
  }
}

async function hydratePersistentState() {
  try {
    const response = await fetch("/api/state");
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "state load failed");
    if (payload.state && Object.keys(payload.state).length) {
      applyPersistentState(payload.state);
    }
  } catch {
    // localStorage remains the offline fallback.
  } finally {
    persistentStateReady = true;
  }
}

function applyPersistentState(payload = {}) {
  state.matches = Array.isArray(payload.matches) ? payload.matches : state.matches;
  state.lastPayload = payload.lastPayload || state.lastPayload;
  state.selectedId = payload.selectedId || state.selectedId || state.matches[0]?.id || null;
  state.selectedPlay = payload.selectedPlay || state.selectedPlay;
  state.activeView = routeViewFromHash() || payload.activeView || state.activeView;
  state.researchByMatch = payload.researchByMatch || state.researchByMatch || {};
  state.autoByMatch = payload.autoByMatch || state.autoByMatch || {};
  state.fullModelByMatch = payload.fullModelByMatch || state.fullModelByMatch || {};
  state.simulation = payload.simulation || state.simulation || { ...DEFAULT_SIMULATION };
  state.dayPlan = payload.dayPlan || state.dayPlan || { ...DEFAULT_DAY_PLAN };
}

function sendPersistBeacon() {
  if (!persistentStateReady || !navigator.sendBeacon) return;
  const body = JSON.stringify({ state: appStatePayload() });
  const blob = new Blob([body], { type: "application/json" });
  navigator.sendBeacon("/api/state", blob);
}

function fmtPct(value, digits = 1) {
  if (!Number.isFinite(value)) return "-";
  return `${(value * 100).toFixed(digits)}%`;
}

function fmtSignedPct(value) {
  if (!Number.isFinite(value)) return "-";
  return `${value > 0 ? "+" : ""}${(value * 100).toFixed(1)}%`;
}

function fmtMoney(value) {
  if (!Number.isFinite(value)) return "￥0";
  return `￥${Math.round(value).toLocaleString("zh-CN")}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, error = false) {
  if (!els.statusLine) return;  // DOM not ready
  try {
    els.statusLine.textContent = message;
    els.statusLine.classList.toggle("error", error);
  } catch (e) { /* non-fatal */ }
}

function routeViewFromHash() {
  const hash = window.location.hash.replace(/^#\/?/, "");
  if (hash === "simulation") return "simulation";
  if (hash === "dayplan") return "dayplan";
  if (hash === "workbench") return "workbench";
  return null;
}

function setActiveView(view, updateHash = true) {
  state.activeView = view;
  $$("#viewTabs button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  els.workbenchView.classList.toggle("active", view === "workbench");
  els.dayPlanView.classList.toggle("active", view === "dayplan");
  els.simulationView.classList.toggle("active", view === "simulation");
  if (updateHash) {
    const nextHash = view === "simulation" ? "#/simulation" : view === "dayplan" ? "#/dayplan" : "#/workbench";
    if (window.location.hash !== nextHash) window.location.hash = nextHash;
  }
  window.scrollTo({ top: 0, behavior: "auto" });
  persistState();
}

function setModelIoExpanded(expanded) {
  state.modelIoExpanded = expanded;
  if (els.modelIoPanel) els.modelIoPanel.hidden = !expanded;
}

function setResearchExpanded(expanded) {
  state.researchExpanded = expanded;
  document.querySelector(".research-section")?.classList.toggle("is-collapsed", !expanded);
  if (els.researchToggleBtn) {
    els.researchToggleBtn.textContent = expanded ? "收起" : "展开";
    els.researchToggleBtn.dataset.icon = expanded ? "▴" : "▾";
    els.researchToggleBtn.setAttribute("aria-expanded", String(expanded));
  }
}

function selectedMatch() {
  return state.matches.find((match) => match.id === state.selectedId) || null;
}

function selectedResearch() {
  const match = selectedMatch();
  return match ? state.researchByMatch[match.id] || null : null;
}

function selectedAutoJudge() {
  const match = selectedMatch();
  return match ? state.autoByMatch[match.id] || null : null;
}

function poisson(lambda, k) {
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial;
}

function tempoFactor() {
  if (els.tempoSelect.value === "slow") return 0.9;
  if (els.tempoSelect.value === "open") return 1.08;
  return 1;
}

function baseLambdas() {
  const factor = tempoFactor();
  return {
    home: Number(els.lambdaHome.value) * factor,
    away: Number(els.lambdaAway.value) * factor,
  };
}

function buildStateScore(homeLambda, awayLambda, weight, type) {
  const favorite = homeLambda >= awayLambda ? "home" : "away";
  let hLambda = homeLambda;
  let aLambda = awayLambda;

  if (type === "low-block") {
    hLambda *= 0.82;
    aLambda *= 0.82;
  }

  if (type === "collapse") {
    if (favorite === "home") {
      hLambda *= 1.35;
      aLambda *= 0.90;
    } else {
      hLambda *= 0.90;
      aLambda *= 1.35;
    }
  }

  return { hLambda, aLambda, weight };
}

function buildScoreMatrix() {
  const { home, away } = baseLambdas();
  const weights = profileWeights[els.profileSelect.value] || profileWeights.default;
  const states = [
    buildStateScore(home, away, weights.n, "normal"),
    buildStateScore(home, away, weights.l, "low-block"),
    buildStateScore(home, away, weights.c, "collapse"),
  ];
  const maxScore = 8;
  const scores = [];
  let total = 0;

  for (let h = 0; h <= maxScore; h += 1) {
    for (let a = 0; a <= maxScore; a += 1) {
      const prob = states.reduce((sum, item) => (
        sum + item.weight * poisson(item.hLambda, h) * poisson(item.aLambda, a)
      ), 0);
      scores.push({ h, a, prob });
      total += prob;
    }
  }

  for (const score of scores) score.prob /= total || 1;
  return scores;
}

function sumStates(scores) {
  return scores.reduce(
    (acc, score) => {
      if (score.h > score.a) acc.h += score.prob;
      else if (score.h === score.a) acc.d += score.prob;
      else acc.a += score.prob;
      return acc;
    },
    { h: 0, d: 0, a: 0 },
  );
}

function exactScoreKey(h, a) {
  return `s${String(h).padStart(2, "0")}s${String(a).padStart(2, "0")}`;
}

function isListedScore(h, a) {
  const homeWins = h >= 1 && h <= 5 && a >= 0 && a <= 2 && h > a;
  const draws = h === a && h >= 0 && h <= 3;
  const awayWins = a >= 1 && a <= 5 && h >= 0 && h <= 2 && h < a;
  return homeWins || draws || awayWins;
}

function stateKey(home, away) {
  if (home > away) return "h";
  if (home === away) return "d";
  return "a";
}

function buildHafuProbabilities() {
  const { home, away } = baseLambdas();
  const weights = profileWeights[els.profileSelect.value] || profileWeights.default;
  const states3 = [
    buildStateScore(home, away, weights.n, "normal"),
    buildStateScore(home, away, weights.l, "low-block"),
    buildStateScore(home, away, weights.c, "collapse"),
  ];
  const result = { hh: 0, hd: 0, ha: 0, dh: 0, dd: 0, da: 0, ah: 0, ad: 0, aa: 0 };
  const max = 6;
  let total = 0;

  for (const s of states3) {
    const htHome = s.hLambda * 0.45;
    const htAway = s.aLambda * 0.45;
    const shHome = s.hLambda * 0.55;
    const shAway = s.aLambda * 0.55;
    for (let hh = 0; hh <= max; hh += 1) {
      for (let ha = 0; ha <= max; ha += 1) {
        const htProb = poisson(htHome, hh) * poisson(htAway, ha);
        const htState = stateKey(hh, ha);
        for (let shh = 0; shh <= max; shh += 1) {
          for (let sha = 0; sha <= max; sha += 1) {
            const prob = s.weight * htProb * poisson(shHome, shh) * poisson(shAway, sha);
            const finalState = stateKey(hh + shh, ha + sha);
            result[`${htState}${finalState}`] += prob;
            total += prob;
          }
        }
      }
    }
  }

  for (const key of Object.keys(result)) result[key] /= total || 1;
  return result;
}

function modelProbabilities(match) {
  const full = state.fullModelByMatch[match?.id];
  if (full?.model) return full.model;
  const scores = buildScoreMatrix();
  const states = sumStates(scores);
  const byPlay = {
    had: { h: states.h, d: states.d, a: states.a },
    hhad: {},
    crs: { s1sh: 0, s1sd: 0, s1sa: 0 },
    ttg: { s7: 0 },
    hafu: buildHafuProbabilities(),
  };

  const handicap = Number(match?.hhadGoalLine || 0);
  for (const score of scores) {
    const adjusted = score.h + handicap - score.a;
    if (adjusted > 0) byPlay.hhad.h = (byPlay.hhad.h || 0) + score.prob;
    else if (adjusted === 0) byPlay.hhad.d = (byPlay.hhad.d || 0) + score.prob;
    else byPlay.hhad.a = (byPlay.hhad.a || 0) + score.prob;

    const totalGoals = score.h + score.a;
    const ttgKey = totalGoals >= 7 ? "s7" : `s${totalGoals}`;
    byPlay.ttg[ttgKey] = (byPlay.ttg[ttgKey] || 0) + score.prob;

    const crsKey = exactScoreKey(score.h, score.a);
    if (isListedScore(score.h, score.a)) {
      byPlay.crs[crsKey] = (byPlay.crs[crsKey] || 0) + score.prob;
    } else if (score.h > score.a) {
      byPlay.crs.s1sh += score.prob;
    } else if (score.h === score.a) {
      byPlay.crs.s1sd += score.prob;
    } else {
      byPlay.crs.s1sa += score.prob;
    }
  }

  return { scores, states, byPlay };
}

function impliedMap(items = []) {
  const inverses = items.map((item) => ({ key: item.key, prob: 1 / item.odds }));
  const total = inverses.reduce((sum, item) => sum + item.prob, 0);
  return Object.fromEntries(inverses.map((item) => [item.key, item.prob / (total || 1)]));
}

function marketFullTimeProbabilities(match) {
  const hafu = impliedMap(match?.pools?.hafu || []);
  const had = impliedMap(match?.pools?.had || []);
  if (Object.keys(hafu).length) {
    return {
      h: (hafu.hh || 0) + (hafu.dh || 0) + (hafu.ah || 0),
      d: (hafu.hd || 0) + (hafu.dd || 0) + (hafu.ad || 0),
      a: (hafu.ha || 0) + (hafu.da || 0) + (hafu.aa || 0),
    };
  }
  return {
    h: had.h || 0.42,
    d: had.d || 0.27,
    a: had.a || 0.31,
  };
}

function estimateLambdasFromMarket(match) {
  if (!match) return;
  const ft = marketFullTimeProbabilities(match);
  const home = ft.h || 0.42;
  const draw = ft.d || 0.27;
  const away = ft.a || 0.31;
  const diff = home - away;
  let lambdaHome = 1.28 + diff * 1.45 - draw * 0.22;
  let lambdaAway = 1.08 - diff * 1.25 - draw * 0.18;

  if (home > 0.72) {
    lambdaHome = 2.05;
    lambdaAway = 0.55;
    els.profileSelect.value = "defensive-favorite";
  } else if (home > 0.60) {
    lambdaHome = 1.65;
    lambdaAway = 0.8;
    els.profileSelect.value = "default";
  } else if (home > 0.48) {
    lambdaHome = 1.35;
    lambdaAway = 1.05;
    els.profileSelect.value = "balanced";
  } else if (away > 0.60) {
    lambdaHome = 0.8;
    lambdaAway = 1.65;
    els.profileSelect.value = "default";
  } else if (away > 0.48) {
    lambdaHome = 1.05;
    lambdaAway = 1.35;
    els.profileSelect.value = "balanced";
  } else {
    els.profileSelect.value = "balanced";
  }

  els.lambdaHome.value = clamp(lambdaHome, 0.2, 3.4).toFixed(2);
  els.lambdaAway.value = clamp(lambdaAway, 0.2, 3.4).toFixed(2);
  updateSliderLabels();
}

function researchText(research) {
  if (!research) return "";
  return (research.categories || []).map((category) => [
    category.answer,
    ...(category.results || []).flatMap((item) => [item.title, item.snippet, item.url]),
  ].filter(Boolean).join(" ")).join(" ").toLowerCase();
}

function hasAny(text, words) {
  return words.some((word) => text.includes(word));
}

const v33SFinishers = new Set(["france", "argentina", "germany", "norway"]);
const v33HighDepthFavorites = new Set(["england"]);
const v33UnstableFavorites = new Set(["portugal", "spain", "belgium", "uruguay"]);
const v33PhysicalResistance = new Set(["dr congo", "congo dr", "senegal", "morocco", "egypt", "ivory coast", "panama"]);
const v33AgingDefense = new Set(["croatia"]);

function normalizeTeamName(name) {
  const text = String(name || "").toLowerCase();
  if (/葡萄牙|portugal/.test(text)) return "portugal";
  if (/刚果|剛果|dr congo|congo dr|drc/.test(text)) return "dr congo";
  if (/英格兰|英格蘭|england/.test(text)) return "england";
  if (/克罗地亚|克羅地亞|croatia/.test(text)) return "croatia";
  if (/西班牙|spain/.test(text)) return "spain";
  if (/比利时|比利時|belgium/.test(text)) return "belgium";
  if (/乌拉圭|uruguay/.test(text)) return "uruguay";
  if (/塞内加尔|塞內加爾|senegal/.test(text)) return "senegal";
  if (/摩洛哥|morocco/.test(text)) return "morocco";
  if (/埃及|egypt/.test(text)) return "egypt";
  if (/科特迪瓦|ivory coast|cote d/.test(text)) return "ivory coast";
  if (/巴拿马|巴拿馬|panama/.test(text)) return "panama";
  return text.trim();
}

function v33Class(key) {
  if (v33SFinishers.has(key)) return "S级终结型";
  if (v33HighDepthFavorites.has(key)) return "A级高深度型";
  if (v33UnstableFavorites.has(key)) return "A-破低位不稳";
  if (v33PhysicalResistance.has(key)) return "身体抗压型";
  if (v33AgingDefense.has(key)) return "老化防线";
  return "常规模型";
}

function inferV33Factors(match, homeFav, text) {
  const homeKey = normalizeTeamName(match.home || match.homeShort || "");
  const awayKey = normalizeTeamName(match.away || match.awayShort || "");
  const favoriteKey = homeFav ? homeKey : awayKey;
  const underdogKey = homeFav ? awayKey : homeKey;
  const physicalOpponent = v33PhysicalResistance.has(underdogKey);
  const agingOpponent = v33AgingDefense.has(underdogKey);
  const lowBlockClues = [
    v33UnstableFavorites.has(favoriteKey),
    physicalOpponent,
    hasAny(text, ["low block", "deep block", "compact", "低位", "密集"]),
    hasAny(text, ["ronaldo", "cross", "set piece", "corner", "传中", "定位球"]),
    hasAny(text, ["counterattack", "counter", "pace", "transition", "反击", "速度", "转换"]),
    hasAny(text, ["few touches", "poor finishing", "shots on target", "射正", "终结不稳"]),
  ].filter(Boolean).length;
  const surgeClues = [
    v33HighDepthFavorites.has(favoriteKey),
    agingOpponent,
    hasAny(text, ["bench", "substitute", "depth", "替补", "深度"]),
    hasAny(text, ["coach", "adjustment", "tuchel", "second half", "下半场", "临场", "调整"]),
    hasAny(text, ["set piece", "corner", "free kick", "定位球", "角球"]),
    hasAny(text, ["multiple scorers", "wing", "wide attack", "多点", "边路"]),
  ].filter(Boolean).length;
  return {
    favoriteKey,
    underdogKey,
    favoriteClass: v33Class(favoriteKey),
    underdogClass: v33Class(underdogKey),
    unstableFavorite: v33UnstableFavorites.has(favoriteKey),
    highDepthFavorite: v33HighDepthFavorites.has(favoriteKey),
    lowBlockConversionPenalty: physicalOpponent && lowBlockClues >= 2,
    secondHalfSurgeFactor: v33HighDepthFavorites.has(favoriteKey) && surgeClues >= 2,
  };
}

function inferAutoSettings(match, research) {
  const ft = marketFullTimeProbabilities(match);
  const homeFav = ft.h >= ft.a;
  const favProb = Math.max(ft.h, ft.a);
  const drawProb = ft.d || 0.27;
  const text = researchText(research);
  const v33 = inferV33Factors(match, homeFav, text);
  const reasons = [];

  let lambdaHome = Number(els.lambdaHome.value);
  let lambdaAway = Number(els.lambdaAway.value);
  let profile = els.profileSelect.value;
  let tempo = "normal";

  if (favProb > 0.72) {
    lambdaHome = homeFav ? 2.3 : 0.45;
    lambdaAway = homeFav ? 0.45 : 2.3;
    profile = "defensive-favorite";
    reasons.push("赔率显示明显强弱差，按 V3.2 clear/huge mismatch 档位重估 λ。");
  } else if (favProb > 0.6) {
    lambdaHome = homeFav ? 1.85 : 0.65;
    lambdaAway = homeFav ? 0.65 : 1.85;
    profile = "default";
    reasons.push("赔率显示热门优势，按 V3.2 favorite advantage 档位重估 λ。");
  } else if (favProb > 0.5 || drawProb > 0.28) {
    lambdaHome = homeFav ? 1.3 : 1.0;
    lambdaAway = homeFav ? 1.0 : 1.3;
    profile = "balanced";
    reasons.push("赔率分布接近中档热门或小优势，降低单边判断强度。");
  }

  if (hasAny(text, ["low block", "deep block", "defensive", "5-4-1", "4-5-1", "compact", "防守", "低位", "密集"])) {
    profile = "defensive-favorite";
    if (homeFav) lambdaHome *= 0.95;
    else lambdaAway *= 0.95;
    reasons.push("情报出现低位/密集防守信号，切换为热门破低位画像。");
  }

  if (hasAny(text, ["ronaldo", "bruno fernandes", "mbappe", "kane", "messi", "elite", "finisher", "attacking", "attack", "进攻", "终结"])) {
    if (favProb > 0.55) {
      profile = "elite-finisher";
      if (homeFav) lambdaHome *= 1.06;
      else lambdaAway *= 1.06;
      reasons.push("情报/阵容出现强终结点或进攻核心，提升 collapse 尾部。");
    }
  }

  if (hasAny(text, ["injury", "injuries", "suspended", "suspension", "doubtful", "unavailable", "out injured", "缺阵", "伤停", "停赛"])) {
    if (homeFav) lambdaHome *= 0.96;
    else lambdaAway *= 0.96;
    reasons.push("情报包含伤停/停赛词，热门进攻 λ 小幅保守。");
  }

  if (hasAny(text, ["rotation", "rotate", "rest", "rotated", "轮换", "休息"])) {
    if (homeFav) lambdaHome *= 0.94;
    else lambdaAway *= 0.94;
    reasons.push("情报出现轮换/休息信号，降低热门确定性。");
  }

  if (hasAny(text, ["heat", "humid", "humidity", "hydration", "altitude", "travel", "fatigue", "hot", "高温", "湿度", "海拔", "旅行", "疲劳"])) {
    tempo = "slow";
    lambdaHome *= 0.94;
    lambdaAway *= 0.94;
    reasons.push("情报出现高温/湿度/海拔/旅行疲劳，自动降为慢节奏。");
  }

  if (hasAny(text, ["open game", "counterattack", "transition", "high press", "pressing", "pace", "end-to-end", "对攻", "反击", "高压", "转换"])) {
    tempo = "open";
    lambdaHome *= 1.05;
    lambdaAway *= 1.05;
    reasons.push("情报出现转换/高压/对攻信号，自动升为开放节奏。");
  }

  if (v33.unstableFavorite) {
    profile = "defensive-favorite";
    if (homeFav) {
      lambdaHome *= 0.96;
      lambdaAway *= 1.02;
    } else {
      lambdaAway *= 0.96;
      lambdaHome *= 1.02;
    }
    reasons.push(`V3.3：热门归类为${v33.favoriteClass}，胜率降档并加强防平。`);
  }

  if (v33.lowBlockConversionPenalty) {
    profile = "defensive-favorite";
    tempo = tempo === "open" ? "normal" : tempo;
    if (homeFav) {
      lambdaHome *= 0.92;
      lambdaAway *= 1.08;
    } else {
      lambdaAway *= 0.92;
      lambdaHome *= 1.08;
    }
    reasons.push("V3.3：触发低位兑现惩罚，平局/受让和弱队进球上调。");
  }

  if (v33.secondHalfSurgeFactor) {
    profile = "elite-finisher";
    tempo = "open";
    if (homeFav) {
      lambdaHome *= 1.08;
      lambdaAway *= 1.03;
    } else {
      lambdaAway *= 1.08;
      lambdaHome *= 1.03;
    }
    reasons.push("V3.3：触发下半场增压因子，平胜/胜胜、让胜和3+进球尾部上调。");
  }

  if (!reasons.length) {
    reasons.push("未抓到强情境修正词，保留赔率去水后的基础自动判断。");
  }

  const confidence = (research?.coverage?.signalCount || 0) >= 3 ? "高" : (research?.coverage?.categoryHits || 0) >= 3 ? "中" : "低";
  return {
    lambdaHome: clamp(lambdaHome, 0.2, 3.4),
    lambdaAway: clamp(lambdaAway, 0.2, 3.4),
    profile,
    tempo,
    confidence,
    v33,
    reasons: reasons.slice(0, 5),
    updatedAt: new Date().toISOString(),
  };
}

function applyAutoSettings(auto) {
  if (!auto) return;
  els.lambdaHome.value = auto.lambdaHome.toFixed(2);
  els.lambdaAway.value = auto.lambdaAway.toFixed(2);
  els.profileSelect.value = auto.profile;
  els.tempoSelect.value = auto.tempo;
  updateSliderLabels();
}

function updateSliderLabels() {
  els.lambdaHomeValue.textContent = Number(els.lambdaHome.value).toFixed(2);
  els.lambdaAwayValue.textContent = Number(els.lambdaAway.value).toFixed(2);
}

function researchPenalty() {
  const research = selectedResearch();
  return researchPenaltyFromResearch(research);
}
function researchPenaltyForMatch(match) {
  const research = match ? (state.researchByMatch[match.id] || null) : null;
  return researchPenaltyFromResearch(research);
}
function researchPenaltyFromResearch(research) {
  if (!research) return 1;
  const label = research.coverage?.label;
  if (label === "完整" || label === "较完整") return 0;
  if (label === "可参考") return 0.5;
  return 1;
}

function renderMatches() {
  const q = els.matchSearch.value.trim().toLowerCase();
  const matches = state.matches.filter((match) => {
    const haystack = `${match.number} ${match.league} ${match.home} ${match.away} ${match.homeShort} ${match.awayShort}`.toLowerCase();
    return !q || haystack.includes(q);
  });

  els.matchList.innerHTML = matches.length
    ? matches.map((match) => `
        <button class="match-card ${match.id === state.selectedId ? "active" : ""}" data-match-id="${match.id}">
          <div class="match-meta">
            <span>${escapeHtml(match.number || "-")}</span>
            <span>${escapeHtml(match.league || "-")}</span>
          </div>
          <div class="match-teams">
            <span>${escapeHtml(match.homeShort || match.home)}</span>
            <span>${escapeHtml(match.awayShort || match.away)}</span>
          </div>
        </button>
      `).join("")
    : `<div class="empty-state">没有匹配的比赛。</div>`;

  $$(".match-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedId = button.dataset.matchId;
      _scannerCache.delete(button.dataset.matchId);  // stale cache for new selection
      const match = selectedMatch();
      estimateLambdasFromMarket(match);
      applyAutoSettings(state.autoByMatch[match?.id]);
      renderAll();
    });
  });
}

function renderHero(match) {
  if (!match) {
    els.matchHero.innerHTML = `<div class="empty-state">同步后选择一场比赛开始计算。</div>`;
    return;
  }
  els.matchHero.innerHTML = `
    <div class="hero-grid">
      <div class="team">
        <div class="team-name">${escapeHtml(match.home)}</div>
        <div class="team-sub">主队 ${match.homeRank ? `排名 ${escapeHtml(match.homeRank)}` : ""}</div>
      </div>
      <div class="vs">VS</div>
      <div class="team away">
        <div class="team-name">${escapeHtml(match.away)}</div>
        <div class="team-sub">客队 ${match.awayRank ? `排名 ${escapeHtml(match.awayRank)}` : ""}</div>
      </div>
    </div>
  `;
}

function renderSummary(match, model) {
  if (!match) {
    els.summaryStrip.innerHTML = "";
    return;
  }
  const topScores = model.scores
    .slice()
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 3)
    .map((score) => `${score.h}:${score.a} ${fmtPct(score.prob)}`)
    .join(" / ");
  const best = Object.entries(model.states).sort((a, b) => b[1] - a[1])[0];
  const bestLabel = { h: "主胜", d: "平局", a: "客胜" }[best[0]];
  const research = selectedResearch();
  els.summaryStrip.innerHTML = `
    <div class="metric"><div class="metric-label">主胜 / 平 / 客胜</div><div class="metric-value">${fmtPct(model.states.h)} / ${fmtPct(model.states.d)} / ${fmtPct(model.states.a)}</div></div>
    <div class="metric"><div class="metric-label">最高方向</div><div class="metric-value">${bestLabel} ${fmtPct(best[1])}</div></div>
    <div class="metric"><div class="metric-label">Top3 比分</div><div class="metric-value">${topScores}</div></div>
    <div class="metric"><div class="metric-label">动态数据</div><div class="metric-value">${research ? research.coverage.label : "未搜索"}</div></div>
  `;
}

function renderAutoJudge(match) {
  if (!els.autoJudgeBox) return;
  const auto = selectedAutoJudge();
  const research = selectedResearch();
  if (!match) {
    els.autoJudgeBox.innerHTML = "联网搜索后自动判断期望进球、比赛画像和环境节奏。";
    return;
  }
  if (!research) {
    els.autoJudgeBox.innerHTML = `
      <div class="auto-title">自动判断：等待联网情报</div>
      <div class="auto-meta">当前控件来自赔率去水初估；点击右侧"搜索首发/动机"后会自动重判。</div>
    `;
    return;
  }
  if (!auto) {
    els.autoJudgeBox.innerHTML = `
      <div class="auto-title">自动判断：未生成</div>
      <div class="auto-meta">已获取情报，但尚未应用自动参数。</div>
    `;
    return;
  }
  const profileName = {
    default: "默认三状态",
    "elite-finisher": "终结/增压型强队",
    "defensive-favorite": "热门破低位/防平",
    balanced: "互有机会 / 中档热门",
  }[auto.profile] || auto.profile;
  const tempoName = {
    normal: "正常",
    slow: "高温/海拔/旅途降速",
    open: "开放对攻",
  }[auto.tempo] || auto.tempo;
  els.autoJudgeBox.innerHTML = `
    <div class="auto-title">自动判断：${profileName} · ${tempoName} · 置信度${auto.confidence}</div>
    <div class="auto-meta">λ 主 ${auto.lambdaHome.toFixed(2)} / 客 ${auto.lambdaAway.toFixed(2)}，由赔率去水 + ${sourceLabel(research.source)} 情报自动设置。</div>
    <div class="auto-reasons">${auto.reasons.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
  `;
}

function rowsForPlay(match, model, play = state.selectedPlay) {
  const items = match?.pools?.[play] || [];
  const implied = impliedMap(items);
  return items
    .map((item) => {
      const modelProb = model.byPlay[play]?.[item.key];
      const edge = Number.isFinite(modelProb) ? modelProb - implied[item.key] : null;
      const ev = Number.isFinite(modelProb) && Number.isFinite(item.odds) ? (modelProb * item.odds) - 1 : null;
      const kellyFraction = Number.isFinite(ev) && Number(item.odds) > 1
        ? Math.max(0, ev / (Number(item.odds) - 1))
        : 0;
      return {
        ...item,
        play,
        impliedProb: implied[item.key],
        modelProb,
        edge,
        ev,
        kellyFraction,
        risk: riskLabel(play, modelProb, edge, match),
        singleOnly: match?.rawResult?.bettingSingle === 1,
      };
    })
    .sort((a, b) => (b.ev ?? -1) - (a.ev ?? -1));
}

function playReliability(play, mode) {
  const conservative = { had: 1, hhad: 0.92, ttg: 0.76, hafu: 0.58, crs: 0.36 };
  const aggressive = { had: 0.72, hhad: 0.78, ttg: 0.9, hafu: 0.95, crs: 1 };
  return (mode === "aggressive" ? aggressive : conservative)[play] || 0.5;
}

function sideName(side) {
  return { h: "主胜", d: "平局", a: "客胜" }[side] || side;
}

function finalSideFromHafu(key) {
  return String(key || "").slice(-1);
}

function topEntries(map = {}, limit = 3) {
  return Object.entries(map)
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key, value]) => ({ key, value }));
}

function modelPlanContext(match, model) {
  const states = model?.states || {};
  const homeProb = Number(states.h) || 0;
  const drawProb = Number(states.d) || 0;
  const awayProb = Number(states.a) || 0;
  const favoriteSide = homeProb >= awayProb ? "h" : "a";
  const underdogSide = favoriteSide === "h" ? "a" : "h";
  const favoriteProb = Math.max(homeProb, awayProb);
  const underdogProb = favoriteSide === "h" ? awayProb : homeProb;
  const wdlGap = Math.abs(homeProb - awayProb);
  const signals = model?.meta?.layers?.signals || {};
  const gradeText = String(model?.meta?.grade?.grade || model?.meta?.grade || "");
  const handicap = Number(match?.hhadGoalLine || 0);
  const hhad = model?.byPlay?.hhad || {};
  const favoriteCoverProb = Number(hhad[favoriteSide]) || 0;
  const underdogCoverProb = Number(hhad[underdogSide]) || 0;
  const handicapDrawProb = Number(hhad.d) || 0;
  const totalTop = topEntries(model?.byPlay?.ttg || {}, 2);
  const topScores = (model?.scores || [])
    .filter((score) => Number.isFinite(score?.prob))
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 3)
    .map((score) => ({ label: `${score.h}:${score.a}`, prob: score.prob }));
  const lowBlockPenalty = Boolean(signals.lowBlockConversionPenalty || signals.unstableFavorite || model?.meta?.profile === "defensive-favorite");
  const secondHalfSurge = Boolean(signals.secondHalfSurgeFactor);
  const dangerZone = Boolean(signals.dangerZone || model?.meta?.layers?.correction?.dangerZone);
  // P-fix: drawPressure uses RELATIVE excess over Bayesian-adjusted baseline
  // The Bayesian posterior inflates ALL draws globally.  drawPressure should only
  // trigger when THIS match has significantly more draw risk than the tournament norm.
  const drawBase = model?.meta?.layers?.correction?.drawBase || 0.27;
  const drawExcess = Math.max(0, drawProb - drawBase - 0.04); // excess beyond tournament baseline + buffer
  const favStr = Math.max(favoriteProb, underdogProb);
  const gapThresh = favStr > 0.60 ? 0.20 : favStr > 0.50 ? 0.16 : 0.12;
  const v33DrawRisk = signals.lowBlockPenaltyScore > 0.15;
  const drawPressure = drawExcess > 0.06 || (favoriteProb - drawProb < gapThresh) || v33DrawRisk;
  const closeMatch = wdlGap < 0.12 || gradeText.includes("D");
  const smallWinProfile = lowBlockPenalty || drawPressure || handicapDrawProb >= 0.18;
  const favoriteCoverProfile = favoriteProb >= 0.68 && drawProb <= 0.25 && favoriteCoverProb >= 0.45 && !lowBlockPenalty;
  const deepHandicap = favoriteSide === "h" ? handicap <= -2 : handicap >= 2;
  const market = model?.meta?.layers?.market || marketFullTimeProbabilities(match);
  const marketFavoriteSide = (market.h || 0) >= (market.a || 0) ? "h" : "a";
  return {
    states,
    favoriteSide,
    underdogSide,
    favoriteProb,
    underdogProb,
    drawProb,
    wdlGap,
    gradeText,
    handicap,
    favoriteCoverProb,
    underdogCoverProb,
    handicapDrawProb,
    totalTop,
    topScores,
    lowBlockPenalty,
    secondHalfSurge,
    dangerZone,
    drawPressure,
    closeMatch,
    smallWinProfile,
    favoriteCoverProfile,
    deepHandicap,
    marketFavoriteSide,
    marketDisagreement: marketFavoriteSide !== favoriteSide,
    dataCompleteness: model?.meta?.layers?.correction?.dataCompleteness || "",
    // r6 signals
    midTierPair: Boolean(signals.interactionMidTierPair),
    circuitBreaker: Boolean(model?.meta?.r6CircuitBreaker?.fired),
    strengthModifier: signals.interactionStrengthModifier || 1,
  };
}

function minCandidateProb(row, mode) {
  const conservative = { had: 0.30, hhad: 0.44, ttg: 0.17, hafu: 0.13, crs: 0.045 };
  const aggressive = { had: 0.20, hhad: 0.28, ttg: 0.09, hafu: 0.06, crs: 0.020 };
  return (mode === "aggressive" ? aggressive : conservative)[row.play] || 0.2;
}

function pushUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function scorePlanCandidate(row, context, mode, options = {}) {
  const prob = Number(row.modelProb);
  const odds = Number(row.odds);
  const tags = [];
  const SEL = { MIN_EV: 0.025, MAX_ODDS: 8, DIV_CAP: 1.5, KELLY_MULT: 0.25, MIN_KELLY: 0.002 };

  // 1. Hard pass
  if (!Number.isFinite(prob) || !Number.isFinite(odds)) {
    return { ...row, rejected: true, rejectReason: "缺失概率或赔率" };
  }

  // 2. Layer 1A: High-variance tail circuit break
  if (odds > SEL.MAX_ODDS) {
    return { ...row, rejected: true, rejectReason: `赔率${odds.toFixed(1)}>${SEL.MAX_ODDS}x，尾端方差熔断` };
  }

  // 3. Layer 0: Vig deduction — true implied prob
  const trueImplied = row.trueImplied || (1 / odds);
  const ev = (prob * odds) - 1;
  if (ev <= SEL.MIN_EV) {
    return { ...row, rejected: true, rejectReason: `EV ${(ev*100).toFixed(2)}% < ${(SEL.MIN_EV*100).toFixed(1)}%` };
  }

  // 4. Layer 1B: Global divergence fuse (Bug-fix: removed <0.10 dead code)
  const divergenceRatio = trueImplied > 0 ? prob / trueImplied : 999;
  if (divergenceRatio > SEL.DIV_CAP) {
    return { ...row, rejected: true, rejectReason: `偏离熔断: 模型${(prob*100).toFixed(1)}% vs 市场${(trueImplied*100).toFixed(1)}% (${divergenceRatio.toFixed(1)}x)` };
  }

  // 5. Circuit breaker guards
  if (context.circuitBreaker && ["crs", "hafu"].includes(row.play)) {
    return { ...row, rejected: true, rejectReason: "系统熔断: 拒绝高方差玩法" };
  }

  // 6. Layer 2: Fractional Kelly
  const fullKelly = odds > 1 ? Math.max(0, ev / (odds - 1)) : 0;
  const kellyScale = mode === "aggressive" ? 0.60 : SEL.KELLY_MULT;
  const finalKelly = fullKelly * kellyScale;
  if (finalKelly < SEL.MIN_KELLY) {
    return { ...row, rejected: true, rejectReason: `Kelly ${finalKelly.toFixed(4)} < ${SEL.MIN_KELLY}` };
  }

  // 7. Tags
  if (context.circuitBreaker) pushUnique(tags, "熔断保护");
  if (divergenceRatio > 2.0) pushUnique(tags, "盘口分歧");

  // 8. Score = Kelly fraction
  const v4Score = finalKelly * 100;
  const confidence = finalKelly >= 0.04 ? "A" : finalKelly >= 0.02 ? "B" : finalKelly >= 0.008 ? "C" : "D";

  return {
    ...row,
    ev, kellyFraction: finalKelly, rawKellyFraction: fullKelly,
    trueImplied, divergenceRatio,
    playMultiplier: 1, combinedMultiplier: 1,
    score: v4Score, confidence,
    selectionTags: tags.slice(0, 5),
    selectionReason: `EV ${(ev*100).toFixed(1)}%(去水) | Kelly ${(finalKelly*100).toFixed(2)}% | V2量化风控`,
    selectionVersion: "selector-v2",
  };
}

function rankedModelCandidates(match, model, mode, options = {}) {
  const context = modelPlanContext(match, model);
  const plays = options.plays || (mode === "aggressive" ? ["had", "hhad", "ttg", "hafu", "crs"] : ["had", "hhad", "ttg"]);
  const evaluated = plays
    .flatMap((play) => rowsForPlay(match, model, play))
    .map((row) => scorePlanCandidate(row, context, mode, options))
    .filter((row) => !row.rejected)
    .sort((a, b) => b.score - a.score);
  if (evaluated.length) return evaluated;

  return plays
    .flatMap((play) => rowsForPlay(match, model, play))
    .filter((row) => Number.isFinite(row.modelProb) && Number.isFinite(row.odds))
    .map((row) => ({
      ...row,
      score: (row.modelProb || 0) * playReliability(row.play, mode),
      confidence: "D",
      selectionTags: ["兜底"],
      selectionReason: "没有候选通过硬门槛，按模型概率做兜底展示。",
      selectionVersion: PLAN_SELECTION_VERSION,
    }))
    .sort((a, b) => b.score - a.score);
}

function bestPickForPlay(match, model, play, mode) {
  return rankedModelCandidates(match, model, mode, { plays: [play], preferPlay: play })[0] || null;
}

function attachDayPickMeta(match, pick, extra = {}) {
  return {
    ...pick,
    ...extra,
    matchId: match.id,
    matchNumber: match.number || "",
    league: match.league || "",
    home: match.homeShort || match.home,
    away: match.awayShort || match.away,
    matchDate: match.matchDate || match.businessDate || "",
    matchTime: match.matchTime || "",
    hhadGoalLine: Number(match.hhadGoalLine || 0),
    researchCoverage: state.researchByMatch[match.id]?.coverage?.label || "未搜索",
  };
}

function dayPlanOptionsForMatch(match, model, mode) {
  if (!model?.byPlay) return [];
  // Bug-fix: reject matches where both teams lack real data (default Elo=1700, unknown archetype)
  const homeArch = model.meta?.home?.archetype;
  const awayArch = model.meta?.away?.archetype;
  if (homeArch === "unknown" && awayArch === "unknown") return [];
  const plays = mode === "aggressive" ? ["had", "hhad", "ttg", "hafu", "crs"] : ["had", "hhad", "ttg"];
  // Phase 3: hard EV filter — no negative-EV pick enters the day plan pool
  return rankedModelCandidates(match, model, mode, { plays })
    .filter(pick => {
      const ev = (pick.modelProb || 0) * (pick.odds || 1) - 1;
      return ev > 0;
    })
    .slice(0, 6)
    .map((pick) => attachDayPickMeta(match, pick));
}

function pickSignature(pick, byPlayOnly = false) {
  if (!pick) return "";
  return byPlayOnly ? pick.play : `${pick.play}:${pick.key}`;
}

function countBy(items, mapper) {
  const result = new Map();
  for (const item of items) {
    const key = mapper(item);
    if (!key) continue;
    result.set(key, (result.get(key) || 0) + 1);
  }
  return result;
}

function selectDayPlanCandidates(matches, modelsByMatch, mode) {
  const slots = matches
    .map((match) => ({ match, options: dayPlanOptionsForMatch(match, modelsByMatch[match.id], mode) }))
    .filter((slot) => slot.options.length)
    .map((slot) => ({ ...slot, pick: slot.options[0] }));
  if (PLAN_SELECTION_VERSION === "model-rules-v2") return slots.map((slot) => slot.pick);
  if (slots.length <= 2) return slots.map((slot) => slot.pick);

  const maxSamePlay = Math.max(2, Math.ceil(slots.length * (mode === "aggressive" ? 0.45 : 0.55)));
  const maxSameChoice = Math.max(1, Math.ceil(slots.length * 0.45));
  const scoreSlack = mode === "aggressive" ? 0.16 : 0.21;
  const scoreRatio = mode === "aggressive" ? 0.75 : 0.70;

  for (let pass = 0; pass < 8; pass += 1) {
    const picks = slots.map((slot) => slot.pick);
    const playCounts = countBy(picks, (pick) => pickSignature(pick, true));
    const choiceCounts = countBy(picks, (pick) => pickSignature(pick));
    const overloadedChoice = [...choiceCounts.entries()].find(([, count]) => count > maxSameChoice)?.[0];
    const overloadedPlay = [...playCounts.entries()].find(([, count]) => count > maxSamePlay)?.[0];
    if (!overloadedChoice && !overloadedPlay) break;

    const swapTarget = slots
      .filter((slot) => (
        (overloadedChoice && pickSignature(slot.pick) === overloadedChoice)
        || (overloadedPlay && pickSignature(slot.pick, true) === overloadedPlay)
      ))
      .map((slot) => {
        const alternative = slot.options.find((option) => {
          if (overloadedChoice && pickSignature(option) === overloadedChoice) return false;
          if (overloadedPlay && pickSignature(option, true) === overloadedPlay) return false;
          if (option.score < slot.pick.score - scoreSlack) return false;
          if (option.score < slot.pick.score * scoreRatio) return false;
          return true;
        });
        return alternative ? { slot, alternative, loss: slot.pick.score - alternative.score } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.loss - b.loss)[0];

    if (!swapTarget) break;
    swapTarget.slot.pick = {
      ...swapTarget.alternative,
      selectionTags: ["同质化修正", ...(swapTarget.alternative.selectionTags || [])].slice(0, 5),
      selectionReason: `全天计划避免同一盘口过度集中，改用分数接近的次优候选。${swapTarget.alternative.selectionReason || ""}`,
    };
  }

  return slots.map((slot) => slot.pick);
}

function maxUnitsForPick(pick, mode) {
  if (Number.isFinite(pick.kellyFraction) && pick.kellyFraction > 0) {
    const bankrollUnits = mode === "aggressive" ? 80 : 50;
    const kellyCap = Math.max(1, Math.floor(bankrollUnits * pick.kellyFraction));
    const hardCap = 50; // 竞彩单注最多50倍=100元
    let cap = Math.min(hardCap, kellyCap);
    if (pick.play === "crs") cap = Math.min(cap, mode === "aggressive" ? 12 : 5);
    if (pick.play === "hafu") cap = Math.min(cap, mode === "aggressive" ? 18 : 8);
    if (pick.selectionTags?.includes("风险折扣")) cap = Math.min(cap, mode === "aggressive" ? 20 : 10);
    return Math.max(1, cap);
  }
  const byConfidence = { A: 50, B: 28, C: 14, D: 6 };
  let cap = byConfidence[pick.confidence] || 10;
  if (mode === "conservative") {
    if (pick.play === "hafu") cap = Math.min(cap, 10);
    if (pick.play === "crs") cap = Math.min(cap, 4);
    if (pick.selectionTags?.includes("盘口分歧")) cap = Math.min(cap, 18);
    if (pick.selectionTags?.includes("降档风控")) cap = Math.min(cap, 16);
  } else {
    if (pick.play === "crs") cap = Math.min(cap, 12);
    if (pick.play === "hafu") cap = Math.min(cap, 20);
  }
  return Math.max(1, cap);
}

function allocateUnits(totalUnits, picks, mode) {
  // Always allocate EXACTLY totalUnits — conservative spends differently, not less
  const HARD_CAP = 50;
  const totalKelly = picks.reduce((sum, pick) => sum + Math.max(0, Number(pick.kellyFraction) || 0), 0);

  // Sort by EV/Kelly BEFORE allocation — highest value picks get money first
  const sorted = [...picks].sort((a, b) => (b.kellyFraction || b.score || 0) - (a.kellyFraction || a.score || 0));

  // Build allocation weights
  const weights = sorted.map((pick) => {
    if (totalKelly > 0) return Math.max(0, Number(pick.kellyFraction) || 0) / totalKelly;
    const tier = { A: 5, B: 3, C: 2, D: 1 }[pick.confidence] || 1;
    return mode === "aggressive" ? Math.sqrt(tier) : tier * tier;
  });
  const totalWeight = weights.reduce((s, w) => s + w, 0) || picks.length;

  // First pass: proportional allocation, min 1 unit guaranteed
  let remaining = totalUnits;
  const allocated = sorted.map((pick, i) => {
    const fair = Math.max(1, Math.min(HARD_CAP, Math.round(totalUnits * weights[i] / totalWeight)));
    const units = Math.min(fair, remaining);
    remaining -= units;
    return { ...pick, units: Math.max(1, units) };  // Bug-fix: floor at 1 unit (¥2)
  });

  // Redistribute remaining: fill uncapped picks, prefer high-confidence
  let guard = 0;
  while (remaining > 0 && guard < 2000) {
    const target = allocated
      .filter(p => p.units < HARD_CAP)
      .sort((a, b) => ((b.kellyFraction || b.score || (weights[allocated.indexOf(b)] || 1)) / Math.sqrt(b.units + 1))
                     - ((a.kellyFraction || a.score || (weights[allocated.indexOf(a)] || 1)) / Math.sqrt(a.units + 1)))[0];
    if (!target) break; // all at HARD_CAP — rare, only with tiny pick count + huge budget
    target.units += 1;
    remaining -= 1;
    guard += 1;
  }
  // Last resort: if ALL at cap, boost highest-weight picks beyond cap (only for extreme budgets)
  guard = 0;
  while (remaining > 0 && guard < 2000) {
    const target = allocated.sort((a, b) =>
      ((b.kellyFraction || b.score || (weights[allocated.indexOf(b)] || 1)) / Math.sqrt(b.units + 1))
    - ((a.kellyFraction || a.score || (weights[allocated.indexOf(a)] || 1)) / Math.sqrt(a.units + 1)))[0];
    target.units += 1;
    remaining -= 1;
    guard += 1;
  }

  return allocated.filter(p => p.units > 0);
}

function buildRecommendationPlans(match, model, amount) {
  const totalUnits = Math.max(1, Math.floor((Number(amount) || 0) / 2));
  const playOrder = ["had", "hhad", "ttg", "hafu", "crs"];
  const plans = ["conservative", "aggressive"].map((mode) => {
    const picks = playOrder
      .map((play) => bestPickForPlay(match, model, play, mode))
      .filter(Boolean);
    const allocated = allocateUnits(totalUnits, picks, mode);
    const cost = allocated.reduce((sum, pick) => sum + pick.units * 2, 0);
    const maxReturn = allocated.reduce((sum, pick) => sum + pick.units * 2 * pick.odds, 0);
    const expectedReturn = allocated.reduce((sum, pick) => sum + pick.units * 2 * pick.odds * pick.modelProb, 0);
    const units = allocated.reduce((sum, pick) => sum + pick.units, 0);
    return {
      mode,
      title: mode === "conservative" ? "保守方案" : "激进方案",
      picks: allocated,
      units,
      cost,
      maxReturn,
      expectedReturn,
      maxMultiple: cost ? maxReturn / cost : 0,
      unused: Math.max(0, totalUnits * 2 - cost),
      selectionVersion: PLAN_SELECTION_VERSION,
    };
  });
  return plans;
}

function matchPlanDate(match) {
  return String(match?.matchDate || match?.businessDate || "").slice(0, 10) || "未定日期";
}

function availablePlanDates() {
  return [...new Set(state.matches.map(matchPlanDate))].filter(Boolean).sort();
}

function matchesForPlanDate(date = state.dayPlan.date) {
  return state.matches.filter((match) => matchPlanDate(match) === date);
}

function matchSequenceNumber(match) {
  const value = String(match?.number || match?.matchNumStr || "").match(/(\d+)$/)?.[1];
  return value ? Number(value) : 0;
}

function matchSortValue(match) {
  const date = String(match?.matchDate || match?.businessDate || "").slice(0, 10);
  const time = String(match?.matchTime || "00:00:00").padEnd(8, "0");
  return `${date} ${time} ${String(matchSequenceNumber(match)).padStart(3, "0")}`;
}

function matchOfficialResult(match) {
  return match?.result?.full ? match.result : extractMatchResult(match);
}

function drawStateBeforeMatch(target, matches = state.matches) {
  const targetSort = matchSortValue(target);
  let matchesPlayed = 0;
  let draws = 0;
  for (const match of [...matches].sort((a, b) => matchSortValue(a).localeCompare(matchSortValue(b)))) {
    if (String(match.id) === String(target?.id)) break;
    if (matchSortValue(match) >= targetSort) break;
    const result = matchOfficialResult(match);
    if (!result?.full) continue;
    matchesPlayed += 1;
    if (result.full.h === result.full.a) draws += 1;
  }
  return { matchesPlayed, draws };
}

function planNeedsResearch(match) {
  const research = state.researchByMatch[match.id];
  return !research || (research.coverage?.label !== "完整" && research.coverage?.label !== "较完整");
}

async function fetchResearchForMatch(match) {
  const params = new URLSearchParams({
    home: match.home,
    away: match.away,
    league: match.league || "",
    date: match.matchDate || match.businessDate || "",
  });
  const response = await fetch(`/api/research?${params.toString()}`);
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "联网搜索失败");
  state.researchByMatch[match.id] = payload;
  delete state.fullModelByMatch[match.id];
  return payload;
}

async function ensureResearchForMatch(match, force = false) {
  if (!force && !planNeedsResearch(match)) return state.researchByMatch[match.id];
  return fetchResearchForMatch(match);
}

async function refreshFullModelForMatch(match, research = state.researchByMatch[match.id] || null) {
  const response = await fetch("/api/v32-model", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      match,
      research,
      controls: estimatedControlsForMatch(match),
      drawState: drawStateBeforeMatch(match),
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "V3.3 model failed");
  state.fullModelByMatch[match.id] = payload;
  return payload;
}

function dayPlanCandidate(match, model, mode) {
  return dayPlanOptionsForMatch(match, model, mode)[0] || null;
}

// Correlation lookup: play+key → correlation key for Copula engine
// Correlation map: tournament (WC 2018+2022, n=128) priority, club (EPL 2022-2025, n=1140) fallback
// Tournament football has distinct correlation structure: draws more predictable, HAD↔TTG weaker
const CORRELATION_MAP = {
  // Tournament-derived (WC 2018+2022, 128 matches)
  "had_h__ttg_s3":  0.09,  "had_d__ttg_s1":  0.18,  // WC: HAD↔TTG much weaker than club
  "had_h__hafu_hh": 0.59,  "had_d__hafu_dd": 0.77,  // WC: draws+HT draws very strong
  "had_a__hafu_aa": 0.55,  "had_h__hafu_dh": 0.55,
  "hafu_dh__had_h": 0.55,  "hafu_hd__had_d": 0.53,
  "hafu_da__had_a": 0.60,
  "hafu_hh__ttg_s3":0.19,  "hafu_dd__ttg_s1": 0.20,
  // Club-derived fallback (EPL 2022-2025, 1140 matches) — for pairs not covered by WC data
  "hhad_h__had_h":  0.65,  "hhad_h__hafu_hh":0.46, "hhad_h__hafu_dh":0.28,
  "hhad_d__had_d":  0.14,  "hhad_a__had_a": 0.60,
};
function lookupCorrelation(playA, keyA, playB, keyB) {
  const pairs = [`${playA}_${keyA}__${playB}_${keyB}`, `${playB}_${keyB}__${playA}_${keyA}`];
  for (const k of pairs) if (CORRELATION_MAP[k] !== undefined) return CORRELATION_MAP[k];
  return 0; // fallback: independent
}

// ── Copula chunked progress ─────────────────────────────────
const copulaEls = {
  overlay: () => $("#copulaOverlay"),
  progress: () => $("#copulaProgress"),
  text: () => $("#copulaProgressText"),
  cancel: () => $("#copulaCancelBtn"),
};
let _activeTaskToken = null;  // task‑scoped cancel token — never leak across tasks

// Wire cancel button once — cancels CURRENT task only
function initCopulaCancelBtn() {
  const btn = copulaEls.cancel();
  if (!btn || btn._bound) return;
  btn._bound = true;
  btn.addEventListener("click", () => {
    if (_activeTaskToken) _activeTaskToken.cancelled = true;
    btn.setAttribute("hidden", "");
    copulaEls.text().textContent = "正在取消...";
  });
}

// Returns a fresh cancel token bound to THIS task
function showCopulaOverlay(title) {
  const o = copulaEls.overlay(); if (!o) return { cancelled: false };
  const token = { cancelled: false };
  _activeTaskToken = token;
  initCopulaCancelBtn();
  const btn = copulaEls.cancel();
  if (btn) btn.removeAttribute("hidden");
  o.querySelector(".copula-overlay-title").textContent = title || "Copula 引擎计算中...";
  copulaEls.progress().value = 0;
  copulaEls.text().textContent = "0%";
  o.removeAttribute("hidden");
  return token;
}
function updateCopulaProgress(pct) {
  const p = copulaEls.progress(); const t = copulaEls.text();
  if (p) p.value = pct;
  if (t) t.textContent = Math.round(pct) + "%";
}
function hideCopulaOverlay() {
  _activeTaskToken = null;
  copulaEls.overlay()?.setAttribute("hidden", "");
}

// Chunked batch call to Copula — serial chunks, progress callback
async function copulaBatchChunked(batchItems, token, onProgress, chunkSize = 500) {
  const chunks = [];
  for (let i = 0; i < batchItems.length; i += chunkSize) {
    chunks.push(batchItems.slice(i, i + chunkSize));
  }
  const allResults = [];
  for (let ci = 0; ci < chunks.length; ci++) {
    if (token?.cancelled) {
      // Fill remaining with naive markers
      for (let ri = ci; ri < chunks.length; ri++) {
        for (const item of chunks[ri]) {
          allResults.push({ error: true, message: "用户取消计算" });
        }
      }
      break;
    }
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000); // 3 min per chunk
      const res = await fetch("http://127.0.0.1:8000/api/v1/pricing/bivariate-parlay/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: chunks[ci] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        allResults.push(...results);
        if (onProgress) onProgress(((ci + 1) / chunks.length) * 100);
      } else {
        throw new Error(`Copula returned ${res.status}`);
      }
    } catch (e) {
      // Fill remaining chunks with naive fallback markers
      for (let ri = ci; ri < chunks.length; ri++) {
        for (const item of chunks[ri]) {
          allResults.push({ error: true, message: e.message });
        }
      }
      if (onProgress) onProgress(100);
      break; // stop sending — remaining use naive
    }
  }
  return allResults;
}

async function buildParlayPlan(matches, modelsByMatch, budget, mode) {
  // Collect top-2 candidates per match (cross-play, for 2串1/3串1)
  const matchPool = [];
  for (const match of matches) {
    const model = modelsByMatch[match.id];
    if (!model?.byPlay) continue;
    const candidates = rankedModelCandidates(match, model, mode, { plays: ["had", "hhad", "ttg", "crs"] })
      .filter(c => c.confidence !== "D" && !(c.play === "had" && (c.selectionTags || []).includes("Danger Zone")) && !c.singleOnly)
      .slice(0, 2);
    if (candidates.length) matchPool.push({ match, candidates });
  }
  if (matchPool.length < 2) return null;

  // Build all 2串1 combos & assemble batch payload for Copula engine
  const rawLegs = [];
  const batchItems = [];
  for (let i = 0; i < matchPool.length; i++) {
    for (let j = i + 1; j < matchPool.length; j++) {
      for (const ci of matchPool[i].candidates) {
        for (const cj of matchPool[j].candidates) {
          // --- Odds circuit breakers (mirror scan_node.js) ---
          if (ci.odds > 15 || cj.odds > 15) continue;          // Global: no single leg >15x
          const comboOdds = ci.odds * cj.odds;
          if (comboOdds > 225) continue;                        // Cross-match: max 15×15
          // --- Pre-filter: naive EV threshold ---
          const naiveEV = ci.modelProb * cj.modelProb * comboOdds - 1;
          if (naiveEV <= 0.2) continue;                         // Stricter: 0.2 (was 0.03)
          rawLegs.push({
            legs: [
              { matchId: matchPool[i].match.id, home: matchPool[i].match.homeShort, away: matchPool[i].match.awayShort, play: ci.play, key: ci.key, label: ci.label, odds: ci.odds, prob: ci.modelProb },
              { matchId: matchPool[j].match.id, home: matchPool[j].match.homeShort, away: matchPool[j].match.awayShort, play: cj.play, key: cj.key, label: cj.label, odds: cj.odds, prob: cj.modelProb },
            ],
          });
          batchItems.push({
            prob_A: ci.modelProb, prob_B: cj.modelProb,
            odds_A: ci.odds, odds_B: cj.odds,
            correlation: lookupCorrelation(ci.play, ci.key, cj.play, cj.key),
            bankroll: budget,
            kelly_fraction: 0.125, max_position_pct: 0.01, simulations: 100000,
          });
        }
      }
    }
  }
  if (!rawLegs.length) return null;

  // Chunked batch call to Copula with progress overlay
  let copulaResults = [];
  if (batchItems.length) {
    const token = showCopulaOverlay(`Copula 串关定价 · ${batchItems.length} 组`);
    try {
      copulaResults = await copulaBatchChunked(batchItems, token, updateCopulaProgress);
    } catch (e) {
      console.error("Copula batch failed:", e.message);
      copulaResults = batchItems.map(() => ({ error: true }));
    } finally {
      hideCopulaOverlay();
    }
  }

  // Merge Copula results back to rawLegs — strict EV/Kelly filter (mirror scan_node.js)
  const parlays = [];
  for (let k = 0; k < rawLegs.length; k++) {
    const cr = copulaResults[k];
    if (cr?.action === "REJECT") continue;
    const trueEV = cr?.expected_value ?? (batchItems[k] ? batchItems[k].prob_A * batchItems[k].prob_B * batchItems[k].odds_A * batchItems[k].odds_B - 1 : 0);
    const comboOdds = rawLegs[k].legs[0].odds * rawLegs[k].legs[1].odds;
    const comboProb = cr?.true_joint_prob ?? rawLegs[k].legs[0].prob * rawLegs[k].legs[1].prob;
    // Combo margin: 1 − (1−m_A)×(1−m_B) — vig compounds exponentially
    const getPlayMargin = (matchId, play) => {
      const m = matches.find(x => x.id === matchId);
      const pool = m?.pools?.[play] || [];
      return pool.length ? pool.reduce((s, i) => s + 1/i.odds, 0) - 1 : 0;
    };
    const mA = getPlayMargin(rawLegs[k].legs[0].matchId, rawLegs[k].legs[0].play);
    const mB = getPlayMargin(rawLegs[k].legs[1].matchId, rawLegs[k].legs[1].play);
    const comboMargin = 1 - (1 - mA) * (1 - mB);
    // Fractional Kelly: EV/(odds−1), capped at 1% position
    const rawKelly = comboOdds > 1 ? trueEV / (comboOdds - 1) : 0;
    const kelly = Math.min(rawKelly * 0.125, 0.01);
    // Post-Copula filter: EV = prob*odds−1, >0.05 = >5% edge
    if (trueEV <= 0.05 || kelly <= 0.0005) continue;
    parlays.push({ ...rawLegs[k], comboOdds, comboProb, ev: trueEV, kelly, _comboMargin: comboMargin });
  }
  parlays.sort((a, b) => b.ev - a.ev);
  const selected = parlays.slice(0, 4);
  if (!selected.length) return null;

  // Allocate full budget across 4 parlays by Kelly proportion — spend every unit
  const totalUnits = Math.floor(budget / 2);
  const totalKelly = selected.reduce((s, p) => s + p.kelly, 0) || 1;

  let remaining = totalUnits;
  const allocated = selected.map(p => {
    const kellyShare = p.kelly / totalKelly;
    const units = Math.min(50, Math.max(1, Math.floor(totalUnits * kellyShare)));
    remaining -= units;
    return { ...p, units: Math.max(0, units) };
  });

  // Distribute leftover units — uncapped first, then bump all if needed
  let guard = 0;
  while (remaining > 0 && guard < 2000) {
    const target = allocated
      .filter(p => p.units < 50)
      .sort((a, b) => b.kelly - a.kelly)[0];
    if (!target) break;
    target.units += 1;
    remaining -= 1;
    guard += 1;
  }
  guard = 0;
  while (remaining > 0 && guard < 2000) {
    const target = allocated.sort((a, b) => b.kelly - a.kelly)[0];
    target.units += 1;
    remaining -= 1;
    guard += 1;
  }

  const active = allocated.filter(p => p.units > 0);
  const cost = active.reduce((s, p) => s + p.units * 2, 0);
  const maxReturn = active.reduce((s, p) => s + p.units * 2 * p.comboOdds, 0);
  const expectedReturn = active.reduce((s, p) => s + p.units * 2 * p.comboOdds * p.comboProb, 0);

  return {
    mode,
    title: mode === "aggressive" ? "进取串关方案" : "稳健串关方案",
    matches: matchPool.length,
    parlays: active,
    cost,
    maxReturn,
    expectedReturn,
    maxMultiple: cost ? maxReturn / cost : 0,
    unused: Math.max(0, budget - cost),
    selectionVersion: PLAN_SELECTION_VERSION,
  };
}

function buildDayPlan(matches, modelsByMatch, budget, mode) {
  const candidates = selectDayPlanCandidates(matches, modelsByMatch, mode);
  const totalUnits = Math.max(candidates.length, Math.floor((Number(budget) || 0) / 2));

  // Allocate ALL units using confidence-tier weights
  const HARD_CAP = 50;
  const totalKelly = candidates.reduce((sum, pick) => sum + Math.max(0, Number(pick.kellyFraction) || 0), 0);
  const weights = candidates.map((pick) => {
    if (totalKelly > 0) return Math.max(0, Number(pick.kellyFraction) || 0) / totalKelly;
    const tier = { A: 5, B: 3, C: 2, D: 1 }[pick.confidence] || 1;
    return mode === "aggressive" ? Math.sqrt(tier) : tier * tier;
  });
  const totalWeight = weights.reduce((s, w) => s + w, 0) || candidates.length;

  let remaining = totalUnits;
  const baseUnits = candidates.map((pick, i) => {
    const fair = Math.max(1, Math.min(HARD_CAP, Math.round(totalUnits * weights[i] / totalWeight)));
    const units = Math.min(fair, remaining);
    remaining -= units;
    return { ...pick, units };
  });

  // Redistribute remainder
  let guard = 0;
  while (remaining > 0 && guard < 2000) {
    const target = baseUnits
      .filter(p => p.units < HARD_CAP)
      .sort((a, b) => ((b.kellyFraction || b.score || (weights[baseUnits.indexOf(b)] || 1)) / Math.sqrt(b.units + 1))
                     - ((a.kellyFraction || a.score || (weights[baseUnits.indexOf(a)] || 1)) / Math.sqrt(a.units + 1)))[0];
    if (!target) break;
    target.units += 1;
    remaining -= 1;
    guard += 1;
  }
  guard = 0;
  while (remaining > 0 && guard < 2000) {
    const target = baseUnits.sort((a, b) =>
      ((b.kellyFraction || b.score) / Math.sqrt(b.units + 1))
    - ((a.kellyFraction || a.score) / Math.sqrt(a.units + 1)))[0];
    target.units += 1;
    remaining -= 1;
    guard += 1;
  }
  const cost = baseUnits.reduce((sum, pick) => sum + pick.units * 2, 0);
  const maxReturn = baseUnits.reduce((sum, pick) => sum + pick.units * 2 * pick.odds, 0);
  const expectedReturn = baseUnits.reduce((sum, pick) => sum + pick.units * 2 * pick.odds * pick.modelProb, 0);
  const units = baseUnits.reduce((sum, pick) => sum + pick.units, 0);
  return {
    mode,
    title: mode === "aggressive" ? "进取全天计划" : "稳健全天计划",
    matches: candidates.length,
    units,
    cost,
    maxReturn,
    expectedReturn,
    maxMultiple: cost ? maxReturn / cost : 0,
    selectionVersion: PLAN_SELECTION_VERSION,
    picks: baseUnits,
  };
}

function renderRecommendations(match, model) {
  if (!els.recommendBox) return;
  if (!match || !model) {
    els.recommendBox.textContent = "选择比赛后生成预算方案。";
    return;
  }
  const amount = Number(els.budgetInput.value) || 0;
  const normalizedAmount = Math.max(2, Math.floor(amount / 2) * 2);
  if (normalizedAmount !== amount) els.budgetInput.value = normalizedAmount;
  const plans = buildRecommendationPlans(match, model, normalizedAmount);
  els.recommendBox.innerHTML = plans.map((plan) => `
    <details class="recommend-plan">
      <summary class="recommend-plan-summary">
        <span class="plan-title">${plan.title}</span>
        <span class="plan-multiple">${plan.units}注</span>
        <span class="plan-money">投入 ${fmtMoney(plan.cost)} / 最高返 ${fmtMoney(plan.maxReturn)} / ${plan.maxMultiple.toFixed(1)}倍</span>
        <span class="details-action" aria-hidden="true"></span>
      </summary>
      <div class="recommend-plan-body">
        <div class="plan-subline">预期返还 ${fmtMoney(plan.expectedReturn)}。${plan.unused ? `未分配 ${fmtMoney(plan.unused)}（不足 Kelly 阈值留作现金）。` : "预算已按方案分配。"}</div>
        ${plan.picks.map((pick) => `
          <div class="recommend-pick">
            <div class="simulation-row-head">
              <span>${playLabels[pick.play]} · ${escapeHtml(pick.label)}</span>
              <span class="pick-units">${pick.units}注</span>
            </div>
            <div class="pick-meta">
              <span>赔率 ${pick.odds.toFixed(2)}</span>
              <span>模型 ${fmtPct(pick.modelProb)}</span>
              <span>差值 ${fmtSignedPct(pick.edge)}</span>
              <span>投入 ${fmtMoney(pick.units * 2)}</span>
              <span>最高返 ${fmtMoney(pick.units * 2 * pick.odds)}</span>
            </div>
          </div>
        `).join("")}
        <div class="muted">每场最多 50 注（100 元）；仅用于模型研究，不构成投注建议。</div>
      </div>
    </details>
  `).join("");
}

function renderDayPlan() {
  if (!els.dayPlanDateSelect) return;
  const dates = availablePlanDates();
  if (!state.dayPlan.date && dates.length) state.dayPlan.date = dates[0];
  if (state.dayPlan.date && !dates.includes(state.dayPlan.date) && dates.length) state.dayPlan.date = dates[0];
  els.dayPlanDateSelect.innerHTML = dates.length
    ? dates.map((date) => `<option value="${escapeHtml(date)}"${date === state.dayPlan.date ? " selected" : ""}>${escapeHtml(date)} · ${matchesForPlanDate(date).length} 场</option>`).join("")
    : `<option value="">暂无比赛</option>`;
  if (document.activeElement !== els.dayPlanBudgetInput) {
    els.dayPlanBudgetInput.value = state.dayPlan.budget || 300;
  }
  const dayMatches = matchesForPlanDate(state.dayPlan.date);
  const searchedCount = dayMatches.filter((match) => state.researchByMatch[match.id]).length;
  const modeledCount = dayMatches.filter((match) => state.fullModelByMatch[match.id]?.model).length;
  els.dayPlanSummary.innerHTML = `
    <div class="sim-kpi"><span>当天比赛</span><strong>${dayMatches.length}</strong></div>
    <div class="sim-kpi"><span>情报覆盖</span><strong>${searchedCount}/${dayMatches.length || 0}</strong></div>
    <div class="sim-kpi"><span>完整模型</span><strong>${modeledCount}/${dayMatches.length || 0}</strong></div>
    <div class="sim-kpi"><span>当前预算</span><strong>${fmtMoney(state.dayPlan.budget || 0)}</strong></div>
  `;
  els.dayPlanProgress.textContent = state.dayPlan.progress || "生成时会自动补齐当天全部比赛的联网情报，并用完整模型计算两套全天计划。";
  renderDayPlanResults();
}

function renderDayPlanResults() {
  const plans = state.dayPlan.plans || [];
  if (!plans.length) {
    els.dayPlanResults.innerHTML = `<div class="empty-state">暂无全天计划方案。</div>`;
    return;
  }
  els.dayPlanResults.innerHTML = plans.map((plan) => {
    const isParlay = plan.parlays != null;
    return `
    <details class="day-plan-card" ${isParlay ? "open" : ""}>
      <summary class="recommend-plan-summary">
        <span class="plan-title">${escapeHtml(plan.title)}</span>
        <span class="plan-multiple">${isParlay ? plan.parlays.length+"组" : (plan.units||0)+"倍"}</span>
        <span class="plan-money">${plan.matches} 场 / 投入 ${fmtMoney(plan.cost)} / 最高返 ${fmtMoney(plan.maxReturn)} / ${plan.maxMultiple.toFixed(1)}倍</span>
        <span class="details-action" aria-hidden="true"></span>
      </summary>
      <div class="day-pick-list">
        <div class="plan-subline">预期返还 ${fmtMoney(plan.expectedReturn)}${isParlay && plan.unused > 0 ? `。未分配 ${fmtMoney(plan.unused)}（不足 Kelly 阈值留作现金）。` : ""}。生成时间 ${escapeHtml(state.dayPlan.generatedAt || "-")}。</div>
        ${isParlay ? plan.parlays.map((p) => `
          <div class="day-pick-row parlay-row">
            <div class="parlay-legs">
              ${p.legs.map(l => `<span class="parlay-leg">${escapeHtml(l.home)} vs ${escapeHtml(l.away)}：<strong>${playLabels[l.play]}·${escapeHtml(l.label)}</strong> @${l.odds.toFixed(2)}</span>`).join('<span class="parlay-x"> × </span>')}
            </div>
            <div class="day-pick-choice">
              <strong>2串1</strong>
              <span>${p.units}注</span>
            </div>
            <div class="pick-meta">
              <span>组合赔率 ${p.comboOdds.toFixed(2)}</span>
              <span>联合概率 ${fmtPct(p.comboProb)}</span>
              <span>EV ${(p.ev >= 0 ? "+" : "")}${(p.ev*100).toFixed(1)}%</span>
              <span class="${p._comboMargin > 0.15 ? 'edge-neg' : ''}">串关抽水 ${(p._comboMargin*100).toFixed(1)}%</span>
              <span>投入 ${fmtMoney(p.units * 2)}</span>
              <span>最高返 ${fmtMoney(p.units * 2 * p.comboOdds)}</span>
            </div>
          </div>
        `).join("") : plan.picks.map((pick) => `
          <div class="day-pick-row">
            <div class="day-pick-main">
              <strong>${escapeHtml(pick.matchNumber)} ${escapeHtml(pick.home)} vs ${escapeHtml(pick.away)}</strong>
              <span>${escapeHtml(pick.matchDate)} ${escapeHtml(pick.matchTime)} · 情报${escapeHtml(pick.researchCoverage)}</span>
            </div>
            <div class="day-pick-choice">
              <strong>${playLabels[pick.play]} · ${escapeHtml(pick.label)}</strong>
              <span>${pick.units}倍</span>
            </div>
            <div class="pick-meta">
              <span>赔率 ${pick.odds.toFixed(2)}</span>
              <span>模型 ${fmtPct(pick.modelProb)}</span>
              <span>EV ${(((pick.modelProb||0)*pick.odds-1) >= 0 ? "+" : "")}${(((pick.modelProb||0)*pick.odds-1)*100).toFixed(1)}%</span>
              <span>评分 ${pick.score.toFixed(2)}</span>
              <span>投入 ${fmtMoney(pick.units * 2)}</span>
              <span>最高返 ${fmtMoney(pick.units * 2 * pick.odds)}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </details>
  `}).join("");
}

async function generateDayPlan() {
  if (!state.matches.length) {
    setStatus("请先同步 sporttery 比赛。", true);
    return;
  }
  const date = els.dayPlanDateSelect.value || state.dayPlan.date;
  const matches = matchesForPlanDate(date);
  if (!matches.length) {
    setStatus("当前日期没有可生成方案的比赛。", true);
    return;
  }
  const minBudget = matches.length * 2;
  const budget = Math.max(minBudget, Math.floor((Number(els.dayPlanBudgetInput.value) || minBudget) / 2) * 2);
  els.dayPlanBudgetInput.value = budget;
  state.dayPlan = { ...state.dayPlan, date, budget, plans: [], selectionVersion: PLAN_SELECTION_VERSION, progress: `准备生成 ${date} 全部 ${matches.length} 场比赛方案...` };
  renderDayPlan();
  els.dayPlanGenerateBtn.disabled = true;
  setStatus(`正在补全 ${date} 当天 ${matches.length} 场比赛的联网情报...`);
  try {
    const modelsByMatch = {};
    let searched = 0;
    let modeled = 0;
    const errors = [];
    for (const match of matches) {
      const title = `${match.homeShort || match.home} vs ${match.awayShort || match.away}`;
      state.dayPlan.progress = `联网情报 ${searched + 1}/${matches.length}：${title}`;
      renderDayPlan();
      try {
        await ensureResearchForMatch(match);
        searched += 1;
      } catch (error) {
        errors.push(`${title} 情报失败：${error.message}`);
      }
      state.dayPlan.progress = `完整模型 ${modeled + 1}/${matches.length}：${title}`;
      renderDayPlan();
      try {
        const payload = await refreshFullModelForMatch(match, state.researchByMatch[match.id] || null);
        modelsByMatch[match.id] = payload.model;
        modeled += 1;
      } catch (error) {
        errors.push(`${title} 模型失败：${error.message}`);
      }
      await persistState({ immediate: true });
    }
    const modeledMatches = matches.filter((match) => modelsByMatch[match.id]);
    const plans = [];
    for (const mode of ["conservative", "aggressive"]) {
      const single = buildDayPlan(modeledMatches, modelsByMatch, budget, mode);
      if (single) plans.push(single);
      const parlay = await buildParlayPlan(modeledMatches, modelsByMatch, budget, mode);
      if (parlay) plans.push(parlay);
    }
    state.dayPlan = {
      date,
      budget,
      generatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      selectionVersion: PLAN_SELECTION_VERSION,
      plans,
      errors,
      progress: errors.length
        ? `已生成，${modeled}/${matches.length} 场完成模型；${errors.length} 条情报或模型失败已跳过。`
        : `已完成 ${matches.length} 场情报补全和完整模型计算。`,
    };
    await persistState({ immediate: true });
    renderDayPlan();
    setStatus(`全天计划已生成：${plans[0]?.matches || 0} 场纳入方案。`);
  } catch (error) {
    state.dayPlan.progress = `全天计划生成失败：${error.message}`;
    renderDayPlan();
    setStatus(`全天计划生成失败：${error.message}`, true);
  } finally {
    els.dayPlanGenerateBtn.disabled = false;
  }
}

async function clearDayPlan() {
  state.dayPlan = { ...DEFAULT_DAY_PLAN, date: state.dayPlan.date, budget: Number(els.dayPlanBudgetInput.value) || 300 };
  await persistState({ immediate: true });
  renderDayPlan();
  setStatus("全天计划已清空。");
}

async function exportDayPlanForAI() {
  const matches = state.matches.length
    ? state.matches
    : (() => { setStatus("请先同步比赛数据。", true); return []; })();
  if (!matches.length) return;

  els.dayPlanExportBtn.disabled = true;
  setStatus("正在导出比赛数据...");

  try {
    const exportData = matches.map(match => {
      const pools = {};
      for (const play of ["had", "hhad", "ttg", "hafu", "crs"]) {
        const items = match.pools?.[play] || match[play] || [];
        if (items.length) {
          pools[play] = items.map(item => ({
            key: item.key,
            label: item.label || item.key,
            odds: item.odds,
          }));
        }
      }
      return {
        number: match.number,
        home: match.homeShort || match.home,
        away: match.awayShort || match.away,
        league: match.league,
        date: match.matchDate || match.businessDate,
        time: match.matchTime,
        hhadGoalLine: match.hhadGoalLine,
        pools,
      };
    });

    const blob = new Blob([JSON.stringify({
      exportedAt: new Date().toISOString(),
      totalMatches: exportData.length,
      matches: exportData,
    }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sporttery-raw-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus(`已导出 ${exportData.length} 场比赛原始数据。`);
  } catch (error) {
    setStatus(`导出失败：${error.message}`, true);
  } finally {
    els.dayPlanExportBtn.disabled = false;
  }
}

function riskLabel(play, modelProb, edge, match) {
  if (!Number.isFinite(modelProb) || !Number.isFinite(edge)) return { label: "无模型", cls: "" };
  const penalty = match ? researchPenaltyForMatch(match) : researchPenalty();
  if (penalty >= 1 && (play === "hafu" || play === "crs")) return { label: "待情报", cls: "risk-high" };
  if (play === "crs" || play === "hafu") {
    if (edge > 0.08) return { label: "高波动", cls: "risk-high" };
    return { label: "波动", cls: "risk-high" };
  }
  if (penalty >= 1) return { label: "待情报", cls: "risk-high" };
  if (edge > 0.08 && modelProb > 0.45) return { label: "观察", cls: "risk-watch" };
  if (edge < -0.05) return { label: "低差值", cls: "risk-bad" };
  return { label: "中性", cls: "" };
}

// V4 scanner cache: matchId → scan report
const _scannerCache = new Map();
let _scanReqId = 0;          // race-condition guard — discard stale responses

async function scanAndShowCards(match, model) {
  if (!match || !model) {
    els.scannerCards.innerHTML = "";
    els.decisionBox.textContent = "等待选择比赛。";
    return;
  }
  const ck = match.id;
  const reqId = ++_scanReqId;  // tag current request

  // Use cache if fresh
  const cached = _scannerCache.get(ck);
  if (cached && !cached._stale) {
    _renderScanCards(ck, cached);
    return;
  }

  // ── Loading skeleton ──
  els.scannerCards.innerHTML = `<div class="scanner-loading anim-shimmer" style="padding:24px;border-radius:8px">正在扫描竞彩价值洼地...</div>`;
  els.decisionBox.innerHTML = `<div class="grade-card"><div class="scanner-loading">计算中...</div></div>`;

  let scan = null;
  try {
    const resp = await fetch("/api/ttg-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, match }),
    });
    if (resp.ok) {
      scan = await resp.json();
      scan._stale = false;
      _scannerCache.set(ck, scan);
    } else {
      const errBody = await resp.text().catch(() => "");
      throw new Error(errBody || `HTTP ${resp.status}`);
    }
  } catch (e) {
    // Race-condition guard: discard if match changed during fetch
    if (reqId !== _scanReqId) return;
    els.scannerCards.innerHTML = `<div class="scanner-error">扫描失败：${escapeHtml(e.message)}。检查 Copula 引擎是否在线。</div>`;
    els.decisionBox.innerHTML = `<div class="grade-card"><div>扫描器未响应</div></div>`;
    return;
  }

  // Discard stale response
  if (reqId !== _scanReqId) return;

  // ── Render scan cards + report ──
  _renderScanCards(ck, scan);
}

function _renderScanCards(ck, scan) {
  // Discard if match no longer selected
  const currentMatch = selectedMatch();
  if (!currentMatch || currentMatch.id !== ck) return;

  if (!scan || scan.error) {
    els.scannerCards.innerHTML = `<div class="scanner-error">扫描器异常：${scan?.error || "未知错误"}</div>`;
    els.decisionBox.innerHTML = `<div class="grade-card"><div>扫描器异常</div></div>`;
    return;
  }

  // ── Scanner cards (HAD / HHAD / TTG) ──
  let cardsHtml = "";
  for (const play of (scan.plays || [])) {
    const hasValue = play.bins.some(b => b.isValue);
    cardsHtml += `<div class="scanner-card anim-fade-in-up${hasValue ? " scanner-card-value anim-pulse-glow" : ""}">`;
    cardsHtml += `<div class="scanner-card-head">${play.label} ${hasValue ? " ⭐" : ""} <span class="scanner-margin">抽水 ${play.marketMargin}%</span></div>`;
    for (const b of play.bins) {
      const evClass = b.ev > 0.05 ? "scanner-ev-positive" : b.ev > 0 ? "scanner-ev-neutral" : "scanner-ev-negative";
      const tag = b.isValue ? `<span class="edge-badge">⭐ 价值洼地</span>` : "";
      cardsHtml += `<div class="scanner-row ${evClass}">
        <span class="row-lbl">${b.label}</span>
        <span class="num"><small>SP</small>${b.odds}</span>
        <span class="num"><small>模型</small>${fmtPct(b.modelProb)}</span>
        <span class="num"><small>市场</small>${fmtPct(b.marketProb)}</span>
        <span class="num ev-val"><small>EV</small>${b.ev >= 0 ? "+" : ""}${b.ev.toFixed(2)}</span>
        <span class="tag-cell">${tag}</span>
      </div>`;
    }
    cardsHtml += "</div>";
  }
  els.scannerCards.innerHTML = cardsHtml;

  // ── V4 core scan report ──
  const vp = scan.valuePicks || [];
  let vpList = "";
  if (vp.length) {
    vpList = vp.map(p =>
      `<div class="edge-row">
        <span><small style="color:var(--muted);margin-right:4px">[${p.play.toUpperCase()}]</small>${p.label}</span>
        <strong class="edge-pos">EV ${p.ev >= 0 ? "+" : ""}${p.ev.toFixed(2)} <small style="color:var(--muted);margin-left:4px;font-weight:normal">SP${p.odds}</small></strong>
      </div>`
    ).join("");
  } else {
    vpList = `<div class="edge-row"><span>未发现显著价值洼地</span><strong>观望</strong></div>`;
  }

  const research = selectedResearch();
  const marginInfo = (scan.plays || []).map(p => `${p.label} ${p.marketMargin}%`).join(" | ");

  els.decisionBox.innerHTML = `
    <div class="grade-card">
      <div class="grade-title"><span>V4.0 核心扫描</span><span>${vp.length} 个价值</span></div>
      <div>体彩抽水率 → ${marginInfo || "无数据"}</div>
    </div>
    <div class="grade-card">
      <div class="grade-title"><span>价值洼地</span><span>${research ? `情报${research.coverage?.label || "已刷新"}` : "未搜索"}</span></div>
      <div class="top-edge">${vpList}</div>
    </div>
    <div class="grade-card model-meta-card">
      <div class="grade-title"><span>引擎版本</span><span class="model-source-pill">V4.0 NB+Copula+DC+xG</span></div>
      <div>NB负二项厚尾 → Gaussian Copula相依 → Dixon-Coles低分修正 → xG燃料接入。lambda乘数 + 交互矩阵 + 熔断保护仍由V3.3体系驱动。WDL/让球/总进球由统一得分矩阵衍生。</div>
    </div>
  `;
}

// Legacy table — replaced by V4 scanner cards
function renderTable(match, model) {
  scanAndShowCards(match, model).catch(e => console.error("scanCards:", e.message));
}

function renderDecision(match, model) {
  // Decision panel is now rendered inside scanAndShowCards
  // Keep stub for compatibility
}

function renderModelMeta(model) {
  const meta = model?.meta || {};
  if (!String(meta.source || "").startsWith("skill-imported-")) {
    return `
      <div class="grade-card">
        <div class="grade-title"><span>模型源</span><span>等待完整版</span></div>
        <div>联网搜索完成后会自动切换到 Skill 完整版导入模型；当前仅作为临时本地矩阵预览。</div>
      </div>
    `;
  }
  const isV33 = String(meta.source || "").includes("v33-");
  const sourceLabelText = isV33 ? "V3.3 r6 (λ乘数驱动)" : "Skill 完整版导入";
  const bodyText = isV33
    ? "r6: λ乘数交互矩阵 + Sij经验混合 + 熔断保护 + Danger Zone选择器风控。比分矩阵/让球/总进球/半全场均由泊松λ统一衍生，不再pp对齐。"
    : "已接入 V3.2 references/scripts：P0 ensemble、Elo/FIFA/PDF 基线、小组出线先验、贝叶斯平局修正、Tavily 动态情报和三状态比分矩阵。";
  const notes = (meta.notes || []).slice(0, 4)
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");
  return `
    <div class="grade-card model-meta-card">
      <div class="grade-title">
        <span>模型源</span>
        <span class="model-source-pill">${sourceLabelText}</span>
      </div>
      <div>${bodyText}</div>
      ${notes ? `<ul class="model-meta-list">${notes}</ul>` : ""}
    </div>
  `;
}

function gradeMatch(states) {
  const max = Math.max(states.h, states.d, states.a);
  const doubleChance = Math.max(states.h + states.d, states.h + states.a, states.d + states.a);
  const penalty = researchPenalty();
  const research = selectedResearch();
  if (penalty >= 1) {
    return {
      grade: "待复核",
      reason: research
        ? "已联网搜索，但首发、伤停和赛程动机的高相关来源不足，先不做强评级。"
        : "尚未联网刷新首发、伤停和赛程动机，先不做强评级。",
    };
  }
  if (max >= 0.68 && states.d <= 0.25 && penalty === 0) {
    return { grade: "A", reason: "单方向集中度高，动态情报覆盖较完整。" };
  }
  if (doubleChance >= 0.78 && max < 0.68) {
    return { grade: "B", reason: "双选保护较强，但单方向不够干净。" };
  }
  if (states.d >= 0.33 || max - states.d < 0.12) {
    return { grade: "C", reason: "平局或分歧压力偏高，适合降权观察。" };
  }
  return { grade: penalty > 0 ? "C" : "D", reason: "方向分散或数据冲突，暂不适合做强判断。" };
}

function renderResearch() {
  const match = selectedMatch();
  const research = selectedResearch();
  if (!match) {
    els.researchBox.textContent = "选择比赛后可联网搜索首发、伤停、赛程动机和盘口异动。";
    return;
  }
  if (!research) {
    els.researchBox.innerHTML = `
      <div class="research-empty">
        <strong>${escapeHtml(match.homeShort || match.home)} vs ${escapeHtml(match.awayShort || match.away)}</strong>
        <span>还没有刷新联网情报。</span>
      </div>
    `;
    return;
  }

  const categoryHtml = research.categories.map((category) => {
    const results = category.results.slice(0, 4);
    const providerText = providerLabel(category.provider);
    const resultHtml = results.length
      ? results.map((item) => `
          <a class="research-result" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">
            <span>${escapeHtml(item.title)}</span>
            <small>${escapeHtml(item.snippet || item.url)}</small>
          </a>
        `).join("")
      : `
          <a class="research-result" href="${escapeHtml(category.searchUrl)}" target="_blank" rel="noreferrer">
            <span>没有抓到高相关来源，打开搜索继续核验</span>
            <small>${escapeHtml(category.query)}</small>
          </a>
        `;
    return `
      <div class="research-category">
        <div class="research-category-head">
          <strong>${escapeHtml(category.label)}</strong>
          <a href="${escapeHtml(category.searchUrl)}" target="_blank" rel="noreferrer">${category.ok ? `${category.results.length} 条` : "失败"}</a>
        </div>
        <div class="research-query">${escapeHtml(category.query)}</div>
        <div class="research-provider">${providerText}</div>
        ${category.answer ? `<div class="research-answer">${escapeHtml(category.answer)}</div>` : ""}
        ${resultHtml}
      </div>
    `;
  }).join("");

  els.researchBox.innerHTML = `
    <div class="research-cover">
      <span>覆盖度：${escapeHtml(research.coverage.label)}</span>
      <span>${research.coverage.signalCount}/4 类信号</span>
    </div>
    ${categoryHtml}
  `;
}

function providerLabel(provider = "") {
  if (provider === "tavily") return "Tavily";
  if (provider === "tavily-bing-fallback") return "Bing fallback";
  if (provider === "bing") return "Bing";
  return "Search";
}

function sourceLabel(source = "") {
  if (source === "tavily-search") return "Tavily";
  if (source === "bing-web-search") return "Bing";
  return "Search";
}

function currentControls() {
  return {
    lambdaHome: Number(els.lambdaHome.value),
    lambdaAway: Number(els.lambdaAway.value),
    profile: els.profileSelect.value,
    tempo: els.tempoSelect.value,
    confidence: selectedAutoJudge()?.confidence || selectedResearch()?.coverage?.label || "",
  };
}

async function refreshFullModel(match = selectedMatch(), research = selectedResearch()) {
  if (!match) return null;
  const response = await fetch("/api/v32-model", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      match,
      research,
      controls: currentControls(),
      drawState: drawStateBeforeMatch(match),
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "V3.2 full model failed");
  state.fullModelByMatch[match.id] = payload;
  persistState();
  return payload;
}

let fullModelTimer = null;

let _controlDebounceTimer = null;
function handleControlChange() {
  const match = selectedMatch();
  if (match) { delete state.fullModelByMatch[match.id]; _scannerCache.delete(match.id); }
  updateSliderLabels();
  // Debounce 300ms: avoid flooding on every pixel drag
  clearTimeout(_controlDebounceTimer);
  _controlDebounceTimer = setTimeout(() => {
    renderAll();
    const research = selectedResearch();
    if (!match || !research) return;
    clearTimeout(fullModelTimer);
    fullModelTimer = setTimeout(async () => {
      try {
        await refreshFullModel(match, research);
        renderAll();
      } catch {
        // Keep local fallback model visible
      }
    }, 450);
  }, 300);
}

function estimatedControlsForMatch(match) {
  const ft = marketFullTimeProbabilities(match);
  const homeFav = ft.h >= ft.a;
  const favProb = Math.max(ft.h, ft.a);
  const drawProb = ft.d || 0.27;
  let lambdaHome = 1.28 + (ft.h - ft.a) * 1.45 - drawProb * 0.22;
  let lambdaAway = 1.08 - (ft.h - ft.a) * 1.25 - drawProb * 0.18;
  let profile = "balanced";
  if (favProb > 0.72) {
    lambdaHome = homeFav ? 2.3 : 0.45;
    lambdaAway = homeFav ? 0.45 : 2.3;
    profile = "defensive-favorite";
  } else if (favProb > 0.6) {
    lambdaHome = homeFav ? 1.85 : 0.65;
    lambdaAway = homeFav ? 0.65 : 1.85;
    profile = "default";
  } else if (favProb > 0.5 || drawProb > 0.28) {
    lambdaHome = homeFav ? 1.3 : 1.0;
    lambdaAway = homeFav ? 1.0 : 1.3;
  }
  return {
    lambdaHome: clamp(lambdaHome, 0.2, 3.4),
    lambdaAway: clamp(lambdaAway, 0.2, 3.4),
    profile,
    tempo: "normal",
    confidence: state.researchByMatch[match.id]?.coverage?.label || "market-only",
    // P8+P9: match stage and motivation for V3.3 r3
    matchStage: inferMatchStage(match),
    motivation: inferMotivation(match),
  };
}

// ===== P8: Infer match stage from match metadata =====
function inferMatchStage(match) {
  const league = (match.league || "").toLowerCase();
  const round = (match.round || match.stage || "").toLowerCase();
  // Explicit round hints
  if (/final|决赛/.test(round) || /final|决赛/.test(league)) return "final";
  if (/semi|半决赛/.test(round) || /semi|半决赛/.test(league)) return "semi";
  if (/quarter|1\/4|四分之一|quarter|八强/.test(round)) return "quarter";
  if (/round of 16|1\/8|八分之一|十六强|round_of_16/.test(round)) return "round_of_16";
  if (/round of 32|三十二强|round_of_32/.test(round)) return "round_of_32";
  // League-based hints
  if (/淘汰赛|knockout|playoff/.test(league)) return "round_of_16";
  // Group stage is default
  const number = match.number || "";
  const groupMatch = number.match(/^[A-L]-(\d)$/);
  if (groupMatch) {
    const roundNum = parseInt(groupMatch[1], 10);
    if (roundNum >= 4) return "round_of_16"; // past group stage
  }
  return "group";
}

// ===== P9: Infer motivation from match context =====
function inferMotivation(match) {
  const number = match.number || "";
  const groupMatch = number.match(/^[A-L]-(\d)$/);
  // Group stage round 3: best-third-place dynamics apply
  if (groupMatch && parseInt(groupMatch[1], 10) === 3) {
    // Without standings data, default to "neutral"
    // User can override via match controls
    return "neutral";
  }
  return "neutral";
}

async function ensureFullModelForMatch(match) {
  if (state.fullModelByMatch[match.id]?.model) return state.fullModelByMatch[match.id];
  const response = await fetch("/api/v32-model", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      match,
      research: state.researchByMatch[match.id] || null,
      controls: estimatedControlsForMatch(match),
      drawState: drawStateBeforeMatch(match),
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) throw new Error(payload.error || "V3.3 model failed");
  state.fullModelByMatch[match.id] = payload;
  persistState();
  return payload;
}

function buildModelSnapshot() {
  return {
    schema: "sporttery-v33-workbench-snapshot",
    version: 1,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    selectedId: state.selectedId,
    matches: state.matches,
    lastPayload: state.lastPayload,
    researchByMatch: state.researchByMatch,
    autoByMatch: state.autoByMatch,
    fullModelByMatch: state.fullModelByMatch,
    simulation: state.simulation,
    dayPlan: state.dayPlan,
  };
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportModelSnapshot() {
  const snapshot = buildModelSnapshot();
  els.modelSnapshotText.value = JSON.stringify(snapshot, null, 2);
  setModelIoExpanded(true);
  downloadJson(`sporttery-v33-model-${new Date().toISOString().slice(0, 10)}.json`, snapshot);
  setStatus("整体模型快照已导出，包含全部比赛、联网情报、模型输出和模拟盘历史。");
}

function applyModelSnapshot(snapshot) {
  if (!snapshot || snapshot.schema !== "sporttery-v33-workbench-snapshot") {
    throw new Error("不是有效的 V3.3 工作台模型快照。");
  }
  state.matches = Array.isArray(snapshot.matches) ? snapshot.matches : state.matches;
  state.lastPayload = snapshot.lastPayload || state.lastPayload;
  state.selectedId = snapshot.selectedId || state.matches[0]?.id || state.selectedId;
  state.researchByMatch = snapshot.researchByMatch || {};
  state.autoByMatch = snapshot.autoByMatch || {};
  state.fullModelByMatch = snapshot.fullModelByMatch || {};
  state.simulation = snapshot.simulation || { predictions: [], history: [] };
  state.dayPlan = snapshot.dayPlan || state.dayPlan || { ...DEFAULT_DAY_PLAN };
  persistState();
  renderAll();
  setStatus("整体模型快照已导入。");
}

function importModelFromText() {
  setModelIoExpanded(true);
  const raw = els.modelSnapshotText.value.trim();
  if (!raw) {
    if (els.importModelFile) els.importModelFile.click();
    return;
  }
  try {
    applyModelSnapshot(JSON.parse(raw));
  } catch (error) {
    setStatus(`模型导入失败：${error.message}`, true);
  }
}

function importModelFromFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      els.modelSnapshotText.value = String(reader.result || "");
      applyModelSnapshot(JSON.parse(els.modelSnapshotText.value));
    } catch (error) {
      setStatus(`模型导入失败：${error.message}`, true);
    }
  };
  reader.readAsText(file, "utf-8");
}

function buildSimulationPick(match, model) {
  // r6: uses full ranked candidate pipeline (same as single-match workbench)
  const candidates = rankedModelCandidates(match, model, "conservative");
  if (!candidates.length) return null;
  const best = candidates.find((row) => row.confidence === "A" || row.confidence === "B") || candidates[0];
  return best;
}

async function buildSimulationParlays(matches, stake) {
  // Collect top-1 candidate per match (exclude HAFU, same as buildParlayPlan)
  const matchPool = [];
  for (const match of matches) {
    const model = state.fullModelByMatch[match.id]?.model;
    if (!model?.byPlay) continue;
    const candidates = rankedModelCandidates(match, model, "conservative", { plays: ["had", "hhad", "ttg", "crs"] })
      .filter(c => c.confidence !== "D" && !(c.play === "had" && (c.selectionTags || []).includes("Danger Zone")) && !c.singleOnly)
      .slice(0, 1);
    if (candidates.length) matchPool.push({ match, candidate: candidates[0] });
  }
  if (matchPool.length < 2) return [];

  // Build all 2串1 combos + Copula batch
  const combos = [], batch = [];
  for (let i = 0; i < matchPool.length; i++) {
    for (let j = i + 1; j < matchPool.length; j++) {
      const ci = matchPool[i].candidate, cj = matchPool[j].candidate;
      if (ci.odds > 15 || cj.odds > 15) continue;
      const comboOdds = ci.odds * cj.odds;
      if (comboOdds > 225) continue;
      const naiveEV = ci.modelProb * cj.modelProb * comboOdds - 1;
      if (naiveEV <= 0.3) continue;
      combos.push({
        legs: [
          { matchId: matchPool[i].match.id, home: matchPool[i].match.homeShort || matchPool[i].match.home, away: matchPool[i].match.awayShort || matchPool[i].match.away, number: matchPool[i].match.number, play: ci.play, key: ci.key, label: ci.label, odds: ci.odds, prob: ci.modelProb },
          { matchId: matchPool[j].match.id, home: matchPool[j].match.homeShort || matchPool[j].match.home, away: matchPool[j].match.awayShort || matchPool[j].match.away, number: matchPool[j].match.number, play: cj.play, key: cj.key, label: cj.label, odds: cj.odds, prob: cj.modelProb },
        ],
        comboOdds, naiveEV,
      });
      batch.push({
        prob_A: ci.modelProb, prob_B: cj.modelProb,
        odds_A: ci.odds, odds_B: cj.odds,
        correlation: 0, bankroll: 1000,
        kelly_fraction: 0.125, max_position_pct: 0.01, simulations: 100000,
      });
    }
  }
  if (!combos.length) return [];

  // Chunked Copula call with progress overlay
  let copulaResults = [];
  if (batch.length) {
    const token = showCopulaOverlay(`Copula 模拟盘串关 · ${batch.length} 组`);
    try {
      copulaResults = await copulaBatchChunked(batch, token, updateCopulaProgress);
    } catch (e) {
      console.error("Copula sim parlay failed:", e.message);
      copulaResults = batch.map(() => ({ error: true }));
    } finally {
      hideCopulaOverlay();
    }
  }

  // Filter + sort
  const filtered = [];
  for (let k = 0; k < combos.length; k++) {
    const cr = copulaResults[k];
    if (cr?.action === "REJECT") continue;
    const trueEV = cr?.expected_value ?? combos[k].naiveEV;
    const kelly = combos[k].comboOdds > 1 ? Math.min((trueEV / (combos[k].comboOdds - 1)) * 0.125, 0.01) : 0;
    if (trueEV <= 0.05 || kelly <= 0.0005) continue;
    filtered.push({ ...combos[k], ev: trueEV, kelly, jointProb: cr?.true_joint_prob ?? (combos[k].legs[0].prob * combos[k].legs[1].prob) });
  }
  filtered.sort((a, b) => b.ev - a.ev);
  const selected = filtered.slice(0, 4);
  if (!selected.length) return [];

  // Format as simulation predictions
  return selected.map((p, idx) => ({
    id: `parlay-${p.legs[0].matchId}-${p.legs[1].matchId}-${idx}`,
    type: "parlay",
    legs: p.legs,
    comboOdds: p.comboOdds,
    comboProb: p.jointProb,
    ev: p.ev,
    kelly: p.kelly,
    stake,
    potentialReturn: stake * p.comboOdds,
    createdAt: new Date().toISOString(),
    status: "pending",
    selectionTags: [],
    confidence: p.ev > 2 ? "A" : p.ev > 1.3 ? "B" : "C",
  }));
}

const KELLY_MULTIPLIER = 0.25;
const MAX_POSITION_PCT = 0.05;

function updateSimBalance() {
  const sim = state.simulation || {};
  const bankroll = sim.bankroll ?? 0;
  const disp = els.simBalanceDisplay;
  if (disp && bankroll > 0) {
    disp.style.display = "";
    const pct = sim.bankroll && sim.initialBankroll
      ? ((bankroll / sim.initialBankroll - 1) * 100).toFixed(1) : "0.0";
    const clr = bankroll >= (sim.initialBankroll || bankroll) ? "#2e7d32" : "#c00";
    disp.innerHTML = `余额: <strong style="color:${clr}">¥${Math.round(bankroll).toLocaleString()}</strong> (${pct >= 0 ? "+" : ""}${pct}%)`;
  }
}

function computeKellyStake(bankroll, modelProb, odds) {
  const ev = modelProb * odds - 1;
  if (ev <= 0 || odds <= 1) return 0;
  const kellyFraction = ev / (odds - 1);
  const safeFraction = Math.min(kellyFraction * KELLY_MULTIPLIER, MAX_POSITION_PCT);
  return Math.max(2, Math.round(bankroll * safeFraction / 2) * 2); // min 2 yuan, even units
}

async function generateSimulation() {
  if (!state.matches.length) {
    setStatus("请先同步 sporttery 比赛。", true);
    return;
  }
  const bankroll = Math.max(100, Number(els.simBankrollInput.value) || 10000);
  els.simBankrollInput.value = bankroll;
  els.simGenerateBtn.disabled = true;
  setStatus("正在生成模拟盘未来预测（1/4 Kelly 仓位）...");
  try {
    const predictions = [];
    for (const match of state.matches) {
      const payload = await ensureFullModelForMatch(match);
      const pick = buildSimulationPick(match, payload.model);
      if (!pick) continue;
      const ev = (pick.modelProb || 0) * (pick.odds || 1) - 1;
      const stake = computeKellyStake(bankroll, pick.modelProb, pick.odds);
      predictions.push({
        id: `${match.id}-${pick.play}-${pick.key}`,
        matchId: match.id,
        number: match.number,
        league: match.league,
        matchDate: match.matchDate || match.businessDate || "",
        matchTime: match.matchTime || "",
        home: match.homeShort || match.home,
        away: match.awayShort || match.away,
        hhadGoalLine: Number(match.hhadGoalLine || 0),
        play: pick.play,
        key: pick.key,
        label: pick.label,
        odds: pick.odds,
        modelProb: pick.modelProb,
        edge: pick.edge,
        ev,
        score: pick.score,
        confidence: pick.confidence || "C",
        selectionTags: pick.selectionTags || [],
        selectionReason: pick.selectionReason || "",
        v33Signals: {
          autoCorrected: payload.model?.meta?.layers?.correction?.autoCorrected || false,
          lbScore: payload.model?.meta?.layers?.signals?.lowBlockPenaltyScore || 0,
          surgeScore: payload.model?.meta?.layers?.signals?.surgeScore || 0,
          grade: payload.model?.meta?.grade?.grade || "C",
          favoriteClass: payload.model?.meta?.layers?.signals?.favoriteClass || "",
          underdogClass: payload.model?.meta?.layers?.signals?.underdogClass || "",
        },
        stake,
        positionPct: stake / bankroll,
        potentialReturn: stake * pick.odds,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
    // Append parlay (2串1) predictions — use Kelly stake for parlays too
    let parlayCount = 0;
    try {
      const parlayStake = computeKellyStake(bankroll, 0.15, 6.0); // conservative parlay Kelly
      const parlays = await buildSimulationParlays(state.matches, parlayStake);
      for (const p of parlays) { p.positionPct = p.stake / bankroll; }
      predictions.push(...parlays);
      parlayCount = parlays.length;
    } catch (e) { console.error('buildSimulationParlays failed:', e.message); }

    const existingSettled = state.simulation.history || [];
    const existingBankroll = state.simulation.bankroll;
    state.simulation = {
      predictions,
      history: existingSettled,
      bankroll: existingBankroll ?? bankroll,
      initialBankroll: bankroll,
    };
    await persistState({ immediate: true });
    renderSimulation();
    updateSimBalance();
    setStatus(`已生成 ${predictions.length - parlayCount} 场单关 + ${parlayCount} 组串关（1/4 Kelly · 单场≤5%）。`);
  } catch (error) {
    setStatus(`模拟预测失败：${error.message}`, true);
  } finally {
    els.simGenerateBtn.disabled = false;
  }
}

function parseScoreText(value) {
  const match = String(value || "").trim().match(/^(\d+)\s*[-:：]\s*(\d+)$/);
  if (!match) return null;
  return { h: Number(match[1]), a: Number(match[2]) };
}

function normalizeScorePair(value) {
  if (!value && value !== 0) return null;
  if (typeof value === "object") {
    const home = Number(value.h ?? value.home ?? value.homeScore ?? value.hostScore);
    const away = Number(value.a ?? value.away ?? value.awayScore ?? value.guestScore);
    return Number.isFinite(home) && Number.isFinite(away) ? { h: home, a: away } : null;
  }
  return parseScoreText(value);
}

function firstScorePair(...values) {
  for (const value of values) {
    const parsed = normalizeScorePair(value);
    if (parsed) return parsed;
  }
  return null;
}

function separateScoreFields(match, homeKeys, awayKeys) {
  for (const homeKey of homeKeys) {
    for (const awayKey of awayKeys) {
      const home = Number(match?.[homeKey]);
      const away = Number(match?.[awayKey]);
      if (Number.isFinite(home) && Number.isFinite(away)) return { h: home, a: away };
    }
  }
  return null;
}

function normalizeMatchResult(result) {
  if (!result) return null;
  const full = firstScorePair(
    result.full,
    result.score,
    result.fullScore,
    result.finalScore,
    result.matchScore,
    result.allScore,
    result.totalScore,
  );
  const half = firstScorePair(
    result.half,
    result.halfScore,
    result.halfCourtScore,
    result.halfResult,
    result.htScore,
    result.firstHalfScore,
  );
  return full ? { full, half, source: result.source || "imported" } : null;
}

function extractMatchResult(match = {}) {
  const normalized = normalizeMatchResult(match.result);
  if (normalized) return normalized;
  const full = firstScorePair(
    match.score,
    match.fullScore,
    match.finalScore,
    match.matchScore,
    match.allScore,
    match.totalScore,
    match.result,
    match.matchResult,
    match.fullResult,
  ) || separateScoreFields(
    match,
    ["homeScore", "homeFullScore", "homeTeamScore", "hostScore", "hScore", "homeGoals"],
    ["awayScore", "awayFullScore", "awayTeamScore", "guestScore", "aScore", "awayGoals"],
  );
  const half = firstScorePair(
    match.halfScore,
    match.halfCourtScore,
    match.halfResult,
    match.htScore,
    match.firstHalfScore,
  ) || separateScoreFields(
    match,
    ["homeHalfScore", "halfHomeScore", "homeHtScore", "homeHalfGoals"],
    ["awayHalfScore", "halfAwayScore", "awayHtScore", "awayHalfGoals"],
  );
  return full ? { full, half, source: match.result?.source || "match-fields" } : null;
}

function predictionWon(prediction, result) {
  const fullKey = stateKey(result.full.h, result.full.a);
  if (prediction.play === "had") return prediction.key === fullKey;
  if (prediction.play === "hhad") {
    const adjusted = result.full.h + Number(prediction.hhadGoalLine || 0) - result.full.a;
    return prediction.key === (adjusted > 0 ? "h" : adjusted === 0 ? "d" : "a");
  }
  if (prediction.play === "ttg") {
    const total = result.full.h + result.full.a;
    return prediction.key === (total >= 7 ? "s7" : `s${total}`);
  }
  if (prediction.play === "crs") {
    const exact = exactScoreKey(result.full.h, result.full.a);
    if (isListedScore(result.full.h, result.full.a)) return prediction.key === exact;
    if (result.full.h > result.full.a) return prediction.key === "s1sh";
    if (result.full.h === result.full.a) return prediction.key === "s1sd";
    return prediction.key === "s1sa";
  }
  if (prediction.play === "hafu") {
    if (!result.half) return false;
    return prediction.key === `${stateKey(result.half.h, result.half.a)}${fullKey}`;
  }
  return false;
}

function settlePrediction(prediction, result) {
  const won = predictionWon(prediction, result);
  const profit = won ? prediction.potentialReturn - prediction.stake : -prediction.stake;
  // Update simulation bankroll
  if (state.simulation.bankroll != null) {
    state.simulation.bankroll += profit;
  }
  return {
    ...prediction,
    status: won ? "won" : "lost",
    result,
    settledAt: new Date().toISOString(),
    returnAmount: won ? prediction.potentialReturn : 0,
    profit,
  };
}

function settlePredictionsWithResults(resultByMatch) {
  const remaining = [];
  const settled = [];
  for (const prediction of state.simulation.predictions || []) {
    const result = resultByMatch.get(String(prediction.matchId));
    if (!result?.full) {
      remaining.push(prediction);
      continue;
    }
    settled.push(settlePrediction(prediction, result));
  }
  if (!settled.length) return 0;
  state.simulation.predictions = remaining;
  state.simulation.history = [...settled, ...(state.simulation.history || [])];
  if (!state.simulation.bankroll && state.simulation.initialBankroll) {
    state.simulation.bankroll = state.simulation.initialBankroll;
  }
  persistState({ immediate: true });
  renderSimulation();
  updateSimBalance();
  return settled.length;
}

function settleSimulation(targetId = null) {
  const remaining = [];
  const settled = [];
  for (const prediction of state.simulation.predictions || []) {
    if (targetId && prediction.id !== targetId) {
      remaining.push(prediction);
      continue;
    }
    const full = parseScoreText(document.querySelector(`[data-full-score="${prediction.id}"]`)?.value);
    const half = parseScoreText(document.querySelector(`[data-half-score="${prediction.id}"]`)?.value);
    if (!full) {
      remaining.push(prediction);
      continue;
    }
    settled.push(settlePrediction(prediction, { full, half, source: "manual" }));
  }
  state.simulation.predictions = remaining;
  state.simulation.history = [...settled, ...(state.simulation.history || [])];
  if (!state.simulation.bankroll && state.simulation.initialBankroll) {
    state.simulation.bankroll = state.simulation.initialBankroll;
  }
  persistState({ immediate: true });
  renderSimulation();
  updateSimBalance();
  setStatus(settled.length ? `已结算 ${settled.length} 场模拟预测。` : "没有可结算的已填赛果。", !settled.length);
}

function settleSimulationFromMatches(matches) {
  const resultByMatch = new Map();
  for (const match of matches || []) {
    const result = extractMatchResult(match);
    if (result?.full) resultByMatch.set(String(match.id), result);
  }
  return {
    availableResults: resultByMatch.size,
    settledCount: settlePredictionsWithResults(resultByMatch),
  };
}

function addDateDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resultDateRange(predictions) {
  const dates = (predictions || [])
    .map((item) => new Date(`${item.matchDate || item.businessDate || ""}T00:00:00`))
    .filter((date) => Number.isFinite(date.getTime()));
  if (!dates.length) {
    const today = new Date();
    return {
      from: formatDateParam(addDateDays(today, -2)),
      to: formatDateParam(today),
    };
  }
  const min = new Date(Math.min(...dates.map((date) => date.getTime())));
  const max = new Date(Math.max(...dates.map((date) => date.getTime())));
  return {
    from: formatDateParam(addDateDays(min, -1)),
    to: formatDateParam(addDateDays(max, 2)),
  };
}

async function captureClosingLine() {
  const predictions = state.simulation.predictions || [];
  if (!predictions.length) { setStatus("没有待赛预测可捕获闭盘线。", true); return; }
  els.simCLVBtn.disabled = true;
  setStatus("正在捕获闭盘赔率...");
  try {
    const response = await fetch(`/api/sporttery?pool=had`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "获取赔率失败");
    const oddsMap = new Map();
    for (const m of payload.matches || []) {
      const h = m.pools?.had?.find(i => i.key === "h")?.odds;
      const d = m.pools?.had?.find(i => i.key === "d")?.odds;
      const a = m.pools?.had?.find(i => i.key === "a")?.odds;
      if (h && d && a) oddsMap.set(String(m.id), { h, d, a });
    }
    // Record to CLV ledger and capture closing odds
    let captured = 0;
    for (const pred of predictions) {
      const odds = oddsMap.get(String(pred.matchId));
      if (!odds) continue;
      const closingOdds = pred.play === "had"
        ? odds[pred.key] : odds.h;
      if (!closingOdds) continue;

      pred.closingOdds = closingOdds;
      pred.clv = ((pred.odds / closingOdds) - 1) * 100;
      captured++;

      // Write to server-side CLV ledger
      try {
        await fetch("/api/clv/record", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            match_id: pred.matchId,
            kickoff_time: `${pred.matchDate}T${String(pred.matchTime || "00:00:00").slice(0, 8)}Z`,
            target_market: pred.play === "hhad" ? "让球胜平负" : "胜平负",
            selection: pred.label,
            selection_key: pred.key,
            bet_time: pred.createdAt || new Date().toISOString(),
            taken_odds: pred.odds,
          }),
        });
      } catch (e) { /* ledger write failure is non-fatal */ }
    }
    await persistState({ immediate: true });
    renderSimulation();
    setStatus(`已捕获 ${captured}/${predictions.length} 场闭盘赔率。CLV = (预测赔率/闭盘赔率) − 1`);
  } catch (error) {
    setStatus(`捕获失败：${error.message}`, true);
  } finally {
    els.simCLVBtn.disabled = false;
  }
}

async function syncSimulationResults() {
  const pending = state.simulation.predictions || [];
  if (!pending.length) {
    setStatus("当前没有待结算的模拟预测。", true);
    return;
  }
  els.simFetchResultsBtn.disabled = true;
  setStatus("正在同步 sporttery 赛果...");
  try {
    const range = resultDateRange(pending);
    let resultSyncError = null;
    let officialOutcome = { availableResults: 0, settledCount: 0 };
    let resultPayload = null;
    try {
      const resultResponse = await fetch(`/api/results?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}&pageSize=120`);
      resultPayload = await resultResponse.json();
      if (!resultResponse.ok || !resultPayload.ok) throw new Error(resultPayload.error || "sporttery result sync failed");
      officialOutcome = settleSimulationFromMatches(resultPayload.matches || []);
    } catch (error) {
      resultSyncError = error;
    }

    const response = await fetch(`/api/sporttery?pool=${encodeURIComponent(els.poolSelect.value)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "sporttery sync failed");
    loadMatches(payload.matches || [], payload);
    // Merge bettingSingle from results API into pool matches
    if (resultPayload?.matches) {
      const bsMap = new Map(resultPayload.matches.map(m => [String(m.id), m.rawResult?.bettingSingle]));
      for (const match of state.matches) {
        const bs = bsMap.get(String(match.id));
        if (bs !== undefined && !match.rawResult) match.rawResult = {};
        if (bs !== undefined) match.rawResult.bettingSingle = bs;
      }
    }
    const fallbackOutcome = officialOutcome.settledCount
      ? { availableResults: 0, settledCount: 0 }
      : settleSimulationFromMatches(payload.matches || []);
    const settledCount = officialOutcome.settledCount + fallbackOutcome.settledCount;
    const availableResults = officialOutcome.availableResults + fallbackOutcome.availableResults;
    if (settledCount) {
      setStatus(`已同步官方赛果并自动结算 ${settledCount} 场模拟预测。`);
    } else if (availableResults) {
      setStatus("已同步到赛果，但没有匹配到当前待结算预测。", true);
    } else if (resultSyncError) {
      setStatus(`赔率已刷新；官方赛果源暂不可用：${resultSyncError.message}。可手动填写赛果。`, true);
    } else {
      setStatus("已同步 sporttery；当前日期范围暂无可自动结算比分，请手动填写赛果。", true);
    }
  } catch (error) {
    setStatus(`同步赛果失败：${error.message}`, true);
  } finally {
    els.simFetchResultsBtn.disabled = false;
  }
}

function clearSimulation() {
  const initialBankroll = state.simulation.initialBankroll || Number(els.simBankrollInput.value) || 10000;
  state.simulation = { predictions: [], history: [], bankroll: initialBankroll, initialBankroll };
  persistState({ immediate: true });
  renderSimulation();
  updateSimBalance();
  setStatus("模拟盘已清空。");
}

function renderSimulation() {
  if (!els.simulationSummary) return;
  const predictions = state.simulation.predictions || [];
  const history = state.simulation.history || [];
  const settledStake = history.reduce((sum, item) => sum + item.stake, 0);
  const settledReturn = history.reduce((sum, item) => sum + (item.returnAmount || 0), 0);
  const profit = settledReturn - settledStake;
  const winCount = history.filter((item) => item.status === "won").length;
  const historyWithCLV = history.filter(i => Number.isFinite(i.closingOdds) && i.closingOdds > 0);
  const clvPositive = historyWithCLV.filter(i => ((i.odds || 1) / (i.closingOdds || 1) - 1) > 0).length;
  const weightedCLV = historyWithCLV.length
    ? historyWithCLV.reduce((s, i) => s + (i.stake || 0) * ((i.odds || 1) / (i.closingOdds || 1) - 1) * 100, 0)
      / historyWithCLV.reduce((s, i) => s + (i.stake || 0), 0)
    : 0;
  const simBankroll = state.simulation.bankroll ?? state.simulation.initialBankroll ?? 0;
  const bankrollPct = simBankroll && state.simulation.initialBankroll
    ? ((simBankroll / state.simulation.initialBankroll - 1) * 100) : 0;
  updateSimBalance();
  els.simulationSummary.innerHTML = `
    <div class="sim-kpi"><span>资金池</span><strong class="${bankrollPct >= 0 ? 'edge-pos' : 'edge-neg'}">${fmtMoney(simBankroll)}</strong><small>${bankrollPct >= 0 ? "+" : ""}${bankrollPct.toFixed(1)}%</small></div>
    <div class="sim-kpi"><span>未来预测</span><strong>${predictions.length}</strong></div>
    <div class="sim-kpi"><span>已结算投入</span><strong>${fmtMoney(settledStake)}</strong></div>
    <div class="sim-kpi"><span>累计收益</span><strong class="${profit >= 0 ? "edge-pos" : "edge-neg"}">${fmtMoney(profit)}</strong></div>
    <div class="sim-kpi"><span>命中率</span><strong>${history.length ? fmtPct(winCount / history.length) : "-"}</strong></div>
    ${historyWithCLV.length ? `<div class="sim-kpi"><span>加权CLV</span><strong class="${weightedCLV >= 0 ? "edge-pos" : "edge-neg"}">${weightedCLV >= 0 ? "+" : ""}${weightedCLV.toFixed(1)}%</strong><small>跑赢${historyWithCLV.length}场中${clvPositive}场</small></div>` : ""}
  `;
  const singlePreds = predictions.filter(p => p.type !== "parlay");
  const parlayPreds = predictions.filter(p => p.type === "parlay");
  els.simulationFuture.innerHTML = predictions.length
    ? singlePreds.map((item) => `
    <div class="simulation-row">
      <div class="simulation-row-head">
        <span>${escapeHtml(item.number || "")} ${escapeHtml(item.home)} vs ${escapeHtml(item.away)}</span>
        <span class="sim-status-pending">待赛</span>
      </div>
      <div class="sim-meta">
        <span>${escapeHtml(item.matchDate)} ${escapeHtml(item.matchTime)}</span>
        <span>${playLabels[item.play]} · ${escapeHtml(item.label)}</span>
        <span>赔率 ${item.odds.toFixed(2)}</span>
        <span>模型 ${fmtPct(item.modelProb)}</span>
        <span>仓位 ${(item.positionPct*100).toFixed(1)}% (${fmtMoney(item.stake)})</span>
        <span>EV ${item.ev >= 0 ? "+" : ""}${(item.ev*100).toFixed(1)}%</span>
        <span>潜在返还 ${fmtMoney(item.potentialReturn)}</span>
      </div>
      <div class="result-inputs">
        <input data-full-score="${item.id}" placeholder="全场比分，如 2-1" />
        <input data-half-score="${item.id}" placeholder="半场比分，可选" />
        <button type="button" data-fill-result="${item.id}">结算本场</button>
      </div>
    </div>
    `).join("") + parlayPreds.map((item) => `
    <div class="simulation-row simulation-row-parlay">
      <div class="simulation-row-head">
        <span>🔗 2串1 ${item.confidence === "A" ? "⭐" : ""}</span>
        <span class="sim-status-pending">待赛</span>
      </div>
      <div class="parlay-legs">
        ${item.legs.map(l => `<div class="parlay-leg"><span class="leg-match">${escapeHtml(l.number || "")} ${escapeHtml(l.home)} vs ${escapeHtml(l.away)}</span><span>${playLabels[l.play]}·${escapeHtml(l.label)} @${l.odds.toFixed(2)}</span></div>`).join('<div class="parlay-x"> × </div>')}
      </div>
      <div class="sim-meta">
        <span>组合赔率 ${item.comboOdds.toFixed(2)}</span>
        <span>联合概率 ${fmtPct(item.comboProb)}</span>
        <span>EV ${(item.ev || 0).toFixed(2)}</span>
        <span>Kelly ${(item.kelly || 0).toFixed(4)}</span>
        <span>仓位 ${fmtMoney(item.stake)}</span>
        <span>潜在返还 ${fmtMoney(item.potentialReturn)}</span>
      </div>
    </div>
    `).join("")
    : `<div class="empty-state">暂无未来预测。同步比赛后点击"生成未来预测"。</div>`;
  els.simulationHistory.innerHTML = history.length ? history.map((item) => `
    <div class="simulation-row">
      <div class="simulation-row-head">
        <span>${escapeHtml(item.number || "")} ${escapeHtml(item.home)} vs ${escapeHtml(item.away)}</span>
        <span class="${item.status === "won" ? "sim-status-win" : "sim-status-loss"}">${item.status === "won" ? "命中" : "未中"}</span>
      </div>
      <div class="settle-meta">
        <span>${playLabels[item.play]} · ${escapeHtml(item.label)}</span>
        <span>赛果 ${item.result?.full?.h}-${item.result?.full?.a}</span>
        <span>下单EV ${item.ev >= 0 ? "+" : ""}${((item.ev||0)*100).toFixed(1)}%</span>
        <span>模型 ${fmtPct(item.modelProb)}</span>
        <span>投入 ${fmtMoney(item.stake)}</span>
        <span>返还 ${fmtMoney(item.returnAmount || 0)}</span>
        <span class="${(item.profit||0) >= 0 ? 'edge-pos' : 'edge-neg'}">盈亏 ${(item.profit||0) >= 0 ? "+" : ""}${fmtMoney(item.profit || 0)}</span>
        ${Number.isFinite(item.closingOdds) && item.closingOdds > 0 ? `<span class="${((item.odds||1)/(item.closingOdds||1)-1) >= 0 ? "edge-pos" : "edge-neg"}">闭盘 ${item.closingOdds.toFixed(2)} · CLV ${((item.odds||1)/(item.closingOdds||1)-1) >= 0 ? "+" : ""}${((item.odds / item.closingOdds - 1) * 100).toFixed(1)}%</span>` : ""}
      </div>
    </div>
  `).join("") : `<div class="empty-state">暂无历史预测。可同步赛果自动结算，或填入比分后手动结算。</div>`;
}

function renderAll() {
  const safe = (label, fn) => { try { fn(); } catch (e) { console.error('renderAll.' + label + ' failed:', e.message); } };
  safe('updateSliderLabels', updateSliderLabels);
  safe('renderMatches', renderMatches);
  safe('renderDayPlan', renderDayPlan);
  const match = selectedMatch();
  const model = match ? modelProbabilities(match) : null;
  safe('renderHero', () => renderHero(match));
  safe('renderResearch', renderResearch);
  safe('renderAutoJudge', () => renderAutoJudge(match));
  if (model) {
    safe('renderSummary', () => renderSummary(match, model));
    safe('renderTable', () => renderTable(match, model));
    safe('renderDecision', () => renderDecision(match, model));
    safe('renderRecommendations', () => renderRecommendations(match, model));
  } else {
    safe('renderAll-default', () => {
      if (els.summaryStrip) els.summaryStrip.innerHTML = "";
      if (els.scannerCards) els.scannerCards.innerHTML = `<div class="empty-state">请选择比赛。</div>`;
    });
    safe('renderRecommendations', () => renderRecommendations(null, null));
  }
  safe('renderSimulation', renderSimulation);
}

let _syncInProgress = false;
async function syncSporttery() {
  if (_syncInProgress) { setStatus("同步正在进行中，请稍后重试。", true); return; }
  _syncInProgress = true;
  els.syncBtn.disabled = true;
  setStatus("正在同步 sporttery 赔率...");
  try {
    const response = await fetch(`/api/sporttery?pool=${encodeURIComponent(els.poolSelect.value)}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "同步失败");
    loadMatches(payload.matches || [], payload);
    const time = payload.lastUpdateTime || payload.fetchedAt;
    setStatus(`已同步 ${payload.matches.length} 场比赛。数据时间：${time || "未知"}。`);
  } catch (error) {
    setStatus(`同步失败：${error.message}。可以粘贴 JSON 兜底。`, true);
  } finally {
    els.syncBtn.disabled = false;
    _syncInProgress = false;
  }
}

async function researchCurrentMatch() {
  const match = selectedMatch();
  if (!match) {
    setStatus("请先选择一场比赛。", true);
    return;
  }
  els.researchBtn.disabled = true;
  els.researchBtn.textContent = "搜索中...";
  setStatus(`正在联网搜索 ${match.homeShort || match.home} vs ${match.awayShort || match.away} 的首发、伤停和赛程动机...`);
  try {
    const params = new URLSearchParams({
      home: match.home,
      away: match.away,
      league: match.league || "",
      date: match.matchDate || match.businessDate || "",
    });
    const response = await fetch(`/api/research?${params.toString()}`);
    const payload = await response.json();
    if (!response.ok || !payload.ok) throw new Error(payload.error || "联网搜索失败");
    state.researchByMatch[match.id] = payload;
    const auto = inferAutoSettings(match, payload);
    state.autoByMatch[match.id] = auto;
    applyAutoSettings(auto);
    await refreshFullModel(match, payload);
    _scannerCache.delete(match.id);  // invalidate: new research → rescan
    setResearchExpanded(true);
    persistState();
    setStatus(`联网情报已刷新：${payload.coverage.label}，${payload.coverage.totalResults} 条候选来源。`);
    try { renderAll(); } catch (e) { console.error('researchCurrentMatch renderAll:', e.message); }
  } catch (error) {
    setStatus(`联网搜索失败：${error.message}`, true);
  } finally {
    els.researchBtn.disabled = false;
    els.researchBtn.textContent = "重新搜索";
  }
}

function loadMatches(matches, payload = null) {
  state.matches = matches.filter(m => !/芬超|芬兰/i.test(m.league || ""));
  state.lastPayload = payload;
  state.selectedId = matches[0]?.id || null;
  if (state.selectedId) estimateLambdasFromMarket(selectedMatch());
  persistState();
  try {
    renderAll();
  } catch (e) {
    console.error('renderAll failed:', e);
    // renderAll crash is non-fatal — data already saved to state
  }
}

function parsePastedJson() {
  try {
    const parsed = JSON.parse(els.pasteJson.value);
    if (Array.isArray(parsed.matches)) {
      loadMatches(parsed.matches, parsed);
      setStatus(`已解析粘贴数据：${parsed.matches.length} 场比赛。`);
      return;
    }
    if (Array.isArray(parsed)) {
      loadMatches(parsed, { source: "paste-array" });
      setStatus(`已解析粘贴数组：${parsed.length} 场比赛。`);
      return;
    }
    if (parsed?.value?.matchInfoList) {
      const transformed = transformRawSporttery(parsed);
      loadMatches(transformed.matches, transformed);
      setStatus(`已解析 sporttery 原始 JSON：${transformed.matches.length} 场比赛。`);
      return;
    }
    throw new Error("JSON 里没有 matches 或 value.matchInfoList");
  } catch (error) {
    setStatus(`解析失败：${error.message}`, true);
  }
}

function transformRawSporttery(data) {
  const groups = data?.value?.matchInfoList || [];
  const matches = [];
  for (const group of groups) {
    for (const match of group.subMatchList || []) {
      matches.push({
        id: String(match.matchId),
        number: match.matchNumStr,
        league: match.leagueAbbName || match.leagueAllName || "",
        businessDate: match.businessDate || group.businessDate || "",
        matchDate: match.matchDate || "",
        matchTime: match.matchTime || "",
        home: match.homeTeamAllName || match.homeTeamAbbName || "主队",
        away: match.awayTeamAllName || match.awayTeamAbbName || "客队",
        homeShort: match.homeTeamAbbName || match.homeTeamAllName || "主队",
        awayShort: match.awayTeamAbbName || match.awayTeamAllName || "客队",
        homeRank: match.homeRank || "",
        awayRank: match.awayRank || "",
        status: match.matchStatus || "",
        result: extractMatchResult(match),
        hhadGoalLine: Number(match.hhad?.goalLine || match.hhad?.goalLineValue || 0) || 0,
        pools: {
          hafu: mapRawOdds(match.hafu, [["hh", "胜胜"], ["hd", "胜平"], ["ha", "胜负"], ["dh", "平胜"], ["dd", "平平"], ["da", "平负"], ["ah", "负胜"], ["ad", "负平"], ["aa", "负负"]]),
          had: mapRawOdds(match.had, [["h", "胜"], ["d", "平"], ["a", "负"]]),
          hhad: mapRawOdds(match.hhad, [["h", "让胜"], ["d", "让平"], ["a", "让负"]]),
          ttg: mapRawOdds(match.ttg, [["s0", "0"], ["s1", "1"], ["s2", "2"], ["s3", "3"], ["s4", "4"], ["s5", "5"], ["s6", "6"], ["s7", "7+"]]),
          crs: mapRawOdds(match.crs, [["s01s00", "1:0"], ["s02s00", "2:0"], ["s02s01", "2:1"], ["s03s00", "3:0"], ["s03s01", "3:1"], ["s03s02", "3:2"], ["s04s00", "4:0"], ["s04s01", "4:1"], ["s04s02", "4:2"], ["s05s00", "5:0"], ["s05s01", "5:1"], ["s05s02", "5:2"], ["s1sh", "胜其他"], ["s00s00", "0:0"], ["s01s01", "1:1"], ["s02s02", "2:2"], ["s03s03", "3:3"], ["s1sd", "平其他"], ["s00s01", "0:1"], ["s00s02", "0:2"], ["s01s02", "1:2"], ["s00s03", "0:3"], ["s01s03", "1:3"], ["s02s03", "2:3"], ["s00s04", "0:4"], ["s01s04", "1:4"], ["s02s04", "2:4"], ["s00s05", "0:5"], ["s01s05", "1:5"], ["s02s05", "2:5"], ["s1sa", "负其他"]]),
        },
        rawPools: {
          hafu: match.hafu || {},
          had: match.had || {},
          hhad: match.hhad || {},
          ttg: match.ttg || {},
          crs: match.crs || {},
        },
      });
    }
  }
  return { ok: true, source: "paste-raw-sporttery", matches };
}

function mapRawOdds(source = {}, pairs) {
  return pairs
    .map(([key, label]) => ({ key, label, odds: Number(source?.[key]) || null }))
    .filter((item) => item.odds);
}

els.syncBtn.addEventListener("click", syncSporttery);
els.researchBtn.addEventListener("click", researchCurrentMatch);
els.researchToggleBtn.addEventListener("click", () => setResearchExpanded(!state.researchExpanded));
els.matchSearch.addEventListener("input", renderMatches);
els.viewTabs.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-view]");
  if (!button) return;
  setActiveView(button.dataset.view);
});
window.addEventListener("hashchange", () => {
  setActiveView(routeViewFromHash() || "workbench", false);
});
els.lambdaHome.addEventListener("input", handleControlChange);
els.lambdaAway.addEventListener("input", handleControlChange);
els.profileSelect.addEventListener("change", handleControlChange);
els.tempoSelect.addEventListener("change", handleControlChange);
function getBestModelForMatch(match) {
  if (!match) return null;
  const cached = state.fullModelByMatch[match.id];
  if (cached?.model) return cached.model;
  return modelProbabilities(match);
}
els.budgetInput.addEventListener("input", () => renderRecommendations(selectedMatch(), getBestModelForMatch(selectedMatch())));
els.recommendBtn.addEventListener("click", () => renderRecommendations(selectedMatch(), getBestModelForMatch(selectedMatch())));

// 实时赛况面板 — always visible, countdown before KO, live polling after KO
let inPlayActive = false;
let inPlayTimer = null;
let countdownTimer = null;

function updateInPlayPanel() {
  const match = selectedMatch();
  if (!match) {
    els.inPlayToggleBtn.disabled = true;
    els.inPlayToggleBtn.textContent = "等待开赛";
    els.inPlayResult.innerHTML = `<div style="color:#999;text-align:center;padding:12px">选择比赛后可查看实时赛况。</div>`;
    return;
  }
  if (!match.matchDate) {
    els.inPlayToggleBtn.disabled = true;
    els.inPlayToggleBtn.textContent = "无开赛时间";
    return;
  }
  const ko = new Date(`${match.matchDate}T${String(match.matchTime || "00:00:00").slice(0, 8)}`);
  const diffSec = (ko - new Date()) / 1000;
  if (diffSec > 0) {
    // Not started yet — show countdown
    els.inPlayToggleBtn.disabled = true;
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    const s = Math.floor(diffSec % 60);
    els.inPlayCountdown.textContent = diffSec > 7200 ? `${match.matchDate} ${String(match.matchTime||"").slice(0,5)}` : `距开赛 ${h}h${m}m${s}s`;
    els.inPlayToggleBtn.textContent = "等待开赛";
    els.inPlayResult.innerHTML = `<div style="color:#999;text-align:center;padding:12px">${match.homeShort} vs ${match.awayShort} · 尚未开赛 · ${els.inPlayCountdown.textContent}</div>`;
    // Refresh countdown every second
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => { updateInPlayPanel(); if (!diffSec || diffSec <= -150*60) clearInterval(countdownTimer); }, 1000);
    return;
  }
  // Match is live
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  els.inPlayToggleBtn.disabled = false;
  if (!inPlayActive) {
    els.inPlayToggleBtn.textContent = "启动实时";
    els.inPlayCountdown.textContent = "已开赛";
  }
}

function showInPlayCountdown() {
  if (!els.inPlayPanel) return; // not on single-match page
  updateInPlayPanel();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(updateInPlayPanel, 1000);
}
function hideInPlayCountdown() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

async function fetchLiveData() {
  if (!inPlayActive) return;
  const match = selectedMatch();
  if (!match) return;
  try {
    let minutes = 0, h = 0, a = 0;
    try {
      const res = await fetch(`/api/anysport/live`);
      if (res.ok) {
        const liveData = await res.json();
        if (liveData?.ok && liveData.matches?.length) {
          const found = liveData.matches.find(m =>
            (m.home_team?.name || "").includes(match.homeShort || "") ||
            (m.away_team?.name || "").includes(match.awayShort || ""));
          if (found) {
            minutes = found.minutes_played || found.elapsed || 0;
            h = found.home_goals || found.score?.home || 0;
            a = found.away_goals || found.score?.away || 0;
          }
        }
      }
    } catch (e) { /* fallback */ }

    if (!minutes && !h && !a) {
      const ko = new Date(`${match.matchDate}T${String(match.matchTime || "00:00:00").slice(0, 8)}`);
      minutes = Math.min(Math.max(0, Math.floor((new Date() - ko) / 60000)), 120);
    }
    els.inPlayCountdown.textContent = `${minutes}' ${h}-${a}`;
    await refreshInPlay(minutes, h, a);
  } catch (e) { els.inPlayCountdown.textContent = "数据获取失败"; }
}

async function refreshInPlay(minutes = 0, h = 0, a = 0) {
  const match = selectedMatch();
  if (!match) return;
  try {
    const response = await fetch("/api/v32-inplay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        match, research: state.researchByMatch[match.id] || null,
        controls: estimatedControlsForMatch(match),
        drawState: drawStateBeforeMatch(match),
        inPlay: { minutesPlayed: minutes, currentH: h, currentA: a },
      }),
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error);
    const ip = payload.inPlay;
    const s = payload.states;
    els.inPlayResult.innerHTML = `
      <div class="inplay-stats"><div style="margin-bottom:4px">${minutes}' ${h}-${a}</div>
        <div>剩余λ <strong>主${ip.lambdaRemaining.home}</strong> <strong>客${ip.lambdaRemaining.away}</strong> · 衰减${(ip.decayFactor*100).toFixed(0)}%</div>
        <div>下一球 主<strong>${fmtPct(payload.nextGoalProb.home)}</strong> 客<strong>${fmtPct(payload.nextGoalProb.away)}</strong> 无<strong>${fmtPct(payload.nextGoalProb.noGoal)}</strong></div></div>
      <div class="inplay-wdl">全场 主<strong>${fmtPct(s.h)}</strong> 平<strong>${fmtPct(s.d)}</strong> 客<strong>${fmtPct(s.a)}</strong></div>
      <div class="inplay-windows"><div>5min 主${fmtPct(payload.window5min.win)} 平${fmtPct(payload.window5min.draw)} 客${fmtPct(payload.window5min.loss)}</div>
        <div>10min 主${fmtPct(payload.window10min.win)} 平${fmtPct(payload.window10min.draw)} 客${fmtPct(payload.window10min.loss)}</div>
        <div>20min 主${fmtPct(payload.window20min.win)} 平${fmtPct(payload.window20min.draw)} 客${fmtPct(payload.window20min.loss)}</div></div>`;
  } catch (e) { els.inPlayResult.innerHTML = `计算失败：${e.message}`; }
}

function toggleInPlay() {
  inPlayActive = !inPlayActive;
  if (inPlayActive) {
    els.inPlayToggleBtn.textContent = "停止";
    els.inPlayToggleBtn.style.background = "#c00";
    els.inPlayRefreshBtn.style.display = "inline-block";
    els.inPlayRefreshBtn.disabled = false;
    fetchLiveData();
    inPlayTimer = setInterval(fetchLiveData, 20000);
  } else {
    els.inPlayToggleBtn.textContent = "启动实时";
    els.inPlayToggleBtn.style.background = "";
    els.inPlayRefreshBtn.style.display = "none";
    els.inPlayRefreshBtn.disabled = true;
    els.inPlayResult.innerHTML = `<div style="color:#999;text-align:center;padding:12px">实时赛况已停止。</div>`;
    if (inPlayTimer) { clearInterval(inPlayTimer); inPlayTimer = null; }
  }
}

if (els.inPlayToggleBtn) els.inPlayToggleBtn.addEventListener("click", toggleInPlay);
if (els.inPlayRefreshBtn) els.inPlayRefreshBtn.addEventListener("click", fetchLiveData);

// Day plan in-play — auto-pick first live match from selected date
const dayInPlayEls = {
  panel: $("#dayInPlayPanel"),
  countdown: $("#dayInPlayCountdown"),
  toggleBtn: $("#dayInPlayToggleBtn"),
  refreshBtn: $("#dayInPlayRefreshBtn"),
  result: $("#dayInPlayResult"),
};
let dayInPlayActive = false;
let dayInPlayTimer = null;

function getFirstLiveMatch(matches) {
  const now = new Date();
  return matches.find(m => {
    if (!m.matchDate) return false;
    const ko = new Date(`${m.matchDate}T${String(m.matchTime || "00:00:00").slice(0, 8)}`);
    return (now - ko) / 60000 >= -5 && (now - ko) / 60000 <= 150;
  }) || null;
}

function updateDayInPlay(dayMatches) {
  if (!dayInPlayEls.panel) return; // not on day plan page
  const liveMatch = getFirstLiveMatch(dayMatches || []);
  if (!liveMatch) {
    if (dayInPlayEls.toggleBtn) dayInPlayEls.toggleBtn.disabled = true;
    if (dayInPlayEls.toggleBtn) dayInPlayEls.toggleBtn.textContent = "暂无进行中比赛";
    const next = (dayMatches || []).find(m => {
      if (!m.matchDate) return false;
      return new Date(`${m.matchDate}T${String(m.matchTime || "00:00:00").slice(0, 8)}`) > new Date();
    });
    if (next) {
      const ko = new Date(`${next.matchDate}T${String(next.matchTime || "00:00:00").slice(0, 8)}`);
      const h = Math.floor((ko - new Date()) / 3600000);
      const m = Math.floor(((ko - new Date()) % 3600000) / 60000);
      if (dayInPlayEls.countdown) dayInPlayEls.countdown.textContent = `${next.homeShort} vs ${next.awayShort} · ${h}h${m}m后开赛`;
    }
    return;
  }
  if (dayInPlayEls.countdown) dayInPlayEls.countdown.textContent = `${liveMatch.homeShort} vs ${liveMatch.awayShort} · 进行中`;
  if (!dayInPlayActive) {
    if (dayInPlayEls.toggleBtn) dayInPlayEls.toggleBtn.disabled = false;
    if (dayInPlayEls.toggleBtn) dayInPlayEls.toggleBtn.textContent = "启动实时";
  }
  dayInPlayEls.panel._liveMatch = liveMatch;
}

async function dayFetchLiveData() {
  if (!dayInPlayActive) return;
  const match = dayInPlayEls.panel._liveMatch;
  if (!match) return;
  try {
    let minutes = 0, h = 0, a = 0;
    const ko = new Date(`${match.matchDate}T${String(match.matchTime || "00:00:00").slice(0, 8)}`);
    minutes = Math.min(Math.max(0, Math.floor((new Date() - ko) / 60000)), 120);
    if (dayInPlayEls.countdown) dayInPlayEls.countdown.textContent = `${minutes}' ${h}-${a}`;
    const response = await fetch("/api/v32-inplay", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        match, research: state.researchByMatch[match.id] || null,
        controls: estimatedControlsForMatch(match),
        drawState: drawStateBeforeMatch(match),
        inPlay: { minutesPlayed: minutes, currentH: h, currentA: a },
      }),
    });
    const payload = await response.json();
    if (!payload.ok) throw new Error(payload.error);
    const ip = payload.inPlay;
    const s = payload.states;
    if (dayInPlayEls.result) dayInPlayEls.result.innerHTML = `
      <div class="inplay-stats"><div style="margin-bottom:4px">${minutes}' ${h}-${a}</div>
        <div>剩余λ <strong>主${ip.lambdaRemaining.home}</strong> <strong>客${ip.lambdaRemaining.away}</strong> · 衰减${(ip.decayFactor*100).toFixed(0)}%</div>
        <div>下一球 主<strong>${fmtPct(payload.nextGoalProb.home)}</strong> 客<strong>${fmtPct(payload.nextGoalProb.away)}</strong> 无<strong>${fmtPct(payload.nextGoalProb.noGoal)}</strong></div></div>
      <div class="inplay-wdl">全场 主<strong>${fmtPct(s.h)}</strong> 平<strong>${fmtPct(s.d)}</strong> 客<strong>${fmtPct(s.a)}</strong></div>
      <div class="inplay-windows"><div>5min 主${fmtPct(payload.window5min.win)} 平${fmtPct(payload.window5min.draw)} 客${fmtPct(payload.window5min.loss)}</div>
        <div>10min 主${fmtPct(payload.window10min.win)} 平${fmtPct(payload.window10min.draw)} 客${fmtPct(payload.window10min.loss)}</div>
        <div>20min 主${fmtPct(payload.window20min.win)} 平${fmtPct(payload.window20min.draw)} 客${fmtPct(payload.window20min.loss)}</div></div>`;
  } catch (e) { if (dayInPlayEls.result) dayInPlayEls.result.innerHTML = `计算失败：${e.message}`; }
}

function dayToggleInPlay() {
  dayInPlayActive = !dayInPlayActive;
  if (dayInPlayActive) {
    if (dayInPlayEls.toggleBtn) { dayInPlayEls.toggleBtn.textContent = "停止"; dayInPlayEls.toggleBtn.style.background = "#c00"; }
    if (dayInPlayEls.refreshBtn) dayInPlayEls.refreshBtn.style.display = "inline-block";
    dayFetchLiveData();
    dayInPlayTimer = setInterval(dayFetchLiveData, 20000);
  } else {
    if (dayInPlayEls.toggleBtn) { dayInPlayEls.toggleBtn.textContent = "启动实时"; dayInPlayEls.toggleBtn.style.background = ""; }
    if (dayInPlayEls.refreshBtn) dayInPlayEls.refreshBtn.style.display = "none";
    if (dayInPlayEls.result) dayInPlayEls.result.innerHTML = `<div style="color:#999;text-align:center;padding:12px">实时赛况已停止。</div>`;
    if (dayInPlayTimer) { clearInterval(dayInPlayTimer); dayInPlayTimer = null; }
  }
}

if (dayInPlayEls.toggleBtn) dayInPlayEls.toggleBtn.addEventListener("click", dayToggleInPlay);
if (dayInPlayEls.refreshBtn) dayInPlayEls.refreshBtn.addEventListener("click", dayFetchLiveData);

// Hook into renderDayPlan to update the in-play panel
const origRenderDayPlan = renderDayPlan;
renderDayPlan = function() {
  origRenderDayPlan();
  if (state.activeView !== "dayplan") return;
  const dayMatches = state.matches.filter(m => matchPlanDate(m) === state.dayPlan.date);
  updateDayInPlay(dayMatches);
};

const origRenderAll = renderAll;
let _renderAllGuard = false;
renderAll = function() {
  if (_renderAllGuard) return; // prevent re-entrant calls
  _renderAllGuard = true;
  origRenderAll();
  try {
    if (state.activeView === "workbench") showInPlayCountdown();
  } catch (e) { console.error('renderAll wrapper:', e.message); }
  _renderAllGuard = false;
};
els.parsePasteBtn.addEventListener("click", parsePastedJson);
els.dayPlanDateSelect.addEventListener("change", () => {
  state.dayPlan.date = els.dayPlanDateSelect.value;
  persistState();
  renderDayPlan();
});
els.dayPlanBudgetInput.addEventListener("input", () => {
  state.dayPlan.budget = Math.max(2, Math.floor((Number(els.dayPlanBudgetInput.value) || 0) / 2) * 2);
  persistState();
  renderDayPlan();
});
els.dayPlanGenerateBtn.addEventListener("click", generateDayPlan);
els.dayPlanExportBtn.addEventListener("click", exportDayPlanForAI);
els.dayPlanClearBtn.addEventListener("click", clearDayPlan);
els.simGenerateBtn.addEventListener("click", generateSimulation);
els.simFetchResultsBtn.addEventListener("click", syncSimulationResults);
els.simCLVBtn.addEventListener("click", captureClosingLine);
// API Key localStorage persistence
const tavilyKeyInput = $("#tavilyKeyInput");
const anySportKeyInput = $("#anySportKeyInput");
const saveKeysBtn = $("#saveKeysBtn");
if (tavilyKeyInput) tavilyKeyInput.value = localStorage.getItem("tavily_api_key") || "";
if (anySportKeyInput) anySportKeyInput.value = localStorage.getItem("anysport_api_key") || "";
if (saveKeysBtn) saveKeysBtn.addEventListener("click", () => {
  if (tavilyKeyInput) localStorage.setItem("tavily_api_key", tavilyKeyInput.value.trim());
  if (anySportKeyInput) localStorage.setItem("anysport_api_key", anySportKeyInput.value.trim());
  setStatus("API Key 已保存。");
});

const sportteryPopupBtn = $("#sportteryPopupBtn");
if (sportteryPopupBtn) sportteryPopupBtn.addEventListener("click", () => { window.open("https://m.sporttery.cn/mjc/jsq/zqzjq/", "sporttery_calc", "width=420,height=700,top=60,left=60"); });
els.simSettleBtn.addEventListener("click", settleSimulation);
els.simClearBtn.addEventListener("click", clearSimulation);
window.addEventListener("pagehide", sendPersistBeacon);
els.simulationFuture.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-fill-result]");
  if (button) settleSimulation(button.dataset.fillResult);
});

// playTabs removed in V4.0 — HAD/HHAD/TTG shown as scanner cards simultaneously
async function initializeApp() {
  await hydratePersistentState();
  setResearchExpanded(state.researchExpanded);
  setModelIoExpanded(state.modelIoExpanded);
  // playTabs removed in V4.0 — scanner cards replace per-play filtering
  setActiveView(state.activeView);
  renderAll();
  syncSporttery();
}

initializeApp();

// ── Collector Dashboard ────────────────────────────────────
const collectorEls = {
  bar: () => $("#collectorBar"),
  dot: () => $("#collectorDot"),
  text: () => $("#collectorText"),
  meta: () => $("#collectorMeta"),
};

let _collectorTimer = null;
async function pollCollectorStatus() {
  try {
    const resp = await fetch("/api/collector-status");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const s = await resp.json();

    const dot = collectorEls.dot();
    const text = collectorEls.text();
    const meta = collectorEls.meta();

    if (!dot || !text) return;

    // API health dot
    dot.className = "collector-dot";
    if (s.apiHealth === "200") dot.classList.add("ok");
    else if (s.apiHealth === "403") dot.classList.add("err");
    else if (s.apiHealth === "502") dot.classList.add("err");
    else dot.classList.add("idle");

    // Staleness check (>2h since last sync)
    const lastSync = s.lastSyncAt ? new Date(s.lastSyncAt) : null;
    const hoursAgo = lastSync ? (Date.now() - lastSync.getTime()) / 3600000 : 999;
    const stale = !lastSync || hoursAgo > 2;

    if (!lastSync) {
      dot.classList.add("idle"); // gray — waiting for first sync
      text.textContent = "采集器: 等待首次同步...";
      if (meta) meta.textContent = `API: ${s.apiHealth}`;
    } else if (stale) {
      dot.classList.add("warn");
      text.textContent = `采集器: 上次同步 ${hoursAgo.toFixed(1)}h 前 ⚠️`;
      if (meta) meta.textContent = `${s.totalRecords} 条 · +${s.lastSyncNewRecords} new`;
    } else {
      dot.classList.add("ok");
      text.textContent = `采集器: ${s.totalRecords} 条记录 · ${hoursAgo.toFixed(1)}h 前同步`;
      if (meta) meta.textContent = `API: ${s.apiHealth} | +${s.lastSyncNewRecords} new`;
    }
  } catch (e) {
    const dot = collectorEls.dot();
    if (dot) { dot.className = "collector-dot err"; }
    const text = collectorEls.text();
    if (text) textContent = "采集器: 离线";
  }
}

// Poll every 30s
pollCollectorStatus();
_collectorTimer = setInterval(pollCollectorStatus, 30000);
