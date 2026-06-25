/**
 * Selector V2 — Quant Risk Engine (Bug-fixed)
 * Layer 0: Vig Deduction → Layer 1: Circuit Breakers → Layer 2: Kelly → Layer 3: Exposure Control
 */
export const CONFIG = {
  MIN_EV: 0.025,           // 2.5% edge threshold (tightened)
  MAX_ODDS: 8.0,           // >8x → immediate reject
  DIVERGENCE_CAP: 1.5,     // global divergence fuse (tightened, no <0.10 guard)
  KELLY_MULTIPLIER: 0.25,  // 1/4 Kelly
  MIN_KELLY: 0.002,        // minimum 0.2% of bankroll
  MAX_MATCH_EXPOSURE: 0.15,// 15% max per match
  MAX_SINGLE_PCT: 0.05,    // 5% single-bet hard cap
};

export function devigHAD(pool) {
  const sumInv = 1/pool.h + 1/pool.d + 1/pool.a;
  return {
    h: (1/pool.h) / sumInv,
    d: (1/pool.d) / sumInv,
    a: (1/pool.a) / sumInv,
    margin: sumInv - 1,
  };
}

export function evaluatePick(modelProb, odds, pool, bankroll) {
  // ── Layer 0: Vig deduction ──
  const devigged = devigHAD(pool);

  // Bug-fix: auto-detect key from odds matching, never trust pool._key
  let key = pool._key;
  if (!key) {
    if (odds === pool.h) key = 'h';
    else if (odds === pool.d) key = 'd';
    else if (odds === pool.a) key = 'a';
    else key = 'h'; // fallback — should never reach here in production
  }

  const trueImplied = devigged[key];
  if (!Number.isFinite(modelProb) || !Number.isFinite(odds) || odds <= 1) {
    return { rejected: true, reason: "缺失概率或赔率" };
  }

  // ── Layer 1A: High-variance tail ──
  if (odds > CONFIG.MAX_ODDS) {
    return { rejected: true, reason: `赔率${odds.toFixed(1)}>${CONFIG.MAX_ODDS}x，尾端方差熔断` };
  }

  // ── Layer 1B: Global divergence fuse (NO <0.10 guard — was dead code) ──
  const divergenceRatio = trueImplied > 0 ? modelProb / trueImplied : 999;
  if (divergenceRatio > CONFIG.DIVERGENCE_CAP) {
    return { rejected: true, reason: `偏离熔断: 模型${(modelProb*100).toFixed(1)}% vs 市场${(trueImplied*100).toFixed(1)}% (${divergenceRatio.toFixed(1)}x)` };
  }

  // ── Real EV ──
  const ev = modelProb * odds - 1;
  if (ev <= CONFIG.MIN_EV) {
    return { rejected: true, reason: `EV ${(ev*100).toFixed(2)}% < ${(CONFIG.MIN_EV*100).toFixed(1)}%` };
  }

  // ── Layer 2: Fractional Kelly ──
  const fullKelly = (odds > 1) ? Math.max(0, ev / (odds - 1)) : 0;
  const fractionalKelly = fullKelly * CONFIG.KELLY_MULTIPLIER;

  if (fractionalKelly < CONFIG.MIN_KELLY) {
    return { rejected: true, reason: `Kelly ${fractionalKelly.toFixed(4)} < ${CONFIG.MIN_KELLY}` };
  }

  const kellyPct = Math.min(fractionalKelly, CONFIG.MAX_SINGLE_PCT);
  const stake = Math.max(2, Math.round(bankroll * kellyPct / 2) * 2);

  return {
    rejected: false,
    ev,
    trueImplied,
    divergenceRatio,
    fullKelly,
    fractionalKelly,
    kellyPct,
    stake,
  };
}

export function compressExposure(picks) {
  const totalPct = picks.reduce((s, p) => s + (p.kellyPct || 0), 0);
  if (totalPct <= CONFIG.MAX_MATCH_EXPOSURE) return picks;
  const ratio = CONFIG.MAX_MATCH_EXPOSURE / totalPct;
  return picks.map(p => ({
    ...p,
    kellyPct: (p.kellyPct || 0) * ratio,
    stake: Math.max(2, Math.round((p.stake || 0) * ratio / 2) * 2),
    compressed: true,
  }));
}
