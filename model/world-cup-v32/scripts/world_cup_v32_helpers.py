#!/usr/bin/env python3
"""Deterministic helpers for World Cup V3.2 / V3.3 skill.

V3.3 (2026-06-18 r2): λ-driven overlay architecture.
  — P2 fixed: all adjustments operate on Poisson λ, not surface pp.
  — P3 fixed: sigmoid dose-response with dead-zone replaces linear scoring.
  — P4 fixed: auto-correct rolls back inconsistent overlays.
  — P5 fixed: early-ease deprecated (zero template matches).
  — P7 fixed: physical-resistance split into athletic / tactical sub-classes.
  — P8 fixed: match_stage parameter (group vs knockout stratification).
  — P9 fixed: group-third motivation parameter for round-3 matches.
"""

from __future__ import annotations

import argparse
import json
import math
from dataclasses import dataclass
from typing import Iterable


# ============================================================================
# V3.2 Core Functions (unchanged)
# ============================================================================

def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def poisson_pmf(k: int, lam: float) -> float:
    if k < 0:
        return 0.0
    return math.exp(-lam) * (lam**k) / math.factorial(k)


def xg_eff(goals: float, xg: float, goals_against: float, xga: float) -> float:
    return math.log((goals + 0.5) / (xg + 0.5)) - math.log(
        (goals_against + 0.5) / (xga + 0.5)
    )


def proxy_chance(sot_share: float, shot_share: float, possession_share: float) -> float:
    return 0.50 * sot_share + 0.30 * shot_share + 0.20 * possession_share


def draw_posterior(matches_played: int, draws: int, p0: float = 0.24, n0: float = 20) -> float:
    return (n0 * p0 + draws) / (n0 + matches_played)


def adjusted_draw(
    draw_base: float,
    close_strength: bool = False,
    first_round: bool = False,
    low_block: bool = False,
    weak_breakdown: bool = False,
    environment_slow: bool = False,
    abs_sij: float | None = None,
    elite_attack: bool = False,
) -> float:
    value = draw_base
    value += 0.04 if close_strength else 0.0
    value += 0.03 if first_round else 0.0
    value += 0.04 if low_block else 0.0
    value += 0.03 if weak_breakdown else 0.0
    value += 0.02 if environment_slow else 0.0
    if abs_sij is not None:
        if abs_sij > 1.8:
            value -= 0.12
        elif abs_sij > 1.2:
            value -= 0.06
    value -= 0.03 if elite_attack else 0.0
    return clamp(value, 0.12, 0.42)


def simplified_wdl_from_sij(sij: float) -> dict[str, float]:
    bands = [
        (1.80, (0.80, 0.16, 0.04)),
        (1.20, (0.68, 0.23, 0.09)),
        (0.80, (0.58, 0.29, 0.13)),
        (0.40, (0.47, 0.35, 0.18)),
        (0.00, (0.39, 0.38, 0.23)),
        (-0.40, (0.23, 0.38, 0.39)),
        (-0.80, (0.18, 0.35, 0.47)),
        (-1.20, (0.13, 0.29, 0.58)),
        (-math.inf, (0.09, 0.23, 0.68)),
    ]
    for threshold, probs in bands:
        if sij > threshold:
            return {"a_win": probs[0], "draw": probs[1], "b_win": probs[2]}
    raise AssertionError("unreachable")


@dataclass(frozen=True)
class StateProfile:
    name: str
    normal: float
    low_block: float
    collapse: float


PROFILES = {
    "default":            StateProfile("default",            0.67, 0.23, 0.10),
    "elite-finisher":     StateProfile("elite-finisher",     0.62, 0.20, 0.18),
    "defensive-favorite": StateProfile("defensive-favorite", 0.60, 0.30, 0.10),
    "balanced":           StateProfile("balanced",           0.58, 0.27, 0.15),
    # === V3.3 review-adjusted profiles ===
    # high-depth      ← England 4-2 Croatia (2026-06-16), n=1, HIGH sample-risk
    # unstable-low-block ← Portugal 1-1 DR Congo (2026-06-15), n=1, HIGH sample-risk
    "high-depth":         StateProfile("high-depth",         0.60, 0.22, 0.18),
    "unstable-low-block": StateProfile("unstable-low-block", 0.55, 0.35, 0.10),
    # early-ease (0.56/0.34/0.10) → DEPRECATED.  Zero template matches (n=0).
    # Kept in PROFILES for backward compatibility but must NOT be used as a
    # routing target.  Fall back to "balanced" when early-ease is requested.
    "early-ease":         StateProfile("early-ease",         0.56, 0.34, 0.10),  # DEPRECATED
}


# ============================================================================
# V3.3 Trigger Definitions
# ============================================================================

LOW_BLOCK_TRIGGERS: list[str] = [
    "older_or_slower_cf",
    "avg_wing_breaking_efficiency",
    "low_recent_sot_rate",
    "cross_or_setpiece_reliant",
    "tempo_drops_after_lead",
    "opponent_fast_counter",
]

