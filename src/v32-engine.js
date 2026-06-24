const TEAM_DATA = {
  "mexico": { elo: 1820, fifa: 15, title: 0.01, qf: 0.172, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "south africa": { elo: 1660, fifa: 60, title: 0.0001, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "korea": { elo: 1805, fifa: 19, title: 0.003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "south korea": { elo: 1805, fifa: 19, title: 0.003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "czechia": { elo: 1765, fifa: 41, title: 0.001, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "czech republic": { elo: 1765, fifa: 41, title: 0.001, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "canada": { elo: 1745, fifa: 30, title: 0.001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "bosnia-herzegovina": { elo: 1740, fifa: 52, title: 0.0005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "bosnia": { elo: 1740, fifa: 52, title: 0.0005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "qatar": { elo: 1690, fifa: 35, title: 0.0003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "spain": { elo: 2090, fifa: 1, title: 0.165, qf: 0.482, semi: 0.339, confed: "UEFA", archetype: "unstable-low-block" },
  "argentina": { elo: 2047, fifa: 2, title: 0.12, qf: 0.458, semi: 0.305, confed: "CONMEBOL", archetype: "elite-finisher" },
  "france": { elo: 2041, fifa: 3, title: 0.15, qf: 0.475, semi: 0.304, confed: "UEFA", archetype: "elite-finisher" },
  "brazil": { elo: 1990, fifa: 5, title: 0.09, qf: 0.386, semi: 0.225, confed: "CONMEBOL", archetype: "unstable-low-block" },
  "scotland": { elo: 1760, fifa: 47, title: 0.0005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "haiti": { elo: 1550, fifa: 83, title: 0.00001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "athletic-resistance" },
  "england": { elo: 1974, fifa: 4, title: 0.11, qf: 0.421, semi: 0.201, confed: "UEFA", archetype: "high-depth" },
  "colombia": { elo: 1970, fifa: 9, title: 0.035, qf: 0.284, semi: 0, confed: "CONMEBOL", archetype: "mid-tier" },
  "portugal": { elo: 1967, fifa: 6, title: 0.07, qf: 0.352, semi: 0.184, confed: "UEFA", archetype: "unstable-low-block" },
  "netherlands": { elo: 1951, fifa: 7, title: 0.04, qf: 0.315, semi: 0.158, confed: "UEFA", archetype: "high-depth" },
  "germany": { elo: 1940, fifa: 10, title: 0.11, qf: 0.338, semi: 0.142, confed: "UEFA", archetype: "elite-finisher" },
  "morocco": { elo: 1918, fifa: 8, title: 0.015, qf: 0.267, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "croatia": { elo: 1895, fifa: 11, title: 0.007, qf: 0.153, semi: 0, confed: "UEFA", archetype: "tactical-resistance" },
  "uruguay": { elo: 1882, fifa: 13, title: 0.008, qf: 0.195, semi: 0, confed: "CONMEBOL", archetype: "unstable-low-block" },
  "switzerland": { elo: 1868, fifa: 14, title: 0.005, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "japan": { elo: 1845, fifa: 15, title: 0.012, qf: 0.185, semi: 0, confed: "AFC", archetype: "tactical-resistance" },
  "senegal": { elo: 1832, fifa: 12, title: 0.004, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "iran": { elo: 1818, fifa: 17, title: 0.0015, qf: 0, semi: 0, confed: "AFC", archetype: "athletic-resistance" },
  "ecuador": { elo: 1798, fifa: 20, title: 0.005, qf: 0, semi: 0, confed: "CONMEBOL", archetype: "athletic-resistance" },
  "australia": { elo: 1785, fifa: 21, title: 0.002, qf: 0, semi: 0, confed: "AFC", archetype: "athletic-resistance" },
  "turkiye": { elo: 1790, fifa: 42, title: 0.0015, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "turkey": { elo: 1790, fifa: 42, title: 0.0015, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "paraguay": { elo: 1765, fifa: 64, title: 0.0005, qf: 0, semi: 0, confed: "CONMEBOL", archetype: "athletic-resistance" },
  "austria": { elo: 1780, fifa: 16, title: 0.0015, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "belgium": { elo: 1855, fifa: 9, title: 0.01, qf: 0.243, semi: 0, confed: "UEFA", archetype: "unstable-low-block" },
  "united states": { elo: 1810, fifa: 16, title: 0.009, qf: 0.168, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "usa": { elo: 1810, fifa: 16, title: 0.009, qf: 0.168, semi: 0, confed: "CONCACAF", archetype: "mid-tier" },
  "ghana": { elo: 1690, fifa: 65, title: 0.00015, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "panama": { elo: 1660, fifa: 53, title: 0.00001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "athletic-resistance" },
  "uzbekistan": { elo: 1710, fifa: 62, title: 0.00005, qf: 0, semi: 0, confed: "AFC", archetype: "athletic-resistance" },
  "dr congo": { elo: 1680, fifa: 51, title: 0.0002, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "congo dr": { elo: 1680, fifa: 51, title: 0.0002, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "egypt": { elo: 1760, fifa: 34, title: 0.001, qf: 0, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "ivory coast": { elo: 1740, fifa: 44, title: 0.0008, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "curacao": { elo: 1500, fifa: 81, title: 0.00001, qf: 0, semi: 0, confed: "CONCACAF", archetype: "athletic-resistance" },
  "sweden": { elo: 1770, fifa: 39, title: 0.001, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "tunisia": { elo: 1720, fifa: 40, title: 0.0005, qf: 0, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "new zealand": { elo: 1600, fifa: 95, title: 0.00001, qf: 0, semi: 0, confed: "OFC", archetype: "mid-tier" },
  "saudi arabia": { elo: 1665, fifa: 57, title: 0.0002, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "cape verde": { elo: 1650, fifa: 70, title: 0.00005, qf: 0, semi: 0, confed: "CAF", archetype: "athletic-resistance" },
  "norway": { elo: 1860, fifa: 18, title: 0.006, qf: 0.12, semi: 0, confed: "UEFA", archetype: "high-depth" },
  "iraq": { elo: 1660, fifa: 61, title: 0.00005, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  "algeria": { elo: 1725, fifa: 36, title: 0.0006, qf: 0, semi: 0, confed: "CAF", archetype: "tactical-resistance" },
  "jordan": { elo: 1605, fifa: 68, title: 0.00003, qf: 0, semi: 0, confed: "AFC", archetype: "mid-tier" },
  // Finnish league teams (patch)
  "lahti": { elo: 1580, fifa: 200, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "tps turku": { elo: 1550, fifa: 210, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "kuopio": { elo: 1620, fifa: 180, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "athletic-resistance" },
  "vaasa": { elo: 1600, fifa: 190, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "ac oulu": { elo: 1540, fifa: 205, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "jaro": { elo: 1520, fifa: 215, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "inter turku": { elo: 1640, fifa: 170, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "athletic-resistance" },
  "seinajoen": { elo: 1560, fifa: 195, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "mariehamn": { elo: 1500, fifa: 235, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "mid-tier" },
  "hjk helsinki": { elo: 1700, fifa: 140, title: 0, qf: 0, semi: 0, confed: "UEFA", archetype: "athletic-resistance" },
};

const S_FINISHERS = new Set(["france", "argentina", "germany"]);
const HIGH_DEPTH_FAVORITES = new Set(["england", "netherlands", "norway"]);
const UNSTABLE_LOW_BLOCK_FAVORITES = new Set(["portugal", "spain", "belgium", "uruguay"]);
// P7: physical-resistance split into athletic (raw physicality) and tactical (discipline/organisation)
const ATHLETIC_RESISTANCE = new Set(["dr congo", "congo dr", "senegal", "ivory coast", "panama"]);
const TACTICAL_RESISTANCE = new Set(["morocco", "croatia", "egypt", "japan"]);
const AGING_DEFENSE_TEAMS = new Set(["croatia"]);

const GROUP_DATA = {
  "mexico": { group: "A", first: 0.478, second: 0.25, third: 0.092, qualify: 0.82 },
  "korea": { group: "A", first: 0.22, second: 0.30, third: 0.15, qualify: 0.67 },
  "south korea": { group: "A", first: 0.22, second: 0.30, third: 0.15, qualify: 0.67 },
  "czechia": { group: "A", first: 0.15, second: 0.20, third: 0.20, qualify: 0.55 },
  "czech republic": { group: "A", first: 0.15, second: 0.20, third: 0.20, qualify: 0.55 },
  "south africa": { group: "A", first: 0.05, second: 0.10, third: 0.18, qualify: 0.33 },
  "switzerland": { group: "B", first: 0.40, second: 0.28, third: 0.12, qualify: 0.78 },
  "canada": { group: "B", first: 0.18, second: 0.22, third: 0.15, qualify: 0.55 },
  "bosnia-herzegovina": { group: "B", first: 0.15, second: 0.20, third: 0.18, qualify: 0.53 },
  "bosnia": { group: "B", first: 0.15, second: 0.20, third: 0.18, qualify: 0.53 },
  "qatar": { group: "B", first: 0.08, second: 0.12, third: 0.15, qualify: 0.35 },
  "brazil": { group: "C", first: 0.602, second: 0.25, third: 0.08, qualify: 0.92 },
  "morocco": { group: "C", first: 0.286, second: 0.45, third: 0.151, qualify: 0.887 },
  "scotland": { group: "C", first: 0.098, second: 0.22, third: 0.28, qualify: 0.60 },
  "haiti": { group: "C", first: 0.011, second: 0.03, third: 0.15, qualify: 0.19 },
  "united states": { group: "D", first: 0.328, second: 0.28, third: 0.15, qualify: 0.75 },
  "usa": { group: "D", first: 0.328, second: 0.28, third: 0.15, qualify: 0.75 },
  "australia": { group: "D", first: 0.179, second: 0.25, third: 0.18, qualify: 0.61 },
  "turkiye": { group: "D", first: 0.20, second: 0.22, third: 0.16, qualify: 0.58 },
  "turkey": { group: "D", first: 0.20, second: 0.22, third: 0.16, qualify: 0.58 },
  "paraguay": { group: "D", first: 0.08, second: 0.10, third: 0.15, qualify: 0.33 },
  "germany": { group: "E", first: 0.69, second: 0.25, third: 0.04, qualify: 0.994 },
  "ecuador": { group: "E", first: 0.20, second: 0.45, third: 0.18, qualify: 0.83 },
  "ivory coast": { group: "E", first: 0.08, second: 0.15, third: 0.25, qualify: 0.48 },
  "curacao": { group: "E", first: 0.01, second: 0.03, third: 0.10, qualify: 0.14 },
  "netherlands": { group: "F", first: 0.55, second: 0.20, third: 0.12, qualify: 0.87 },
  "japan": { group: "F", first: 0.25, second: 0.30, third: 0.18, qualify: 0.73 },
  "sweden": { group: "F", first: 0.10, second: 0.22, third: 0.28, qualify: 0.60 },
  "tunisia": { group: "F", first: 0.05, second: 0.10, third: 0.18, qualify: 0.33 },
  "belgium": { group: "G", first: 0.45, second: 0.28, third: 0.12, qualify: 0.85 },
  "egypt": { group: "G", first: 0.20, second: 0.22, third: 0.18, qualify: 0.60 },
  "iran": { group: "G", first: 0.15, second: 0.20, third: 0.18, qualify: 0.53 },
  "new zealand": { group: "G", first: 0.05, second: 0.08, third: 0.12, qualify: 0.25 },
  "spain": { group: "H", first: 0.753, second: 0.18, third: 0.04, qualify: 0.973 },
  "uruguay": { group: "H", first: 0.18, second: 0.50, third: 0.17, qualify: 0.85 },
  "saudi arabia": { group: "H", first: 0.05, second: 0.15, third: 0.22, qualify: 0.42 },
  "cape verde": { group: "H", first: 0.02, second: 0.05, third: 0.15, qualify: 0.22 },
  "france": { group: "I", first: 0.603, second: 0.22, third: 0.08, qualify: 0.903 },
  "senegal": { group: "I", first: 0.15, second: 0.28, third: 0.22, qualify: 0.65 },
  "norway": { group: "I", first: 0.12, second: 0.20, third: 0.23, qualify: 0.55 },
  "iraq": { group: "I", first: 0.03, second: 0.05, third: 0.12, qualify: 0.20 },
  "argentina": { group: "J", first: 0.73, second: 0.18, third: 0.05, qualify: 0.96 },
  "austria": { group: "J", first: 0.12, second: 0.30, third: 0.23, qualify: 0.65 },
  "algeria": { group: "J", first: 0.08, second: 0.15, third: 0.22, qualify: 0.45 },
  "jordan": { group: "J", first: 0.03, second: 0.10, third: 0.18, qualify: 0.31 },
  "portugal": { group: "K", first: 0.736, second: 0.20, third: 0.041, qualify: 0.977 },
  "colombia": { group: "K", first: 0.18, second: 0.38, third: 0.22, qualify: 0.78 },
  "uzbekistan": { group: "K", first: 0.05, second: 0.12, third: 0.25, qualify: 0.42 },
  "dr congo": { group: "K", first: 0.02, second: 0.05, third: 0.15, qualify: 0.22 },
  "congo dr": { group: "K", first: 0.02, second: 0.05, third: 0.15, qualify: 0.22 },
  "england": { group: "L", first: 0.679, second: 0.18, third: 0.06, qualify: 0.919 },
  "croatia": { group: "L", first: 0.15, second: 0.38, third: 0.27, qualify: 0.80 },
  "ghana": { group: "L", first: 0.07, second: 0.15, third: 0.22, qualify: 0.44 },
  "panama": { group: "L", first: 0.03, second: 0.08, third: 0.15, qualify: 0.26 },
};

const PROFILES = {
  default: { n: 0.67, l: 0.23, c: 0.10 },
  "elite-finisher": { n: 0.62, l: 0.20, c: 0.18 },
  "defensive-favorite": { n: 0.60, l: 0.30, c: 0.10 },
  balanced: { n: 0.58, l: 0.27, c: 0.15 },
};

// ===== P1: Opponent Interaction Matrix (archetype × archetype → Δwin_pp, Δdraw_pp) =====
const INTERACTION_MATRIX = {
  "S-finisher": {
    "S-finisher": [0, 0], "high-depth": [0.02, -0.03], "unstable-low-block": [-0.04, 0.05],
    "athletic-resistance": [-0.03, 0.05], "tactical-resistance": [-0.01, 0.03], "mid-tier": [0.04, -0.03],
  },
  "high-depth": {
    "S-finisher": [-0.03, 0.02], "high-depth": [0.01, -0.01], "unstable-low-block": [-0.05, 0.06],
    "athletic-resistance": [0.01, 0.04], "tactical-resistance": [0.03, 0.02], "mid-tier": [0.03, -0.02],
  },
  "unstable-low-block": {
    "S-finisher": [-0.06, 0.05], "high-depth": [-0.04, 0.04], "unstable-low-block": [0, 0.02],
    "athletic-resistance": [-0.04, 0.07], "tactical-resistance": [-0.03, 0.05], "mid-tier": [0.02, -0.02],
  },
  "athletic-resistance": {
    "S-finisher": [-0.06, 0.07], "high-depth": [-0.05, 0.06], "unstable-low-block": [-0.04, 0.06],
    "athletic-resistance": [0.01, 0.04], "tactical-resistance": [0.01, 0.02], "mid-tier": [-0.03, 0.05],
  },
  "tactical-resistance": {
    "S-finisher": [-0.04, 0.05], "high-depth": [-0.03, 0.04], "unstable-low-block": [-0.03, 0.05],
    "athletic-resistance": [-0.01, 0.03], "tactical-resistance": [0, 0.03], "mid-tier": [-0.01, 0.03],
  },
  "mid-tier": {
    "S-finisher": [-0.06, 0.04], "high-depth": [-0.05, 0.03], "unstable-low-block": [-0.03, 0.04],
    "athletic-resistance": [-0.03, 0.06], "tactical-resistance": [-0.02, 0.04], "mid-tier": [0, 0.01],
  },
};

// ===== P6: Empirical Calibration Bins (2018+2022, Brier 0.198, ECE 3.2pp) =====
const CALIBRATION_BINS = [
  [0.00, 0.10, 2.9], [0.10, 0.20, -0.7], [0.20, 0.30, 0], [0.30, 0.40, 1.8],
  [0.40, 0.50, -3.3], [0.50, 0.60, 7.5], [0.60, 0.70, 1.7], [0.70, 0.80, 0],
  [0.80, 0.90, 15.0], [0.90, 1.00, 5.0],
];

// P6 calibration bins ... (continued below)

// ===== P8: Match stage multipliers =====
const STAGE_MULTIPLIERS = {
  group:         { penalty: 1.00, surge: 1.00 },
  round_of_32:   { penalty: 1.10, surge: 0.90 },
  round_of_16:   { penalty: 1.15, surge: 0.85 },
  quarter:       { penalty: 1.20, surge: 0.82 },
  semi:          { penalty: 1.25, surge: 0.80 },
  final:         { penalty: 1.25, surge: 0.80 },
};

// ===== P9: Group-stage round-3 motivation modifiers =====
const MOTIVATION_MODIFIERS = {
  neutral:            { lambdaScale: 1.00, penaltyScale: 1.00 },
  already_qualified:  { lambdaScale: 0.88, penaltyScale: 0.70 },
  must_win:           { lambdaScale: 1.08, penaltyScale: 0.60 },
  draw_enough:        { lambdaScale: 0.90, penaltyScale: 1.35 },
};

const CRS_KEYS = [
  ["s01s00", 1, 0], ["s02s00", 2, 0], ["s02s01", 2, 1], ["s03s00", 3, 0],
  ["s03s01", 3, 1], ["s03s02", 3, 2], ["s04s00", 4, 0], ["s04s01", 4, 1],
  ["s04s02", 4, 2], ["s05s00", 5, 0], ["s05s01", 5, 1], ["s05s02", 5, 2],
  ["s00s00", 0, 0], ["s01s01", 1, 1], ["s02s02", 2, 2], ["s03s03", 3, 3],
  ["s00s01", 0, 1], ["s00s02", 0, 2], ["s01s02", 1, 2], ["s00s03", 0, 3],
  ["s01s03", 1, 3], ["s02s03", 2, 3], ["s00s04", 0, 4], ["s01s04", 1, 4],
  ["s02s04", 2, 4], ["s00s05", 0, 5], ["s01s05", 1, 5], ["s02s05", 2, 5],
];

// ===== Phase 2.2: In-Play Dynamic Poisson Engine =====

function decayLambda(lambdaFull, minutesPlayed, totalMinutes = 90) {
  // Non-linear time decay with injury-time tail boost (Weibull-like)
  const remaining = Math.max(1, totalMinutes - minutesPlayed);
  const linear = lambdaFull * (remaining / totalMinutes);
  // Tail boost: last 15 minutes have ~1.3x effective scoring rate
  const tailBoost = remaining <= 15 ? 1 + 0.3 * ((15 - remaining) / 15) : 1.0;
  // First 5 minutes also slightly suppressed (teams settling)
  const earlySuppress = minutesPlayed < 5 ? 0.85 : 1.0;
  return linear * tailBoost * earlySuppress;
}

function buildInPlayScoreMatrix(lambdaHomeFull, lambdaAwayFull, currentH, currentA, minutesPlayed, profileName, maxGoals = 5) {
  // Truncated score matrix for remaining time
  const profile = PROFILES[profileName] || PROFILES.default;
  const lambdaH_rem = decayLambda(lambdaHomeFull, minutesPlayed);
  const lambdaA_rem = decayLambda(lambdaAwayFull, minutesPlayed);
  const scores = [];
  let total = 0;
  const homeFav = lambdaH_rem >= lambdaA_rem;
  const states = [
    { weight: profile.n, h: lambdaH_rem, a: lambdaA_rem },
    { weight: profile.l, h: 0.82 * lambdaH_rem, a: 0.82 * lambdaA_rem },
    { weight: profile.c, h: homeFav ? 1.35 * lambdaH_rem : 0.90 * lambdaH_rem, a: homeFav ? 0.90 * lambdaA_rem : 1.35 * lambdaA_rem },
  ];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      const prob = states.reduce((sum, s) => sum + s.weight * poisson(h, s.h) * poisson(a, s.a), 0);
      // Truncate: can't score fewer than current score (if any)
      const finalH = currentH + h;
      const finalA = currentA + a;
      scores.push({ h: finalH, a: finalA, prob });
      total += prob;
    }
  }
  return scores.map(s => ({ ...s, prob: s.prob / (total || 1) }));
}

export function buildInPlayModel({ match = {}, research = null, controls = {}, drawState = {}, inPlay = {} }) {
  // inPlay: { minutesPlayed, currentH, currentA }
  const minutesPlayed = Number(inPlay.minutesPlayed) || 0;
  const currentH = Number(inPlay.currentH) || 0;
  const currentA = Number(inPlay.currentA) || 0;

  // Use the full pre-match model to get base lambdas and profile
  const preModel = buildFullV32Model({ match, research, controls, drawState });
  const baseLambdas = preModel.model.meta.lambdas || { home: 1.3, away: 1.0 };
  const profile = preModel.model.meta.profile || "default";
  const tempoFactor = preModel.model.meta.tempo === "slow" ? 0.9 : preModel.model.meta.tempo === "open" ? 1.08 : 1;

  const lambdaHomeFull = baseLambdas.home * tempoFactor;
  const lambdaAwayFull = baseLambdas.away * tempoFactor;
  const lambdaH_rem = decayLambda(lambdaHomeFull, minutesPlayed);
  const lambdaA_rem = decayLambda(lambdaAwayFull, minutesPlayed);

  const scores = buildInPlayScoreMatrix(lambdaHomeFull, lambdaAwayFull, currentH, currentA, minutesPlayed, profile);
  const states = sumStates(scores);

  return {
    ok: true,
    modelVersion: "World Cup V3.3 r6 In-Play",
    inPlay: {
      minutesPlayed,
      currentScore: { h: currentH, a: currentA },
      lambdaRemaining: { home: +lambdaH_rem.toFixed(4), away: +lambdaA_rem.toFixed(4) },
      lambdaFull: { home: +lambdaHomeFull.toFixed(2), away: +lambdaAwayFull.toFixed(2) },
      decayFactor: +(minutesPlayed > 0 ? lambdaH_rem / lambdaHomeFull : 1).toFixed(3),
    },
    states,
    nextGoalProb: {
      home: scores.filter(s => s.h > currentH && s.a === currentA).reduce((sum, s) => sum + s.prob, 0),
      away: scores.filter(s => s.a > currentA && s.h === currentH).reduce((sum, s) => sum + s.prob, 0),
      noGoal: scores.filter(s => s.h === currentH && s.a === currentA).reduce((sum, s) => sum + s.prob, 0),
    },
    // Upcoming events in 5-min windows
    window5min: buildTimeWindow(scores, currentH, currentA, minutesPlayed, 5),
    window10min: buildTimeWindow(scores, currentH, currentA, minutesPlayed, 10),
    window20min: buildTimeWindow(scores, currentH, currentA, minutesPlayed, 20),
  };
}

function buildTimeWindow(scores, currentH, currentA, minutesPlayed, windowMin) {
  // Approximate: scale remaining score probabilities by window ratio
  const remaining = Math.max(1, 90 - minutesPlayed);
  const ratio = Math.min(1, windowMin / remaining);
  // Return WDL for the time window
  const win = scores.filter(s => s.h > s.a).reduce((sum, s) => sum + s.prob * ratio, 0);
  const draw = scores.filter(s => s.h === s.a).reduce((sum, s) => sum + s.prob, 0);
  const loss = scores.filter(s => s.h < s.a).reduce((sum, s) => sum + s.prob * ratio, 0);
  return { win: +win.toFixed(4), draw: +draw.toFixed(4), loss: +(1 - win - draw).toFixed(4) };
}

export function buildFullV32Model({ match = {}, research = null, controls = {}, drawState = {} }) {
  const homeKey = normalizeTeam(match.home || match.homeShort || "");
  const awayKey = normalizeTeam(match.away || match.awayShort || "");
  const home = teamProfile(homeKey);
  const away = teamProfile(awayKey);
  const market = marketFullTimeProbabilities(match);
  const text = researchText(research);
  const matchStage = controls.matchStage || "group";
  const motivation = controls.motivation || "neutral";
  const stageMul = STAGE_MULTIPLIERS[matchStage] || STAGE_MULTIPLIERS.group;
  const motivMod = MOTIVATION_MODIFIERS[motivation] || MOTIVATION_MODIFIERS.neutral;
  const signals = extractSignals(text, homeKey, awayKey, market, stageMul, motivMod);
  // Phase 1.1: LLM/Research penalty feedback — modify lambda from structured research parsing
  const researchPenalty = parseResearchPenalty(research);
  signals.researchPenalty = researchPenalty;
  const strength = buildStrength(home, away, market, signals);
  const sij = strength.home.baseStrength - strength.away.baseStrength;
  const p0 = buildP0({ home, away, market, sij, signals });
  const correction = buildCorrections({ p0, sij, home, away, signals, controls, drawState });
  const profile = chooseProfile({ controls, home, away, p0, signals });
  const lambdas = chooseLambdas({ sij, p0, controls, signals, motivMod, profileName: profile });
  const tempo = chooseTempo({ controls, signals });
  const tempoFactor = tempo === "slow" ? 0.9 : tempo === "open" ? 1.08 : 1;
  const scores = buildScoreMatrix(lambdas.home * tempoFactor, lambdas.away * tempoFactor, profile);
  const states = sumStates(scores);
  const byPlay = buildPlayProbabilities(scores, match, profile, tempoFactor, lambdas, signals);

  // r6: circuit breaker — upper bound protection for favorites
  // fav_win ≥ max(base_win − 8pp, 40%) prevents probability inversion
  // e.g. Belgium's win rate cannot be pushed below 40% or below P0−8pp
  const baseWin = p0.h >= p0.a ? p0.h : p0.a;
  const baseFavSide = p0.h >= p0.a ? "h" : "a";
  const favWinFromMatrix = baseFavSide === "h" ? states.h : states.a;
  const floorWin = Math.max(baseWin - 0.08, 0.40);
  let circuitBreakerFired = false;
  let finalStates = states;
  if (favWinFromMatrix < floorWin && signals.interactionLambdaMultipliers?.favorite < 0.94) {
    // λ multipliers pushed the favorite too far — clamp states to floor
    const dogSide = baseFavSide === "h" ? "a" : "h";
    const dogWinFromMatrix = baseFavSide === "h" ? states.a : states.h;
    const drawFromMatrix = states.d;
    const excessDraw = floorWin - favWinFromMatrix;
    finalStates = normalizeWdl({
      h: baseFavSide === "h" ? floorWin : dogWinFromMatrix - excessDraw * 0.5,
      d: drawFromMatrix - excessDraw * 0.3,
      a: baseFavSide === "a" ? floorWin : dogWinFromMatrix - excessDraw * 0.5,
    });
    circuitBreakerFired = true;
  }
  byPlay.had = finalStates;

  const empiricalPreview = calibrateWdlBins(states);
  const empiricalWdl = {
    ...empiricalPreview,
    applied: false,
    note: "Preview only. V3.3 r5 keeps WDL, handicap, total goals and HT/FT lambda-consistent from the same Poisson matrix.",
  };

  const finalGrade = gradeMatch(finalStates, correction.dataCompleteness);

  return {
    ok: true,
    modelVersion: "World Cup V3.3 r6 (lambda-multiplier + circuit-breaker + mid-tier-hybrid + danger-zone-selector)",
    model: {
      scores,
      states: finalStates,
      byPlay,
      meta: {
        source: "skill-imported-v33-review-adjusted-r5",
        home: { key: homeKey, ...home },
        away: { key: awayKey, ...away },
        layers: {
          p0,
          correction,
          strength,
          market,
          signals,
        },
        lambdas: { home: lambdas.home * tempoFactor, away: lambdas.away * tempoFactor },
        profile,
        tempo,
        grade: finalGrade,
        r6CircuitBreaker: { fired: circuitBreakerFired, floorWin, baseWin, matrixWin: favWinFromMatrix },
        matchStage,
        motivation,
        stageMultipliers: stageMul,
        motivationModifiers: motivMod,
        empiricalCalibration: empiricalWdl,
        references: [
          "model/world-cup-v32/references/model-core.md",
          "model/world-cup-v32/references/pdf-baselines.md",
          "model/world-cup-v32/references/groups-and-matches.md",
          "model/world-cup-v32/references/environment-and-upsets.md",
          "model/world-cup-v32/references/dynamic-review-and-calibration.md",
          "model/world-cup-v32/references/v33-review-adjustments.md",
          "model/world-cup-v32/scripts/world_cup_v32_helpers.py",
        ],
        notes: buildNotes({ home, away, p0, correction, signals, profile, tempo }),
      },
    },
  };
}

// ===== P6: Empirical calibration from 2018+2022 bins =====
function calibrateWdlBins(states) {
  const win = empiricalCalibrate(states.h);
  const draw = empiricalCalibrate(states.d);
  const loss = empiricalCalibrate(states.a);
  const total = win.calibrated + draw.calibrated + loss.calibrated;
  return {
    preCalibration: { h: states.h, d: states.d, a: states.a },
    calibrated: normalizeWdl({
      h: win.calibrated / total,
      d: draw.calibrated / total,
      a: loss.calibrated / total,
    }),
    detail: {
      win: { raw: win.raw, calibrated: win.calibrated, bin: win.bin, biasPp: win.biasPp },
      draw: { raw: draw.raw, calibrated: draw.calibrated, bin: draw.bin, biasPp: draw.biasPp },
      loss: { raw: loss.raw, calibrated: loss.calibrated, bin: loss.bin, biasPp: loss.biasPp },
    },
  };
}

function empiricalCalibrate(p) {
  for (const [lo, hi, bias] of CALIBRATION_BINS) {
    if (p >= lo && p < hi) {
      return {
        raw: p,
        calibrated: clamp(p + bias / 100, 0, 1),
        bin: `${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}%`,
        biasPp: bias,
      };
    }
    if (hi >= 1 && p >= lo) {
      return {
        raw: p,
        calibrated: clamp(p + bias / 100, 0, 1),
        bin: `${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}%`,
        biasPp: bias,
      };
    }
  }
  return { raw: p, calibrated: p, bin: "out-of-range", biasPp: 0 };
}

function normalizeTeam(name) {
  const raw = String(name || "").trim();
  const aliasText = raw
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[()（）·.]/g, "")
    .trim();
  const compactAlias = aliasText.replace(/\s+/g, "");
  const aliases = [
    ["mexico", ["mexico", "墨西哥"]],
    ["south africa", ["southafrica", "南非"]],
    ["korea", ["korea", "southkorea", "韩国", "韓國"]],
    ["czechia", ["czechia", "czechrepublic", "捷克"]],
    ["switzerland", ["switzerland", "瑞士"]],
    ["canada", ["canada", "加拿大"]],
    ["bosnia-herzegovina", ["bosniaherzegovina", "bosnia", "波黑", "波斯尼亚"]],
    ["qatar", ["qatar", "卡塔尔"]],
    ["brazil", ["brazil", "巴西"]],
    ["morocco", ["morocco", "摩洛哥"]],
    ["scotland", ["scotland", "苏格兰", "蘇格蘭"]],
    ["haiti", ["haiti", "海地"]],
    ["united states", ["unitedstates", "usa", "usmnt", "美国", "美國"]],
    ["australia", ["australia", "澳大利亚", "澳洲"]],
    ["turkiye", ["turkiye", "turkey", "土耳其"]],
    ["paraguay", ["paraguay", "巴拉圭"]],
    ["germany", ["germany", "德国", "德國"]],
    ["ecuador", ["ecuador", "厄瓜多尔", "厄瓜多爾"]],
    ["ivory coast", ["ivorycoast", "cotedivoire", "côtedivoire", "科特迪瓦"]],
    ["curacao", ["curacao", "curaçao", "库拉索", "庫拉索"]],
    ["netherlands", ["netherlands", "holland", "荷兰", "荷蘭"]],
    ["japan", ["japan", "日本"]],
    ["sweden", ["sweden", "瑞典"]],
    ["tunisia", ["tunisia", "突尼斯"]],
    ["belgium", ["belgium", "比利时", "比利時"]],
    ["egypt", ["egypt", "埃及"]],
    ["iran", ["iran", "伊朗"]],
    ["new zealand", ["newzealand", "新西兰", "紐西蘭"]],
    ["spain", ["spain", "西班牙"]],
    ["uruguay", ["uruguay", "乌拉圭", "烏拉圭"]],
    ["saudi arabia", ["saudiarabia", "沙特阿拉伯", "沙特"]],
    ["cape verde", ["capeverde", "佛得角"]],
    ["france", ["france", "法国", "法國"]],
    ["senegal", ["senegal", "塞内加尔", "塞內加爾"]],
    ["norway", ["norway", "挪威"]],
    ["iraq", ["iraq", "伊拉克"]],
    ["argentina", ["argentina", "阿根廷"]],
    ["austria", ["austria", "奥地利", "奧地利"]],
    ["algeria", ["algeria", "阿尔及利亚", "阿爾及利亞"]],
    ["jordan", ["jordan", "约旦", "約旦"]],
    ["portugal", ["portugal", "葡萄牙"]],
    ["colombia", ["colombia", "哥伦比亚", "哥倫比亞"]],
    ["uzbekistan", ["uzbekistan", "乌兹别克斯坦", "烏茲別克斯坦"]],
    ["dr congo", ["drcongo", "congodr", "drc", "刚果金", "刚果民主共和国", "刚果"]],
    ["england", ["england", "英格兰", "英格蘭"]],
    ["croatia", ["croatia", "克罗地亚", "克羅地亞"]],
    ["ghana", ["ghana", "加纳", "迦納"]],
    ["panama", ["panama", "巴拿马", "巴拿馬"]],
  ];
  const aliasHit = aliases.find(([, names]) => names.includes(compactAlias) || names.includes(aliasText));
  if (aliasHit) return aliasHit[0];
  const text = String(name || "").toLowerCase();
  if (/葡萄牙|portugal/.test(text)) return "portugal";
  if (/刚果|剛果|dr congo|congo dr|drc/.test(text)) return "dr congo";
  if (/英格兰|英格蘭|england/.test(text)) return "england";
  if (/克罗地亚|克羅地亞|croatia/.test(text)) return "croatia";
  if (/加纳|迦納|ghana/.test(text)) return "ghana";
  if (/巴拿马|巴拿馬|panama/.test(text)) return "panama";
  if (/乌兹别克|烏茲別克|uzbekistan/.test(text)) return "uzbekistan";
  if (/哥伦比亚|哥倫比亞|colombia/.test(text)) return "colombia";
  if (/巴西|brazil/.test(text)) return "brazil";
  if (/瑞士|switzerland/.test(text)) return "switzerland";
  if (/加拿大|canada/.test(text)) return "canada";
  if (/波黑|bosnia/.test(text)) return "bosnia-herzegovina";
  if (/卡塔尔|qatar/.test(text)) return "qatar";
  if (/苏格兰|scotland/.test(text)) return "scotland";
  if (/摩洛哥|morocco/.test(text)) return "morocco";
  if (/海地|haiti/.test(text)) return "haiti";
  // Finnish teams
  if (/拉赫蒂|lahti/i.test(text)) return "lahti";
  if (/TPS|tps|图尔库/i.test(text)) return "tps turku";
  if (/库奥皮奥|kuopio/i.test(text)) return "kuopio";
  if (/瓦萨|vaasa/i.test(text)) return "vaasa";
  if (/奥卢|oulu/i.test(text)) return "ac oulu";
  if (/雅罗|jaro/i.test(text)) return "jaro";
  if (/国际图尔|inter turku/i.test(text)) return "inter turku";
  if (/塞伊奈|seinajoen/i.test(text)) return "seinajoen";
  if (/玛丽港|mariehamn/i.test(text)) return "mariehamn";
  if (/赫尔辛基|helsinki/i.test(text)) return "hjk helsinki";
  return text.trim();
}

function teamProfile(key) {
  const base = TEAM_DATA[key] || { elo: 1700, fifa: 60, title: 0.0005, qf: 0, semi: 0, confed: "mixed", archetype: "unknown" };
  return { ...base, v33Class: teamClass(key), group: GROUP_DATA[key] || null };
}

function marketFullTimeProbabilities(match) {
  const hafu = impliedMap(match?.pools?.hafu || []);
  const had = impliedMap(match?.pools?.had || []);
  if (Object.keys(hafu).length) {
    return normalizeWdl({
      h: (hafu.hh || 0) + (hafu.dh || 0) + (hafu.ah || 0),
      d: (hafu.hd || 0) + (hafu.dd || 0) + (hafu.ad || 0),
      a: (hafu.ha || 0) + (hafu.da || 0) + (hafu.aa || 0),
    });
  }
  return normalizeWdl({ h: had.h || 0.42, d: had.d || 0.27, a: had.a || 0.31 });
}

function impliedMap(items) {
  const inv = items.map((item) => ({ key: item.key, prob: 1 / item.odds })).filter((item) => Number.isFinite(item.prob));
  const total = inv.reduce((sum, item) => sum + item.prob, 0) || 1;
  return Object.fromEntries(inv.map((item) => [item.key, item.prob / total]));
}

function researchText(research) {
  return (research?.categories || [])
    .map((category) => [category.answer, ...(category.results || []).flatMap((item) => [item.title, item.snippet, item.url])]
      .filter(Boolean).join(" "))
    .join(" ")
    .toLowerCase();
}

function parseResearchPenalty(research) {
  // Parse structured penalty from research text — feeds back into model lambda
  const penalties = [];
  const allText = researchText(research);
  if (!allText) return null;  // null → falsy, prevents NaN propagation in applyV33LambdaAdjustments

  const patterns = [
    // Injury/absence → attacker/defender lambda penalty
    { regex: /(key|star|top|核心|主力)\s+(striker|forward|winger|attacker|射手|前锋|边锋|攻击手|中锋)\s+(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "favorite", action: "injuredForward", value: -0.12 },
    { regex: /(key|star|top|核心|主力)\s+(striker|forward|winger|attacker|射手|前锋|边锋|攻击手|中锋)\s+(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "underdog", action: "injuredForward", value: -0.08 },
    { regex: /(defender|centre.back|goalkeeper|后卫|门将|中卫)\s.*(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "favorite", action: "injuredDefense", value: -0.06 },
    { regex: /(defender|centre.back|goalkeeper|后卫|门将|中卫)\s.*(out|injured|absent|unavailable|doubtful|缺阵|伤停|因伤|受伤|无缘)/i, team: "underdog", action: "injuredDefense", value: -0.10 },
    // Suspensions
    { regex: /(suspended|banned|suspension|禁赛|停赛)/i, team: "favorite", action: "suspension", value: -0.08 },
    { regex: /(suspended|banned|suspension|禁赛|停赛)/i, team: "underdog", action: "suspension", value: -0.06 },
    // Motivation/rotation
    { regex: /(rotate|rotation|rest|rotated|rested|轮换|留力|替补)/i, team: "favorite", action: "rotation", value: -0.06 },
    // Goalkeeper overperformance potential
    { regex: /(goalkeeper|keeper|门将).*(outstanding|brilliant|heroic|phenomenal|神勇|神扑|屡献)/i, team: "underdog", action: "keeperOverperformance", value: -0.04 },
    // Red card risk
    { regex: /(red.card|sent.off|dismissed|罚下|红牌)/i, team: "favorite", action: "redCardRisk", value: -0.10 },
  ];

  for (const { regex, team, action, value } of patterns) {
    if (regex.test(allText)) {
      penalties.push({ team, action, value, reason: `${team} team: ${action}` });
    }
  }

  // Cap total penalties
  const favPenalty = penalties.filter(p => p.team === "favorite").reduce((s, p) => s + p.value, 0);
  const dogPenalty = penalties.filter(p => p.team === "underdog").reduce((s, p) => s + p.value, 0);
  return {
    penalties,
    favoriteModifier: clamp(1 + favPenalty, 0.80, 1.10),
    underdogModifier: clamp(1 + dogPenalty, 0.80, 1.10),
    totalSignalCount: penalties.length,
  };
}

function extractSignals(text, homeKey, awayKey, market, stageMul = STAGE_MULTIPLIERS.group, motivMod = MOTIVATION_MODIFIERS.neutral) {
  const has = (...words) => words.some((word) => text.includes(word));
  const homeFav = (market?.h || 0) >= (market?.a || 0);
  const favoriteSide = homeFav ? "h" : "a";
  const favoriteKey = homeFav ? homeKey : awayKey;
  const underdogKey = homeFav ? awayKey : homeKey;
  const favoriteClass = teamClass(favoriteKey);
  const underdogClass = teamClass(underdogKey);
  const athleticOpponent = ATHLETIC_RESISTANCE.has(underdogKey);
  const tacticalOpponent = TACTICAL_RESISTANCE.has(underdogKey);
  const physicalOpponent = athleticOpponent || tacticalOpponent; // backward compat
  const agingOpponent = AGING_DEFENSE_TEAMS.has(underdogKey);

  // P3: sigmoid dose (replaces boolean threshold)
  const lowBlockClues = [
    UNSTABLE_LOW_BLOCK_FAVORITES.has(favoriteKey),
    physicalOpponent,
    has("low block", "deep block", "compact", "5-4-1", "4-5-1", "低位", "密集"),
    has("ronaldo", "cross", "crossing", "set piece", "corner", "free kick", "传中", "定位球"),
    has("counterattack", "counter", "pace", "speed", "transition", "反击", "速度", "转换"),
    has("few touches", "poor finishing", "shots on target", "sot", "射正", "终结不稳"),
  ].filter(Boolean).length;
  const surgeClues = [
    HIGH_DEPTH_FAVORITES.has(favoriteKey),
    agingOpponent,
    has("bench", "substitute", "depth", "rotation", "替补", "深度"),
    has("coach", "adjustment", "tuchel", "second half", "下半场", "临场", "调整"),
    has("set piece", "corner", "free kick", "定位球", "角球"),
    has("multiple scorers", "wide attack", "wing", "多点", "边路"),
  ].filter(Boolean).length;

  // Sigmoid dose scores (P3) with P8 stage + P9 motivation modulation
  const rawLowBlockScore = sigmoidDose(lowBlockClues, 3.5, 2.5, 2);
  const rawSurgeScore = sigmoidDose(surgeClues, 3.0, 2.0, 2);
  const lowBlockPenaltyScore = clamp(rawLowBlockScore * stageMul.penalty * motivMod.penaltyScale, 0, 1);
  const surgeScore = clamp(rawSurgeScore * stageMul.surge, 0, 1);

  // opponent_physical_grade: athletic=0.8, tactical=0.5
  const opponentGrade = athleticOpponent ? 0.8 : tacticalOpponent ? 0.5 : 0;

  // P1+P7: opponent interaction lookup
  const interaction = interactionLookup(favoriteClass, underdogClass, favoriteKey, underdogKey);
  const interactionDeltas = interaction.deltas;
  const dangerZone = favoriteClass === "unstable-low-block"
    && underdogClass === "athletic-resistance"
    && lowBlockPenaltyScore > 0.60;

  return {
    lowBlock: has("low block", "deep block", "defensive", "compact", "5-4-1", "4-5-1", "低位", "密集"),
    eliteOutlet: has("ronaldo", "bruno", "bernardo", "mbappe", "messi", "kane", "elite", "finisher", "attacking", "attack"),
    injury: has("injury", "injuries", "suspended", "suspension", "doubtful", "unavailable", "out injured", "伤停", "停赛"),
    rotation: has("rotation", "rotate", "rest", "rotated", "轮换"),
    slowEnvironment: has("heat", "humid", "humidity", "hydration", "altitude", "travel", "fatigue", "hot", "高温", "湿度", "海拔", "旅行", "疲劳"),
    openTempo: has("open game", "counterattack", "transition", "high press", "pressing", "pace", "end-to-end", "counter", "对攻", "反击", "高压", "转换"),
    motivation: has("qualification", "standings", "must win", "advance", "出线", "积分", "小组"),
    marketMove: has("odds movement", "market", "betting", "line movement", "盘口", "赔率"),
    physicalUnderdog: athleticOpponent || tacticalOpponent,
    favoriteSide,
    favoriteKey,
    underdogKey,
    favoriteClass,
    underdogClass,
    physicalOpponent,
    athleticOpponent,
    tacticalOpponent,
    agingOpponent,
    unstableFavorite: UNSTABLE_LOW_BLOCK_FAVORITES.has(favoriteKey),
    highDepthFavorite: HIGH_DEPTH_FAVORITES.has(favoriteKey),
    sFinisherFavorite: S_FINISHERS.has(favoriteKey),
    // P3: sigmoid dose scores
    lowBlockPenaltyScore,
    surgeScore,
    opponentGrade,
    // P1: interaction matrix deltas
    interactionDeltas,
    interactionRawDeltas: interaction.rawDeltas,
    interactionStrengthModifier: interaction.modifier,
    interactionWeakOpponent: interaction.weakOpponent,
    interactionLambdaMultipliers: interaction.lambdaMultipliers,
    dangerZone,
    // Boolean triggers (backward compat, softened by dose)
    lowBlockConversionPenalty: lowBlockPenaltyScore > 0.15,
    secondHalfSurgeFactor: surgeScore > 0.15,
  };
}

// ===== P3: Sigmoid dose-response =====
function sigmoidDose(n, midpoint, steepness, deadZone) {
  if (n <= 0) return 0;
  const raw = 1 / (1 + Math.exp(-steepness * (n - midpoint)));
  if (n <= deadZone) return clamp(raw * (n / deadZone) ** 2, 0, 1);
  return clamp(raw, 0, 1);
}

// ===== P1: Interaction matrix lookup =====
function interactionLookup(favClass, oppClass, favKey = "", oppKey = "") {
  const row = INTERACTION_MATRIX[favClass] || INTERACTION_MATRIX["mid-tier"];
  const rawDeltas = row[oppClass] || [0, 0];
  const favoriteElo = TEAM_DATA[favKey]?.elo;
  const opponentElo = TEAM_DATA[oppKey]?.elo;
  const weakOpponent = favClass === "unstable-low-block"
    && Number.isFinite(favoriteElo)
    && Number.isFinite(opponentElo)
    && favoriteElo - opponentElo > 150;

  // r6: mid-tier vs mid-tier — skip λ multipliers, use Sij empirical calibration only
  const isMidTierPair = (favClass === "mid-tier" || favClass === "possession")
    && (oppClass === "mid-tier" || oppClass === "possession" || oppClass === "unknown");
  if (isMidTierPair) {
    return {
      deltas: rawDeltas,
      rawDeltas,
      modifier: 1,
      weakOpponent: false,
      lambdaMultipliers: { favorite: 1.0, underdog: 1.0 }, // neutral — Sij handles this
      midTierPair: true,
    };
  }

  let [deltaWin, deltaDraw] = rawDeltas;
  let modifier = 1;
  if (weakOpponent && (deltaWin < 0 || deltaDraw > 0)) {
    modifier = 0.5;
    if (deltaWin < 0) deltaWin *= modifier;
    if (deltaDraw > 0) deltaDraw *= modifier;
  }
  return {
    deltas: [deltaWin, deltaDraw],
    rawDeltas,
    modifier,
    weakOpponent,
    lambdaMultipliers: interactionLambdaMultipliers(deltaWin, deltaDraw, favClass),
    midTierPair: false,
  };
}

function interactionLambdaMultipliers(deltaWin, deltaDraw, favClass = "") {
  // r6: S-finisher uses 2.0× multiplier (reduced from 3.0× — elite talent ignores tactical counters)
  const winMultiplier = favClass === "S-finisher" ? 2.0 : 3.0;
  let favorite = 1;
  let underdog = 1;
  if (deltaWin > 0) favorite *= 1 + 2.5 * deltaWin;
  if (deltaWin < 0) favorite *= 1 + winMultiplier * deltaWin;
  if (deltaDraw > 0) underdog *= 1 + 0.86 * deltaDraw;
  if (deltaDraw < 0 && deltaWin <= 0) underdog *= 1 + 1.2 * deltaDraw;
  return {
    favorite: clamp(favorite, 0.72, 1.18),
    underdog: clamp(underdog, 0.84, 1.14),
  };
}

function teamClass(key) {
  if (S_FINISHERS.has(key)) return "S-finisher";
  if (HIGH_DEPTH_FAVORITES.has(key)) return "high-depth";
  if (UNSTABLE_LOW_BLOCK_FAVORITES.has(key)) return "unstable-low-block";
  if (ATHLETIC_RESISTANCE.has(key)) return "athletic-resistance";
  if (TACTICAL_RESISTANCE.has(key)) return "tactical-resistance";
  if (AGING_DEFENSE_TEAMS.has(key)) return "aging-defense";
  const arch = TEAM_DATA[key]?.archetype || "unknown";
  if (arch === "physical") return "athletic-resistance"; // backward compat
  return arch;
}

function buildStrength(home, away, market, signals) {
  const homeHfi = hfiProxy(market.h, signals, home.archetype);
  const awayHfi = hfiProxy(market.a, signals, away.archetype);
  const homeInjury = signals.injury && market.h >= market.a ? -0.25 : 0;
  const awayInjury = signals.injury && market.a > market.h ? -0.25 : 0;
  const envAdj = signals.slowEnvironment ? -0.15 : signals.openTempo ? 0.08 : 0;
  const homeStrength = baseStrength(home, homeHfi, homeInjury, envAdj);
  const awayStrength = baseStrength(away, awayHfi, awayInjury, envAdj);
  return {
    home: { ...homeStrength, hfiProxy: homeHfi, injuryAdj: homeInjury, envAdj },
    away: { ...awayStrength, hfiProxy: awayHfi, injuryAdj: awayInjury, envAdj },
  };
}

function baseStrength(team, hfi, injuryAdj, envAdj) {
  // A- teams: systemic Elo discount — aging cores / tactical transition / paper strength
  const eloDiscount = team.archetype === "unstable-low-block" ? -40 : 0;
  const eloZ = (team.elo + eloDiscount - 1800) / 140;
  const fifaZ = (55 - team.fifa) / 28;
  const hfiZ = (hfi - 150) / 80;
  const xgEffZ = team.archetype === "elite-finisher" ? 0.55
    : team.archetype === "high-depth" ? 0.52
      : team.archetype === "unstable-low-block" ? 0.25
          : team.archetype === "possession" ? 0.35
          : team.archetype === "athletic-resistance" ? 0.08
            : team.archetype === "tactical-resistance" ? 0.12
              : team.archetype === "physical" ? 0.05
            : 0;
  return {
    eloZ,
    fifaZ,
    hfiZ,
    xgEffZ,
    baseStrength: 0.35 * eloZ + 0.20 * fifaZ + 0.20 * hfiZ + 0.15 * xgEffZ + 0.05 * injuryAdj + 0.05 * envAdj,
  };
}

function hfiProxy(marketWin, signals, archetype) {
  let value = 100 + marketWin * 180;
  if (archetype === "elite-finisher") value += 18;
  if (archetype === "high-depth") value += 18;
  if (archetype === "unstable-low-block") value += 6;
  if (archetype === "athletic-resistance") value += 8;
  if (archetype === "tactical-resistance") value += 10;
  if (archetype === "physical") value += 8;
  if (signals.motivation) value += 6;
  if (signals.rotation) value -= 10;
  if (signals.injury) value -= 8;
  return clamp(value, 40, 280);
}

function buildP0({ home, away, market, sij, signals }) {
  const sijWdl = bandedWdlFromSij(sij);
  const eloHome = eloExpected(home.elo, away.elo);
  const eloDraw = clamp(0.30 - Math.abs(eloHome - 0.5) * 0.18 + (signals.lowBlock ? 0.03 : 0), 0.16, 0.38);
  const eloWdl = normalizeWdl({ h: eloHome * (1 - eloDraw), d: eloDraw, a: (1 - eloHome) * (1 - eloDraw) });
  const groupHome = home.group?.qualify || home.title * 8 || 0.2;
  const groupAway = away.group?.qualify || away.title * 8 || 0.2;
  const groupWdl = normalizeWdl({ h: groupHome, d: 0.26, a: groupAway });
  const researchWdl = normalizeWdl({
    h: market.h + (signals.eliteOutlet && market.h >= market.a ? 0.03 : 0) - (signals.injury && market.h >= market.a ? 0.025 : 0),
    d: market.d + (signals.lowBlock ? 0.035 : 0) + (signals.slowEnvironment ? 0.02 : 0),
    a: market.a + (signals.physicalUnderdog && market.a < market.h ? 0.025 : 0) - (signals.injury && market.a > market.h ? 0.025 : 0),
  });
  return normalizeWdl({
    h: 0.30 * sijWdl.h + 0.22 * eloWdl.h + 0.18 * groupWdl.h + 0.20 * market.h + 0.10 * researchWdl.h,
    d: 0.30 * sijWdl.d + 0.22 * eloWdl.d + 0.18 * groupWdl.d + 0.20 * market.d + 0.10 * researchWdl.d,
    a: 0.30 * sijWdl.a + 0.22 * eloWdl.a + 0.18 * groupWdl.a + 0.20 * market.a + 0.10 * researchWdl.a,
  });
}

function buildCorrections({ p0, sij, signals, controls, drawState }) {
  const drawBase = drawPosterior(drawState.matchesPlayed || 0, drawState.draws || 0);
  const drawTarget = adjustedDraw(drawBase, {
    closeStrength: Math.abs(sij) < 0.5,
    firstRound: true,
    lowBlock: signals.lowBlock || signals.lowBlockConversionPenalty,
    weakBreakdown: signals.lowBlockConversionPenalty || (signals.lowBlock && Math.max(p0.h, p0.a) < 0.72),
    environmentSlow: signals.slowEnvironment || controls.tempo === "slow",
    absSij: Math.abs(sij),
    eliteAttack: signals.sFinisherFavorite || signals.secondHalfSurgeFactor,
  });
  const priorWdl = normalizeWdl({ ...p0, d: (p0.d * 0.75) + (drawTarget * 0.25) });
  const lambdaWarnings = [];
  if (signals.dangerZone) {
    lambdaWarnings.push("DANGER-ZONE SELECTOR GUARD: A- vs athletic-resistance with high low-block dose. Base model stays lambda-driven; HAD singles should be rejected by selector.");
  }
  if (Math.max(p0.h, p0.a) > 0.70 && drawTarget > 0.24 && signals.lowBlockPenaltyScore > 0.35) {
    lambdaWarnings.push("CONSISTENCY WATCH: high favorite probability and high draw target coexist; verify handicap/total from the Poisson matrix.");
  }
  const lambdaDataCompleteness = controls?.confidence === "high" || (signals.motivation && (signals.injury || signals.eliteOutlet)) ? "high" : "medium";
  return {
    wdl: normalizeWdl(p0),
    drawBase,
    drawTarget,
    dataCompleteness: lambdaDataCompleteness,
    priorWdl,
    postInteractionWdl: normalizeWdl(p0),
    lambdaConsistent: true,
    dangerZone: Boolean(signals.dangerZone),
    autoCorrected: false,
    consistencyWarning: lambdaWarnings.join(" "),
  };
}
function chooseLambdas({ sij, p0, controls, signals, motivMod = MOTIVATION_MODIFIERS.neutral, profileName = "default" }) {
  let result;
  if (Number.isFinite(Number(controls?.lambdaHome)) && Number.isFinite(Number(controls?.lambdaAway))) {
    result = { home: Number(controls.lambdaHome), away: Number(controls.lambdaAway) };
    return applyV33LambdaAdjustments(result, signals);
  }
  const abs = Math.abs(sij);
  const homeFav = p0.h >= p0.a;
  let fav = 1.15;
  let dog = 1.15;
  if (abs > 1.8) [fav, dog] = [2.30, 0.45];
  else if (abs > 1.2) [fav, dog] = [1.85, 0.65];
  else if (abs > 0.8) [fav, dog] = [1.55, 0.85];
  else if (abs > 0.4) [fav, dog] = [1.30, 1.00];
  if (signals.lowBlock) fav *= 0.96;
  if (signals.injury) fav *= 0.97;
  if ((signals.eliteOutlet || signals.sFinisherFavorite) && !signals.unstableFavorite) fav *= 1.05;
  result = homeFav ? { home: fav, away: dog } : { home: dog, away: fav };
  // DEBUG (quiet mode — uncomment for lambda diagnostics):
  // if (Math.abs(sij) > 0.8) console.error('CHOOSE_LAMBDAS_DEBUG sij='+sij.toFixed(2)+' fav='+fav.toFixed(2)+' dog='+dog.toFixed(2)+' resultBefore='+JSON.stringify(result));
  result = applyV33LambdaAdjustments(result, signals);
  // if (Math.abs(sij) > 0.8) console.error('CHOOSE_LAMBDAS_DEBUG afterAdjust='+JSON.stringify(result));
  // P9: motivation-driven λ scaling
  result = {
    home: clamp(result.home * (motivMod?.lambdaScale ?? 1), 0.2, 3.4),
    away: clamp(result.away * (motivMod?.lambdaScale ?? 1), 0.2, 3.4),
  };
  return result;
}

function applyV33LambdaAdjustments(lambdas, signals) {
  const result = { ...lambdas };
  // NaN guard: ensure base lambdas are valid numbers
  if (!Number.isFinite(result.home) || result.home <= 0) { console.error('GUARD-TRIGGERED home:', result.home); result.home = 1.15; }
  if (!Number.isFinite(result.away) || result.away <= 0) { console.error('GUARD-TRIGGERED away:', result.away); result.away = 1.15; }
  const favoriteKey = signals.favoriteSide === "a" ? "away" : "home";
  const underdogKey = favoriteKey === "home" ? "away" : "home";

  // Combined tactical penalty stack — merge before applying to avoid chain-multiplication collapse
  let favTacticalMult = 1.0;
  let dogTacticalMult = 1.0;
  const interactionMul = signals.interactionLambdaMultipliers || { favorite: 1, underdog: 1 };
  // Sanitize: ensure interaction multipliers are valid numbers, default to 1.0
  const safeFav = Number.isFinite(interactionMul.favorite) ? interactionMul.favorite : 1;
  const safeDog = Number.isFinite(interactionMul.underdog) ? interactionMul.underdog : 1;
  favTacticalMult *= safeFav;
  dogTacticalMult *= safeDog;
  if (signals.unstableFavorite) {
    const unstableScale = signals.interactionWeakOpponent ? 0.5 : 1;
    favTacticalMult *= 1 - 0.04 * unstableScale;
    dogTacticalMult *= 1 + 0.02 * unstableScale;
  }
  if (signals.lowBlockPenaltyScore > 0.15) {
    const effective = signals.lowBlockPenaltyScore * signals.opponentGrade;
    favTacticalMult *= 1 - 0.08 * effective;
    dogTacticalMult *= 1 + 0.08 * effective;
  }
  if (signals.researchPenalty && typeof signals.researchPenalty.favoriteModifier === 'number') {
    favTacticalMult *= signals.researchPenalty.favoriteModifier;
    dogTacticalMult *= signals.researchPenalty.underdogModifier;
  }
  // Floor: favorite λ cannot drop below 85% of base — prevents cascade collapse
  favTacticalMult = Math.max(0.85, favTacticalMult);

  result[favoriteKey] *= favTacticalMult;
  result[underdogKey] *= dogTacticalMult;

  // Positive boosts (separate from tactical penalties)
  if (signals.highDepthFavorite) result[favoriteKey] *= 1.06;
  if (signals.surgeScore > 0.15) {
    result[favoriteKey] *= 1 + 0.08 * signals.surgeScore;
    result[underdogKey] *= 1 + 0.03 * signals.surgeScore;
  }
  // Ensure non-NaN output
  if (!Number.isFinite(result.home)) { console.error('FINAL-GUARD home NaN reset:', result.home); result.home = 1.15; }
  if (!Number.isFinite(result.away)) { console.error('FINAL-GUARD away NaN reset:', result.away); result.away = 1.15; }
  return {
    home: clamp(result.home, 0.2, 3.4),
    away: clamp(result.away, 0.2, 3.4),
  };
}

function chooseProfile({ controls, home, away, p0, signals }) {
  if (signals.lowBlockConversionPenalty) return "defensive-favorite";
  if (signals.secondHalfSurgeFactor) return "elite-finisher";
  if (controls?.profile && PROFILES[controls.profile]) return controls.profile;
  const favElite = p0.h >= p0.a ? home.archetype === "elite-finisher" : away.archetype === "elite-finisher";
  if (signals.lowBlock || signals.unstableFavorite) return "defensive-favorite";
  if (signals.eliteOutlet || signals.sFinisherFavorite || favElite) return "elite-finisher";
  if (Math.max(p0.h, p0.a) < 0.55) return "balanced";
  return "default";
}

function chooseTempo({ controls, signals }) {
  if (controls?.tempo && controls.tempo !== "normal") return controls.tempo;
  if (signals.slowEnvironment) return "slow";
  if (signals.openTempo) return "open";
  return "normal";
}

function buildScoreMatrix(lambdaHome, lambdaAway, profileName) {
  // Sanity check: NaN/zero guard — ensure Poisson has valid positive lambda
  if (!Number.isFinite(lambdaHome) || lambdaHome <= 0) lambdaHome = 1.15;
  if (!Number.isFinite(lambdaAway) || lambdaAway <= 0) lambdaAway = 1.15;
  const profile = PROFILES[profileName] || PROFILES.default;
  const homeFav = lambdaHome >= lambdaAway;
  const states = [
    { weight: profile.n, h: lambdaHome, a: lambdaAway },
    { weight: profile.l, h: 0.82 * lambdaHome, a: 0.82 * lambdaAway },
    {
      weight: profile.c,
      h: homeFav ? 1.35 * lambdaHome : 0.90 * lambdaHome,
      a: homeFav ? 0.90 * lambdaAway : 1.35 * lambdaAway,
    },
  ];
  const scores = [];
  let total = 0;
  for (let h = 0; h <= 8; h += 1) {
    for (let a = 0; a <= 8; a += 1) {
      const prob = states.reduce((sum, s) => sum + s.weight * poisson(h, s.h) * poisson(a, s.a), 0);
      scores.push({ h, a, prob });
      total += prob;
    }
  }
  return scores.map((score) => ({ ...score, prob: score.prob / (total || 1) }));
}

function buildPlayProbabilities(scores, match, profile, tempoFactor, lambdas, signals) {
  const states = sumStates(scores);
  const byPlay = {
    had: { h: states.h, d: states.d, a: states.a },
    hhad: { h: 0, d: 0, a: 0 },
    crs: { s1sh: 0, s1sd: 0, s1sa: 0 },
    ttg: { s7: 0 },
    hafu: buildHafu(lambdas.home * tempoFactor, lambdas.away * tempoFactor, profile),
  };
  const handicap = Number(match?.hhadGoalLine || 0);
  const crsMap = new Map(CRS_KEYS.map(([key, h, a]) => [`${h}:${a}`, key]));
  for (const score of scores) {
    if (!Number.isFinite(score.prob)) continue;
    const adjusted = score.h + handicap - score.a;
    if (adjusted > 0) byPlay.hhad.h += score.prob;
    else if (adjusted === 0) byPlay.hhad.d += score.prob;
    else byPlay.hhad.a += score.prob;

    const totalGoals = score.h + score.a;
    const ttgKey = totalGoals >= 7 ? "s7" : `s${totalGoals}`;
    byPlay.ttg[ttgKey] = (byPlay.ttg[ttgKey] || 0) + score.prob;

    const exact = crsMap.get(`${score.h}:${score.a}`);
    if (exact) byPlay.crs[exact] = (byPlay.crs[exact] || 0) + score.prob;
    else if (score.h > score.a) byPlay.crs.s1sh += score.prob;
      else if (score.h === score.a) byPlay.crs.s1sd += score.prob;
    else byPlay.crs.s1sa += score.prob;
  }
  byPlay.hafu = adjustHafuV33(byPlay.hafu, signals);
  byPlay.hhad = adjustHandicapV33(byPlay.hhad, handicap, states, signals);
  byPlay.ttg = adjustTotalGoalsV33(byPlay.ttg, signals);
  return byPlay;
}

function adjustHafuV33(hafu, signals) {
  const winWin = signals.favoriteSide === "a" ? "aa" : "hh";
  const drawWin = signals.favoriteSide === "a" ? "da" : "dh";
  const winDraw = signals.favoriteSide === "a" ? "ad" : "hd";
  const adjusted = { ...hafu };
  if (signals.lowBlockConversionPenalty) {
    adjusted[winWin] *= 0.62;
    adjusted[drawWin] += 0.16;
    adjusted.dd += 0.10;
    adjusted[winDraw] += 0.02;
  } else if (signals.unstableFavorite) {
    adjusted[winWin] *= 0.78;
    adjusted[drawWin] += 0.08;
    adjusted.dd += 0.055;
  }
  if (signals.secondHalfSurgeFactor) {
    adjusted[drawWin] += 0.17;
    adjusted[winWin] += 0.03;
    adjusted.dd -= 0.08;
  }
  return normalizeMap(adjusted);
}

function adjustHandicapV33(hhad, handicap, states, signals) {
  const coverKey = signals.favoriteSide === "a" ? "a" : "h";
  const oppositeKey = coverKey === "h" ? "a" : "h";
  const favoriteWin = signals.favoriteSide === "a" ? states.a : states.h;
  const deepHandicap = coverKey === "h" ? handicap <= -2 : handicap >= 2;
  const adjusted = { ...hhad };
  if ((signals.lowBlockConversionPenalty || signals.unstableFavorite) && (deepHandicap || favoriteWin < 0.70 || states.d > 0.24)) {
    const removed = adjusted[coverKey] * (deepHandicap ? 0.30 : 0.18);
    adjusted[coverKey] -= removed;
    adjusted.d += removed * 0.45;
    adjusted[oppositeKey] += removed * 0.55;
  }
  if (signals.secondHalfSurgeFactor) {
    const boost = Math.min(0.05, adjusted[oppositeKey] * 0.35);
    adjusted[coverKey] += boost;
    adjusted[oppositeKey] -= boost;
  }
  return normalizeMap(adjusted);
}

function adjustTotalGoalsV33(ttg, signals) {
  const adjusted = { ...ttg };
  if (signals.lowBlockConversionPenalty || signals.unstableFavorite) {
    for (const key of ["s0", "s1", "s2"]) adjusted[key] = (adjusted[key] || 0) * 1.06;
    for (const key of ["s3", "s4", "s5", "s6", "s7"]) adjusted[key] = (adjusted[key] || 0) * 0.95;
  }
  if (signals.secondHalfSurgeFactor) {
    for (const key of ["s0", "s1", "s2"]) adjusted[key] = (adjusted[key] || 0) * 0.94;
    for (const key of ["s3", "s4", "s5", "s6", "s7"]) adjusted[key] = (adjusted[key] || 0) * 1.08;
  }
  return normalizeMap(adjusted);
}

function normalizeMap(map) {
  const clamped = Object.fromEntries(Object.entries(map).map(([key, value]) => [key, Math.max(0, value || 0)]));
  const total = Object.values(clamped).reduce((sum, value) => sum + value, 0) || 1;
  return Object.fromEntries(Object.entries(clamped).map(([key, value]) => [key, value / total]));
}

function buildHafu(lambdaHome, lambdaAway, profileName) {
  if (!Number.isFinite(lambdaHome) || lambdaHome <= 0) lambdaHome = 1.15;
  if (!Number.isFinite(lambdaAway) || lambdaAway <= 0) lambdaAway = 1.15;
  const profile = PROFILES[profileName] || PROFILES.default;
  const homeFav = lambdaHome >= lambdaAway;
  const result = { hh: 0, hd: 0, ha: 0, dh: 0, dd: 0, da: 0, ah: 0, ad: 0, aa: 0 };
  const states = [
    { weight: profile.n, h: lambdaHome, a: lambdaAway },
    { weight: profile.l, h: 0.82 * lambdaHome, a: 0.82 * lambdaAway },
    {
      weight: profile.c,
      h: homeFav ? 1.35 * lambdaHome : 0.90 * lambdaHome,
      a: homeFav ? 0.90 * lambdaAway : 1.35 * lambdaAway,
    },
  ];
  let total = 0;
  for (const s of states) {
    for (let hh = 0; hh <= 6; hh += 1) {
      for (let ha = 0; ha <= 6; ha += 1) {
        const htProb = poisson(hh, s.h * 0.45) * poisson(ha, s.a * 0.45);
        for (let sh = 0; sh <= 6; sh += 1) {
          for (let sa = 0; sa <= 6; sa += 1) {
            const prob = s.weight * htProb * poisson(sh, s.h * 0.55) * poisson(sa, s.a * 0.55);
            result[`${stateKey(hh, ha)}${stateKey(hh + sh, ha + sa)}`] += prob;
            total += prob;
          }
        }
      }
    }
  }
  for (const key of Object.keys(result)) result[key] /= total || 1;
  return result;
}

function gradeMatch(states, completeness) {
  const max = Math.max(states.h, states.d, states.a);
  const doubleChance = Math.max(states.h + states.d, states.h + states.a, states.d + states.a);
  if (completeness !== "high" && max < 0.7) return { grade: "B/C", reason: "动态数据未完全结构化，降低一档处理。" };
  if (max >= 0.68 && states.d <= 0.25) return { grade: "A", reason: "单方向集中度高，平局压力较低。" };
  if (doubleChance >= 0.78) return { grade: "B", reason: "双选保护较强，单选需保守。" };
  if (states.d >= 0.33 || max - states.d < 0.12) return { grade: "C", reason: "平局或分歧压力偏高。" };
  return { grade: "D", reason: "方向分散或盘口/模型冲突。" };
}

function buildNotes({ home, away, p0, correction, signals, profile, tempo }) {
  const notes = [
    `P0 ensemble: home ${(p0.h * 100).toFixed(1)}%, draw ${(p0.d * 100).toFixed(1)}%, away ${(p0.a * 100).toFixed(1)}%.`,
    `Draw posterior adjusted to ${(correction.drawTarget * 100).toFixed(1)}%.`,
    `V3.3 r5 classes: favorite=${signals.favoriteClass}, underdog=${signals.underdogClass}.`,
    `Profile=${profile}, tempo=${tempo}.`,
    `Home archetype=${home.archetype}, away archetype=${away.archetype}.`,
  ];
  // P7: athletic vs tactical resistance
  if (signals.athleticOpponent) notes.push("P7: Athletic resistance opponent (high physicality, danger zone with A- teams).");
  if (signals.tacticalOpponent) notes.push("P7: Tactical resistance opponent (discipline-based, milder than athletic).");
  // P1: interaction matrix
  const [idw, idd] = signals.interactionDeltas || [0, 0];
  if (false && Math.abs(idw) + Math.abs(idd) > 0.005) {
    notes.push(`P1: Interaction matrix applied (Δwin=${(idw * 100).toFixed(1)}pp, Δdraw=${(idd * 100).toFixed(1)}pp).`);
  }
  if (Math.abs(idw) + Math.abs(idd) > 0.005) {
    const mul = signals.interactionLambdaMultipliers || { favorite: 1, underdog: 1 };
    const mod = Number(signals.interactionStrengthModifier || 1);
    notes.push(`P1 r5: interaction deltas are mapped to lambda multipliers (favLambda x${mul.favorite.toFixed(2)}, dogLambda x${mul.underdog.toFixed(2)}, strengthModifier=${mod.toFixed(2)}).`);
  }
  // P3: sigmoid dose
  if (signals.lowBlockPenaltyScore > 0.15) {
    notes.push(`P3: LowBlockPenalty sigmoid dose=${signals.lowBlockPenaltyScore.toFixed(2)} (grade=${signals.opponentGrade.toFixed(1)}).`);
  }
  if (signals.surgeScore > 0.15) {
    notes.push(`P3: SecondHalfSurge sigmoid dose=${signals.surgeScore.toFixed(2)}.`);
  }
  // P4: auto-correct
  if (correction.autoCorrected) {
    notes.push(`P4: AUTO-CORRECTED — ${correction.consistencyWarning}`);
  }
  if (signals.dangerZone) notes.push("P4 r5: Danger Zone moved to selector guard; base WDL is not force-swapped.");
  notes.push("P6 r5: empirical calibration is preview-only so WDL, handicap, total goals and HT/FT stay Poisson/lambda-consistent.");
  // P6: empirical calibration

  if (signals.lowBlock) notes.push("Low-block signal raised draw/low-block state.");
  if (signals.eliteOutlet) notes.push("Elite outlet signal raised favorite/collapse tail.");
  if (signals.slowEnvironment) notes.push("Environment/travel signal slowed tempo.");
  if (signals.openTempo) notes.push("Transition/high-press signal opened tempo.");
  return notes;
}

function poisson(k, lambda) {
  if (k < 0) return 0;
  let factorial = 1;
  for (let i = 2; i <= k; i += 1) factorial *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial;
}

function sumStates(scores) {
  const result = { h: 0, d: 0, a: 0 };
  for (const score of scores) {
    const p = Number.isFinite(score.prob) ? score.prob : 0;
    if (score.h > score.a) result.h += p;
    else if (score.h === score.a) result.d += p;
    else result.a += p;
  }
  return result;
}

function normalizeWdl(wdl) {
  const h = Math.max(0, wdl.h || 0);
  const d = Math.max(0, wdl.d || 0);
  const a = Math.max(0, wdl.a || 0);
  const total = h + d + a || 1;
  return { h: h / total, d: d / total, a: a / total };
}

function bandedWdlFromSij(sij) {
  if (sij > 1.8) return { h: 0.80, d: 0.16, a: 0.04 };
  if (sij > 1.2) return { h: 0.68, d: 0.23, a: 0.09 };
  if (sij > 0.8) return { h: 0.58, d: 0.29, a: 0.13 };
  if (sij > 0.4) return { h: 0.47, d: 0.35, a: 0.18 };
  if (sij > 0) return { h: 0.39, d: 0.38, a: 0.23 };
  if (sij > -0.4) return { h: 0.23, d: 0.38, a: 0.39 };
  if (sij > -0.8) return { h: 0.18, d: 0.35, a: 0.47 };
  if (sij > -1.2) return { h: 0.13, d: 0.29, a: 0.58 };
  return { h: 0.09, d: 0.23, a: 0.68 };
}

function eloExpected(a, b) {
  return 1 / (1 + 10 ** (-(a - b) / 400));
}

function drawPosterior(matchesPlayed, draws, p0 = 0.24, n0 = 20) {
  // r5: lower prior (0.24 vs old 0.25), light anchor (n0=20)
  // Allows rapid adaptation to real tournament draw rates
  return (n0 * p0 + draws) / (n0 + matchesPlayed);
}

function adjustedDraw(base, opts) {
  let value = base;
  if (opts.closeStrength) value += 0.04;
  if (opts.firstRound) value += 0.03;
  if (opts.lowBlock) value += 0.04;
  if (opts.weakBreakdown) value += 0.03;
  if (opts.environmentSlow) value += 0.02;
  if (opts.absSij > 1.8) value -= 0.12;
  else if (opts.absSij > 1.2) value -= 0.06;
  if (opts.eliteAttack) value -= 0.03;
  return clamp(value, 0.12, 0.42);
}

function calibrateProbability(probability) {
  let p = probability * 100;
  if (p < 5) p += 1.5;
  else if (p < 10) p += 0.8;
  else if (p < 15) p += 0.3;
  else if (p <= 25) p -= 0.5;
  else p -= 1.0;
  return clamp(p / 100, 0, 1);
}

function stateKey(home, away) {
  if (home > away) return "h";
  if (home === away) return "d";
  return "a";
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}