SURGE_CONDITIONS: list[str] = [
    "strong_bench_depth",
    "strong_coach_adjustment",
    "opponent_defensive_age",
    "opponent_high_first_half_consumption",
    "strong_set_pieces",
    "multiple_scoring_points",
]


# ============================================================================
# P3 Fix: Sigmoid dose-response with dead-zone
# ============================================================================

def sigmoid_dose(
    trigger_count: int,
    *,
    midpoint: float = 3.5,
    steepness: float = 2.5,
    dead_zone: int = 2,
) -> float:
    """Sigmoid dose-response replacing linear 0→0.20→0.40 mapping.

    Design (football tactics are non-linear):
      Dead zone  (0-2 triggers): dose ≤ 0.05  — isolated weaknesses don't shift odds
      Acceleration (3-4 triggers): dose 0.12 → 0.78  — critical-mass effect
      Saturation  (5-6 triggers): dose → 1.0  — beyond a point, more conditions barely add

    Mathematical form:
      raw = 1 / (1 + exp(-steepness * (n - midpoint)))
      Then dampen: if n ≤ dead_zone, raw *= (n / dead_zone)^2
    """
    if trigger_count <= 0:
        return 0.0
    raw = 1.0 / (1.0 + math.exp(-steepness * (trigger_count - midpoint)))
    if trigger_count <= dead_zone:
        # Quadratic dampening in dead zone — 1 trigger is essentially noise
        raw *= (trigger_count / dead_zone) ** 2
    return clamp(raw, 0.0, 1.0)


def score_low_block_penalty(triggers: list[str] | None = None) -> float:
    """Penalty dose from low-block trigger count (sigmoid, P3-fixed)."""
    if triggers is None:
        triggers = []
    valid = [t for t in triggers if t in LOW_BLOCK_TRIGGERS]
    return sigmoid_dose(len(valid))


def score_second_half_surge(conditions: list[str] | None = None) -> float:
    """Surge dose from condition count (sigmoid, same architecture)."""
    if conditions is None:
        conditions = []
    valid = [c for c in conditions if c in SURGE_CONDITIONS]
    return sigmoid_dose(len(valid), midpoint=3.0, steepness=2.0, dead_zone=2)


# ============================================================================
# P1+P6: Empirical Calibration Layer (from 2018+2022 data, Brier 0.198)
# ============================================================================
# Source: references/dynamic-review-and-calibration.md §Probability Calibration
# 212 predictions across 2018+2022 World Cups.  These bins describe the V3.2
# base model's systematic calibration bias — when the model says "X%", reality
# gave "Y%".  We apply this as a post-overlay correction to ground V3.3
# probabilities in empirical evidence.

CALIBRATION_BINS: list[tuple[float, float, float]] = [
    # (lower_bound, upper_bound, bias_pp)
    # Bias = Actual frequency − Predicted center  (positive = model underconfident)
    (0.00, 0.10, +2.9),
    (0.10, 0.20, -0.7),
    (0.20, 0.30,  0.0),
    (0.30, 0.40, +1.8),
    (0.40, 0.50, -3.3),
    (0.50, 0.60, +7.5),   # ← key: model severely underconfident here
    (0.60, 0.70, +1.7),
    (0.70, 0.80,  0.0),
    (0.80, 0.90, +15.0),  # ← thin bin (n=2), high variance
    (0.90, 1.00, +5.0),   # ← thin bin (n=1)
]


def empirical_calibrate(probability: float) -> dict:
    """Apply 2018+2022 calibration-bin correction to a single probability.

    Returns {"raw": p, "calibrated": p_cal, "bin_bias_pp": bias, "bin": "(lo–hi)"}
    """
    for lo, hi, bias in CALIBRATION_BINS:
        if lo <= probability < hi or (hi >= 1.0 and probability >= lo):
            cal = clamp(probability + bias / 100.0, 0.0, 1.0)
            return {
                "raw": round(probability, 4),
                "calibrated": round(cal, 4),
                "bin_bias_pp": bias,
                "bin": f"{lo:.0%}–{hi:.0%}",
            }
    return {"raw": probability, "calibrated": probability, "bin_bias_pp": 0.0, "bin": "out-of-range"}


def calibrate_wdl(
    win: float, draw: float, loss: float,
) -> dict[str, dict]:
    """Apply empirical calibration bins to a full WDL triplet.

    Re-normalises after calibration.  This is the P1+P6 empirical grounding:
    instead of accepting expert-judgment coefficients at face value, we
    adjust the final probabilities using the model's own historical track
    record (2018+2022, Brier 0.198, ECE 3.2pp).
    """
    w = empirical_calibrate(win)
    d = empirical_calibrate(draw)
    l = empirical_calibrate(loss)
    total = w["calibrated"] + d["calibrated"] + l["calibrated"]
    return {
        "win": {
            "raw": w["raw"], "calibrated": round(w["calibrated"] / total, 4),
            "bin": w["bin"], "bias_pp": w["bin_bias_pp"],
        },
        "draw": {
            "raw": d["raw"], "calibrated": round(d["calibrated"] / total, 4),
            "bin": d["bin"], "bias_pp": d["bin_bias_pp"],
        },
        "loss": {
            "raw": l["raw"], "calibrated": round(l["calibrated"] / total, 4),
            "bin": l["bin"], "bias_pp": l["bin_bias_pp"],
        },
    }


def calibrate_profile(
    profile_win: float, profile_draw: float, profile_loss: float,
) -> dict:
    """P6: Empirically calibrate a profile's (win, draw, loss) triplet.

    The three profile numbers (e.g. high-depth 60/22/18) are the model's
    prediction for "same-tier" matchups.  Applying the calibration bins
    tells us what the model's own historical data says these numbers
    SHOULD have been — revealing the true empirical win/draw/loss rates
    for teams matching each profile's characteristics.
    """
    result = calibrate_wdl(profile_win, profile_draw, profile_loss)
    return {
        "profile_raw": {
            "win": profile_win, "draw": profile_draw, "loss": profile_loss,
        },
        "empirically_calibrated": {
            "win": result["win"]["calibrated"],
            "draw": result["draw"]["calibrated"],
            "loss": result["loss"]["calibrated"],
        },
        "calibration_detail": result,
        "note": (
            "These calibrated values represent what the model's 2018+2022 "
            "track record implies the profile probabilities SHOULD be, "
            "given the per-bin systematic biases.  Use these as empirically-"
            "grounded targets, not the raw expert-judgment numbers."
        ),
    }


def calibrate_interaction_cell(
    base_win: float, base_draw: float,
    delta_win_pp: float, delta_draw_pp: float,
) -> dict:
    """P1: Derive empirically-calibrated interaction coefficients.

    The raw expert-judgment coefficients (e.g. Δwin=-4pp, Δdraw=+7pp) shift
    probabilities from base to target.  But both base and target may fall into
    different calibration bins with different biases.  This function computes:

      net_empirical_Δ = calibrated_post − calibrated_base

    which is the empirically-grounded version of the interaction coefficient.
    """
    target_win = base_win + delta_win_pp
    target_draw = base_draw + delta_draw_pp
    target_loss = 1.0 - target_win - target_draw

    base_cal = calibrate_wdl(base_win, base_draw, 1.0 - base_win - base_draw)
    target_cal = calibrate_wdl(target_win, target_draw, target_loss)

    return {
        "base": {"win": base_win, "draw": base_draw},
        "raw_delta": {"win_pp": delta_win_pp, "draw_pp": delta_draw_pp},
        "target_raw": {"win": target_win, "draw": target_draw},
        "base_calibrated": {
            "win": base_cal["win"]["calibrated"],
            "draw": base_cal["draw"]["calibrated"],
        },
        "target_calibrated": {
            "win": target_cal["win"]["calibrated"],
            "draw": target_cal["draw"]["calibrated"],
        },
        "empirical_delta": {
            "win_pp": round(
                (target_cal["win"]["calibrated"] - base_cal["win"]["calibrated"]) * 100, 2
            ),
            "draw_pp": round(
                (target_cal["draw"]["calibrated"] - base_cal["draw"]["calibrated"]) * 100, 2
            ),
        },
        "note": (
            "The empirical_delta represents what the interaction coefficient "
            "SHOULD be according to 2018+2022 calibration data.  Compare with "
            "raw_delta — large discrepancies suggest the expert-judgment value "
            "needs revision."
        ),
    }


# ============================================================================
# P2 Fix: λ-driven overlay architecture
# ============================================================================
# Feature-driven approach: penalty/surge/interaction act directly on WDL.
# λ values are adjusted by dose-driven multipliers in the main pipeline.
# No λ back-fitting — accept the WDL that features produce naturally.


# ============================================================================
# P7 Fix: Split physical-resistance into athletic / tactical sub-classes
# ============================================================================

# Athletic resistance: raw physicality, speed, duels (DR Congo, Senegal, Ivory Coast, Panama)
# Tactical resistance: discipline, experience, organisation (Morocco, Croatia, Egypt, Japan)

INTERACTION_MATRIX: dict[str, dict[str, tuple[float, float]]] = {
    # Favorite archetype → opponent archetype → (Δwin_pp, Δdraw_pp)
    "S-finisher": {
        "S-finisher":             ( 0.00,  0.00),
        "high-depth":             ( 0.02, -0.03),
        "unstable-low-block":     (-0.04,  0.05),
        "athletic-resistance":    (-0.03,  0.05),  # raw physicality harder for finishers
        "tactical-resistance":    (-0.01,  0.03),  # organisation can be broken by quality
        "mid-tier":               ( 0.04, -0.03),
    },
    "high-depth": {
        "S-finisher":             (-0.03,  0.02),
        "high-depth":             ( 0.01, -0.01),
        "unstable-low-block":     (-0.05,  0.06),
        "athletic-resistance":    ( 0.01,  0.04),  # depth can wear down pure athletes
        "tactical-resistance":    ( 0.03,  0.02),  # organisation cracks under late pressure
        "mid-tier":               ( 0.03, -0.02),
    },
    "unstable-low-block": {
        "S-finisher":             (-0.06,  0.05),
        "high-depth":             (-0.04,  0.04),
        "unstable-low-block":     ( 0.00,  0.02),
        "athletic-resistance":    (-0.04,  0.07),  # ⚠️ danger: Portugal vs DR Congo template
        "tactical-resistance":    (-0.03,  0.05),  # moderate: A- teams struggle vs disciplined blocks
        "mid-tier":               ( 0.02, -0.02),
    },
    "athletic-resistance": {
        "S-finisher":             (-0.06,  0.07),
        "high-depth":             (-0.05,  0.06),
        "unstable-low-block":     (-0.04,  0.06),
        "athletic-resistance":    ( 0.01,  0.04),
        "tactical-resistance":    ( 0.01,  0.02),
        "mid-tier":               (-0.03,  0.05),
    },
    "tactical-resistance": {
        "S-finisher":             (-0.04,  0.05),
        "high-depth":             (-0.03,  0.04),
        "unstable-low-block":     (-0.02,  0.05),
        "athletic-resistance":    (-0.01,  0.03),
        "tactical-resistance":    ( 0.00,  0.03),
        "mid-tier":               (-0.01,  0.03),
    },
    "mid-tier": {
        "S-finisher":             (-0.06,  0.04),
        "high-depth":             (-0.05,  0.03),
        "unstable-low-block":     (-0.03,  0.04),
        "athletic-resistance":    (-0.03,  0.06),
        "tactical-resistance":    (-0.02,  0.04),
        "mid-tier":               ( 0.00,  0.01),
    },
}

# Backward compat: "physical-resistance" maps to athletic-resistance (more common case)
INTERACTION_MATRIX["physical-resistance"] = INTERACTION_MATRIX["athletic-resistance"]


def opponent_interaction_adjustment(
    win: float, draw: float, loss: float,
    *, favorite_archetype: str = "mid-tier", opponent_archetype: str = "mid-tier",
    opponent_strength_modifier: float = 1.0,
) -> dict[str, float]:
    row = INTERACTION_MATRIX.get(favorite_archetype, {})
    raw_delta_win, raw_delta_draw = row.get(opponent_archetype, (0.0, 0.0))
    modifier = clamp(opponent_strength_modifier, 0.0, 1.0)
    delta_win, delta_draw = raw_delta_win, raw_delta_draw
    if favorite_archetype == "unstable-low-block":
        if delta_win < 0:
            delta_win *= modifier
        if delta_draw > 0:
            delta_draw *= modifier
    win_adj = clamp(win + delta_win, 0.0, 1.0)
    draw_adj = clamp(draw + delta_draw, 0.0, 1.0)
    loss_adj = clamp(1.0 - win_adj - draw_adj, 0.0, 1.0)
    total = win_adj + draw_adj + loss_adj
    return {
        "win": win_adj / total,
        "draw": draw_adj / total,
        "loss": loss_adj / total,
        "raw_delta_win": raw_delta_win,
        "raw_delta_draw": raw_delta_draw,
        "delta_win": delta_win,
        "delta_draw": delta_draw,
        "opponent_strength_modifier": modifier,
        "lambda_multipliers": interaction_lambda_multipliers(delta_win, delta_draw),
    }


def interaction_lambda_multipliers(delta_win: float, delta_draw: float) -> dict[str, float]:
    """Map interaction-matrix pp direction into bottom-layer lambda multipliers."""
    favorite = 1.0
    opponent = 1.0
    if delta_win > 0:
        favorite *= 1.0 + 2.5 * delta_win
    elif delta_win < 0:
        favorite *= 1.0 + 3.0 * delta_win
    if delta_draw > 0:
        opponent *= 1.0 + 0.86 * delta_draw
    elif delta_draw < 0 and delta_win <= 0:
        opponent *= 1.0 + 1.2 * delta_draw
    return {
        "favorite": clamp(favorite, 0.72, 1.18),
        "opponent": clamp(opponent, 0.84, 1.14),
    }


# ============================================================================
# P8+P9: match_stage and match_motivation modifiers
# ============================================================================

def stage_multiplier(match_stage: str = "group") -> dict[str, float]:
    """Return (low_block_penalty_mult, surge_mult) for match stage.

    P8: Knockout matches amplify conservative tendencies and dampen surge.
    """
    if match_stage in ("round_of_32", "round_of_16", "quarter", "semi", "final"):
        return {"low_block_penalty": 1.25, "surge": 0.80}
    return {"low_block_penalty": 1.00, "surge": 1.00}


def motivation_adjustment(
    motivation: str = "neutral",
) -> dict[str, float]:
    """P9: Return (λ_scale, penalty_scale) based on round-3 qualification state.

    motivation values:
      "already_qualified" — team has secured advancement
      "must_win"          — team must win to advance
      "draw_enough"       — a draw secures advancement
      "neutral"           — standard match, no special motivation effect
    """
    if motivation == "already_qualified":
        # May rotate squad, lower intensity → scale λ down, reduce penalty
        return {"lambda_scale": 0.88, "penalty_scale": 0.70}
    elif motivation == "must_win":
        # Desperation mode → push harder, penalty less relevant (they'll risk it)
        return {"lambda_scale": 1.08, "penalty_scale": 0.60}
    elif motivation == "draw_enough":
        # Extreme conservatism → low-block penalty amplified
        return {"lambda_scale": 0.90, "penalty_scale": 1.35}
    return {"lambda_scale": 1.00, "penalty_scale": 1.00}


# ============================================================================
# P2 Complete: λ-driven V3.3 overlay pipeline
# ============================================================================

def v33_overlay_wdl(
    base_win: float,
    base_draw: float,
    base_loss: float,
    *,
    base_λa: float | None = None,
    base_λb: float | None = None,
    favorite_archetype: str = "mid-tier",
    opponent_archetype: str = "mid-tier",
    low_block_triggers: list[str] | None = None,
    opponent_physical_grade: float = 0.0,
    surge_conditions: list[str] | None = None,
    match_stage: str = "group",
    motivation: str = "neutral",
    opponent_strength_modifier: float = 1.0,
    profile_name: str = "default",
) -> dict:
    """Full V3.3 r5 lambda-multiplier overlay pipeline.

    Architecture:
      1. Base WDL + base lambdas
      2. Opponent interaction deltas → lambda multipliers
      3. LowBlockConversionPenalty → lambda multipliers
      4. SecondHalfSurgeFactor → lambda multipliers / HT-FT route
      5. Apply match_stage + motivation modifiers
      6. Derive WDL, handicap and totals from one Poisson matrix
      7. Danger Zone is selector guard only, not a model override

    When base_λa/base_λb are omitted, the helper reports the multipliers but
    keeps final WDL at the base triplet.
    """
    stage = stage_multiplier(match_stage)
    motiv = motivation_adjustment(motivation)

    # ---- Step 1: base ----
    w, d, l = base_win, base_draw, base_loss

    # ---- Step 2: opponent interaction ----
    interaction = opponent_interaction_adjustment(
        w, d, l,
        favorite_archetype=favorite_archetype,
        opponent_archetype=opponent_archetype,
        opponent_strength_modifier=opponent_strength_modifier,
    )
    wi, di, li = interaction["win"], interaction["draw"], interaction["loss"]

    # ---- Step 3: low-block penalty (target only) ----
    penalty_score = score_low_block_penalty(low_block_triggers)
    penalty_score *= stage["low_block_penalty"] * motiv["penalty_scale"]
    penalty_score = clamp(penalty_score, 0.0, 1.0)

    # ---- Step 4: second-half surge (target only) ----
    surge_score = score_second_half_surge(surge_conditions)
    surge_score *= stage["surge"]
    surge_score = clamp(surge_score, 0.0, 1.0)

    # ---- r5: feature -> lambda multipliers -> score matrix ----
    lambda_multipliers = dict(interaction["lambda_multipliers"])
    effective_penalty = clamp(penalty_score * opponent_physical_grade, 0.0, 1.0)
    is_danger_zone = (
        favorite_archetype == "unstable-low-block"
        and opponent_archetype == "athletic-resistance"
        and penalty_score > 0.60
    )
    adjusted_lambdas = None
    matrix = None
    final_win, final_draw, final_loss = w, d, l
    consistency_warning = ""

    if base_λa is not None and base_λb is not None:
        lambda_a = base_λa * lambda_multipliers["favorite"]
        lambda_b = base_λb * lambda_multipliers["opponent"]
        if favorite_archetype == "unstable-low-block":
            unstable_scale = interaction["opponent_strength_modifier"]
            lambda_a *= 1.0 - 0.04 * unstable_scale
            lambda_b *= 1.0 + 0.02 * unstable_scale
        lambda_a *= 1.0 - 0.08 * effective_penalty
        lambda_b *= 1.0 + 0.08 * effective_penalty
        lambda_a *= 1.0 + 0.08 * surge_score
        lambda_b *= 1.0 + 0.03 * surge_score
        lambda_a *= motiv["lambda_scale"]
        lambda_b *= motiv["lambda_scale"]
        adjusted_lambdas = {
            "lambda_a": round(max(lambda_a, 0.10), 4),
            "lambda_b": round(max(lambda_b, 0.10), 4),
        }
        matrix = matrix_summary(adjusted_lambdas["lambda_a"], adjusted_lambdas["lambda_b"], profile_name)
        final_win = matrix["wdl"]["a_win"]
        final_draw = matrix["wdl"]["draw"]
        final_loss = matrix["wdl"]["b_win"]
    else:
        consistency_warning = (
            "R5 lambda multipliers computed, but base lambdas were not provided; "
            "final WDL remains the base triplet. Pass --base-lambda-a and --base-lambda-b "
            "to derive WDL/handicap/total goals from the adjusted Poisson matrix."
        )

    if is_danger_zone:
        consistency_warning = (
            (consistency_warning + " " if consistency_warning else "")
            + "DANGER-ZONE SELECTOR GUARD: keep the model lambda-driven; mark extreme risk and avoid HAD singles."
        )

    cal = calibrate_wdl(final_win, final_draw, final_loss)
    return {
        "base": {"win": round(w, 4), "draw": round(d, 4), "loss": round(l, 4)},
        "interaction": {
            "win": round(interaction["win"], 4),
            "draw": round(interaction["draw"], 4),
            "loss": round(interaction["loss"], 4),
            "raw_delta_win": round(interaction["raw_delta_win"], 4),
            "raw_delta_draw": round(interaction["raw_delta_draw"], 4),
            "delta_win": round(interaction["delta_win"], 4),
            "delta_draw": round(interaction["delta_draw"], 4),
            "opponent_strength_modifier": round(interaction["opponent_strength_modifier"], 4),
            "lambda_multipliers": lambda_multipliers,
        },
        "low_block_penalty_score": round(penalty_score, 4),
        "effective_penalty": round(effective_penalty, 4),
        "second_half_surge_score": round(surge_score, 4),
        "match_stage": match_stage,
        "motivation": motivation,
        "danger_zone": is_danger_zone,
        "auto_corrected": False,
        "consistency_warning": consistency_warning,
        "adjusted_lambdas": adjusted_lambdas,
        "score_matrix": matrix,
        "final": {
            "win": round(final_win, 4),
            "draw": round(final_draw, 4),
            "loss": round(final_loss, 4),
        },
        "empirical_calibration": {
            **cal,
            "applied": False,
            "note": "Preview only in r5. Final WDL stays derived from adjusted lambdas so every play remains matrix-consistent.",
        },
    }


def _bin_sample_sizes() -> list[tuple[float, float, float, int]]:
    """Return (lo, hi, bias, n) from the PDF calibration data."""
    return [
        (0.00, 0.10, +2.9, 89),
        (0.10, 0.20, -0.7, 43),
        (0.20, 0.30,  0.0, 28),
        (0.30, 0.40, +1.8, 19),
        (0.40, 0.50, -3.3, 12),
        (0.50, 0.60, +7.5,  8),
        (0.60, 0.70, +1.7,  6),
        (0.70, 0.80,  0.0,  4),
        (0.80, 0.90, +15.0, 2),
        (0.90, 1.00, +5.0,  1),
    ]


# ============================================================================
# Half-time λ split (unchanged core, P3 dose integrated)
# ============================================================================

def split_half_lambdas(
    lambda_ft: float,
    surge_score: float = 0.0,
    *, base_fh_share: float = 0.44,
) -> dict[str, float]:
    lambda_fh = base_fh_share * lambda_ft * (1.0 - 0.05 * surge_score)
    lambda_sh = (1.0 - base_fh_share) * lambda_ft * (1.0 + 0.30 * surge_score)
    return {"lambda_fh": max(lambda_fh, 0.10), "lambda_sh": max(lambda_sh, 0.10)}


# ============================================================================
# Score matrix (unchanged V3.2 core)
# ============================================================================

def iter_score_matrix(
    lambda_a: float, lambda_b: float, max_goals: int = 5,
    profile: StateProfile = PROFILES["default"],
) -> Iterable[tuple[int, int, float]]:
    states = [
        (profile.normal, lambda_a, lambda_b),
        (profile.low_block, 0.82 * lambda_a, 0.82 * lambda_b),
        (profile.collapse, 1.35 * lambda_a, 0.90 * lambda_b),
    ]
    for a_goals in range(max_goals + 1):
        for b_goals in range(max_goals + 1):
            p = 0.0
            for weight, la, lb in states:
                p += weight * poisson_pmf(a_goals, la) * poisson_pmf(b_goals, lb)
            yield a_goals, b_goals, p


def matrix_summary(
    lambda_a: float, lambda_b: float, profile_name: str, max_goals: int = 5,
) -> dict:
    profile = PROFILES[profile_name]
    cells = list(iter_score_matrix(lambda_a, lambda_b, max_goals, profile))
    total = sum(p for _, _, p in cells)
    cells = [(a, b, p / total) for a, b, p in cells]
    a_win = sum(p for a, b, p in cells if a > b)
    draw = sum(p for a, b, p in cells if a == b)
    b_win = sum(p for a, b, p in cells if a < b)
    a_minus_1 = sum(p for a, b, p in cells if a - b > 1)
    a_minus_2 = sum(p for a, b, p in cells if a - b > 2)
    a_plus_1 = sum(p for a, b, p in cells if a + 1 > b)
    top_scores = sorted(cells, key=lambda item: item[2], reverse=True)[:5]
    return {
        "profile": profile_name,
        "lambda_a": lambda_a,
        "lambda_b": lambda_b,
        "wdl": {"a_win": a_win, "draw": draw, "b_win": b_win},
        "double_chance": {"1X": a_win + draw, "X2": draw + b_win, "12": a_win + b_win},
        "handicap": {
            "a_minus_1_cover": a_minus_1,
            "a_minus_2_cover": a_minus_2,
            "a_plus_1_cover": a_plus_1,
        },
        "top_scores": [{"score": f"{a}-{b}", "probability": p} for a, b, p in top_scores],
    }


# ============================================================================
# Calibration and Elo (unchanged)
# ============================================================================

def elo_expected_win(rating_a: float, rating_b: float, scale: float = 400.0) -> float:
    return 1.0 / (1.0 + 10 ** (-(rating_a - rating_b) / scale))


def calibrate_probability(probability: float) -> float:
    p = probability * 100.0
    if p < 5:
        p += 1.5
    elif p < 10:
        p += 0.8
    elif p < 15:
        p += 0.3
    elif p < 20:
        p += 0.0
    elif p <= 25:
        p -= 0.5
    else:
        p -= 1.0
    return clamp(p / 100.0, 0.0, 1.0)


def print_json(data: object) -> None:
    print(json.dumps(data, ensure_ascii=False, indent=2))


# ============================================================================
# CLI
# ============================================================================

ALL_ARCHETYPES = [
    "S-finisher", "high-depth", "unstable-low-block",
    "athletic-resistance", "tactical-resistance", "mid-tier",
    # backward compat:
    "physical-resistance",
]


def main() -> None:
    parser = argparse.ArgumentParser(description="World Cup V3.2/V3.3 helper")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # ---- V3.2 ----
    draw = sub.add_parser("draw")
    draw.add_argument("--played", type=int, required=True)
    draw.add_argument("--draws", type=int, required=True)
    draw.add_argument("--p0", type=float, default=0.24)
    draw.add_argument("--n0", type=float, default=20)

    sij = sub.add_parser("sij")
    sij.add_argument("--sij", type=float, required=True)

    matrix = sub.add_parser("matrix")
    matrix.add_argument("--lambda-a", type=float, required=True)
    matrix.add_argument("--lambda-b", type=float, required=True)
    matrix.add_argument("--profile", choices=sorted(PROFILES), default="default")
    matrix.add_argument("--max-goals", type=int, default=5)

    elo = sub.add_parser("elo")
    elo.add_argument("--a", type=float, required=True)
    elo.add_argument("--b", type=float, required=True)
    elo.add_argument("--scale", type=float, default=400.0)

    cal = sub.add_parser("calibrate")
    cal.add_argument("--probability", type=float, required=True)

    # ---- V3.3 ----

    v33_wdl = sub.add_parser("v33-wdl", help="V3.3 λ-driven overlay pipeline")
    v33_wdl.add_argument("--win", type=float, required=True)
    v33_wdl.add_argument("--draw", type=float, required=True)
    v33_wdl.add_argument("--loss", type=float, required=True)
    v33_wdl.add_argument("--base-lambda-a", type=float, default=None,
                         help="Base λa for λ-driven mode (recommended)")
    v33_wdl.add_argument("--base-lambda-b", type=float, default=None,
                         help="Base λb for λ-driven mode (recommended)")
    v33_wdl.add_argument("--favorite-archetype", choices=ALL_ARCHETYPES, default="mid-tier")
    v33_wdl.add_argument("--opponent-archetype", choices=ALL_ARCHETYPES, default="mid-tier")
    v33_wdl.add_argument("--opponent-strength-modifier", type=float, default=1.0)
    v33_wdl.add_argument("--low-block-triggers", nargs="*", choices=LOW_BLOCK_TRIGGERS, default=[])
    v33_wdl.add_argument("--opponent-physical-grade", type=float, default=0.0)
    v33_wdl.add_argument("--surge-conditions", nargs="*", choices=SURGE_CONDITIONS, default=[])
    v33_wdl.add_argument("--match-stage",
                         choices=["group", "round_of_32", "round_of_16", "quarter", "semi", "final"],
                         default="group")
    v33_wdl.add_argument("--motivation",
                         choices=["neutral", "already_qualified", "must_win", "draw_enough"],
                         default="neutral")
    v33_wdl.add_argument("--profile", choices=sorted(PROFILES), default="default")

    v33_half = sub.add_parser("v33-half-lambda")
    v33_half.add_argument("--lambda-ft", type=float, required=True)
    v33_half.add_argument("--surge-conditions", nargs="*", choices=SURGE_CONDITIONS, default=[])
    v33_half.add_argument("--fh-share", type=float, default=0.44)

    v33_int = sub.add_parser("v33-interaction")
    v33_int.add_argument("--favorite", choices=ALL_ARCHETYPES, required=True)
    v33_int.add_argument("--opponent", choices=ALL_ARCHETYPES, required=True)

    # dose debug
    v33_dose = sub.add_parser("v33-dose", help="Show sigmoid dose curve values")
    v33_dose.add_argument("--triggers", type=int, required=True,
                          help="Trigger count (0-6)")

    # P1+P6 empirical calibration
    v33_cal_profile = sub.add_parser(
        "v33-calibrate-profile", help="P6: Empirically calibrate profile triplet"
    )
    v33_cal_profile.add_argument("--win", type=float, required=True)
    v33_cal_profile.add_argument("--draw", type=float, required=True)
    v33_cal_profile.add_argument("--loss", type=float, required=True)
    v33_cal_profile.add_argument("--label", type=str, default="custom")

    v33_cal_cell = sub.add_parser(
        "v33-calibrate-cell",
        help="P1: Derive empirically-calibrated interaction coefficients",
    )
    v33_cal_cell.add_argument("--base-win", type=float, required=True)
    v33_cal_cell.add_argument("--base-draw", type=float, required=True)
    v33_cal_cell.add_argument("--delta-win-pp", type=float, required=True)
    v33_cal_cell.add_argument("--delta-draw-pp", type=float, required=True)

    v33_cal_matrix = sub.add_parser(
        "v33-calibrate-matrix", help="P1: Full 6x6 calibrated interaction matrix"
    )

    args = parser.parse_args()

    if args.cmd == "draw":
        print_json({"draw_base": draw_posterior(args.played, args.draws, args.p0, args.n0)})
    elif args.cmd == "sij":
        print_json(simplified_wdl_from_sij(args.sij))
    elif args.cmd == "matrix":
        pn = args.profile
        if pn == "early-ease":
            pn = "balanced"  # P5: auto-demote deprecated profile
        print_json(matrix_summary(args.lambda_a, args.lambda_b, pn, args.max_goals))
    elif args.cmd == "elo":
        print_json({"expected_win_a": elo_expected_win(args.a, args.b, args.scale)})
    elif args.cmd == "calibrate":
        print_json({"calibrated_probability": calibrate_probability(args.probability)})

    elif args.cmd == "v33-wdl":
        result = v33_overlay_wdl(
            base_win=args.win, base_draw=args.draw, base_loss=args.loss,
            base_λa=args.base_lambda_a, base_λb=args.base_lambda_b,
            favorite_archetype=args.favorite_archetype,
            opponent_archetype=args.opponent_archetype,
            low_block_triggers=args.low_block_triggers or None,
            opponent_physical_grade=args.opponent_physical_grade,
            surge_conditions=args.surge_conditions or None,
            match_stage=args.match_stage,
            motivation=args.motivation,
            opponent_strength_modifier=args.opponent_strength_modifier,
            profile_name=args.profile,
        )
        print_json(result)

    elif args.cmd == "v33-half-lambda":
        surge_score = score_second_half_surge(args.surge_conditions or None)
        lambdas = split_half_lambdas(args.lambda_ft, surge_score, base_fh_share=args.fh_share)
        print_json({
            "lambda_ft": args.lambda_ft,
            "surge_score": round(surge_score, 4),
            **lambdas,
        })

    elif args.cmd == "v33-interaction":
        row = INTERACTION_MATRIX.get(args.favorite, {})
        delta_win, delta_draw = row.get(args.opponent, (0.0, 0.0))
        print_json({
            "favorite_archetype": args.favorite,
            "opponent_archetype": args.opponent,
            "delta_win_pp": delta_win,
            "delta_draw_pp": delta_draw,
        })

    elif args.cmd == "v33-dose":
        for n in range(args.triggers + 1):
            print_json({
                "triggers": n,
                "sigmoid_dose": round(sigmoid_dose(n), 4),
            })

    elif args.cmd == "v33-calibrate-profile":
        result = calibrate_profile(args.win, args.draw, args.loss)
        result["label"] = args.label
        print_json(result)

    elif args.cmd == "v33-calibrate-cell":
        result = calibrate_interaction_cell(
            args.base_win, args.base_draw,
            args.delta_win_pp, args.delta_draw_pp,
        )
        print_json(result)

    elif args.cmd == "v33-calibrate-matrix":
        # Generate full 6x6 calibrated matrix
        # Each cell: given the raw expert δ, compute empirical δ
        archs = ["S-finisher", "high-depth", "unstable-low-block",
                 "athletic-resistance", "tactical-resistance", "mid-tier"]
        # Representative base WDL for each favorite archetype (same-tier baseline)
        base_wdl = {
            "S-finisher": (0.65, 0.24),
            "high-depth": (0.60, 0.22),
            "unstable-low-block": (0.55, 0.35),
            "athletic-resistance": (0.35, 0.38),
            "tactical-resistance": (0.38, 0.35),
            "mid-tier": (0.42, 0.35),
        }
        raw_matrix: dict = {}
        cal_matrix: dict = {}
        for fav in archs:
            raw_matrix[fav] = {}
            cal_matrix[fav] = {}
            bw, bd = base_wdl[fav]
            for opp in archs:
                row = INTERACTION_MATRIX.get(fav, {})
                dw, dd = row.get(opp, (0.0, 0.0))
                raw_matrix[fav][f"{opp}"] = f"{dw:+.2f}/{dd:+.2f}"
                cal = calibrate_interaction_cell(bw, bd, dw, dd)
                ed = cal["empirical_delta"]
                cal_matrix[fav][f"{opp}"] = f"{ed['win_pp']:+.2f}/{ed['draw_pp']:+.2f}"
        print_json({
            "expert_judgment_raw": raw_matrix,
            "empirically_calibrated": cal_matrix,
            "note": (
                "Raw = expert-judgment (Δwin_pp / Δdraw_pp). "
                "Calibrated = 2018+2022 empirical correction applied. "
                "Large discrepancies indicate cells where expert judgment "
                "does not match the model's own historical track record."
            ),
        })


if __name__ == "__main__":
    main()
