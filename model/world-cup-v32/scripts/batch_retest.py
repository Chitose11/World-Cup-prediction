#!/usr/bin/env python3
"""批量复测2026世界杯小组赛全部40场已完成比赛"""
import sys, json
sys.path.insert(0, '.')
from world_cup_v32_helpers import *

# 球队原型分类 (r5修订: 挪威S→high-depth, 伊朗tactical→athletic, 佛得角→athletic, 荷兰→high-depth)
TEAM_ARCHETYPE = {
    # S级终结型 (r5: 挪威移出)
    "France": "S-finisher", "Argentina": "S-finisher", "Germany": "S-finisher",
    # A级高深度 (r4: 挪威加入, r5: 荷兰加入)
    "England": "high-depth", "Norway": "high-depth", "Netherlands": "high-depth",
    # A-破低位不稳
    "Portugal": "unstable-low-block", "Spain": "unstable-low-block",
    "Belgium": "unstable-low-block", "Uruguay": "unstable-low-block",
    # 身体抗压·运动型 (r5: 伊朗+佛得角加入)
    "DR Congo": "athletic-resistance", "Senegal": "athletic-resistance",
    "Ivory Coast": "athletic-resistance", "Panama": "athletic-resistance",
    "Iran": "athletic-resistance", "Cape Verde": "athletic-resistance",
    # 身体抗压·战术型
    "Morocco": "tactical-resistance", "Croatia": "tactical-resistance",
    "Egypt": "tactical-resistance", "Japan": "tactical-resistance",
    # 中游热门
    "Korea": "mid-tier", "Ghana": "mid-tier",
    "Austria": "mid-tier", "Switzerland": "mid-tier", "Colombia": "mid-tier",
    "USA": "mid-tier", "Mexico": "mid-tier", "Australia": "mid-tier",
    "Canada": "mid-tier", "Sweden": "mid-tier", "Scotland": "mid-tier",
    "Czechia": "mid-tier", "Paraguay": "mid-tier", "Ecuador": "mid-tier",
    "Tunisia": "mid-tier", "Saudi Arabia": "mid-tier", "Qatar": "mid-tier",
    "Bosnia": "mid-tier", "Turkey": "mid-tier", "South Africa": "mid-tier",
    "Algeria": "mid-tier", "Jordan": "mid-tier", "Iraq": "mid-tier",
    "Uzbekistan": "mid-tier", "New Zealand": "mid-tier",
    "Haiti": "mid-tier", "Curacao": "mid-tier", "Brazil": "mid-tier",
}

# 种子Elo (从model-core.md)
ELO = {
    "Spain": 2090, "Argentina": 2047, "France": 2041, "Brazil": 1990,
    "England": 1974, "Colombia": 1970, "Portugal": 1967, "Netherlands": 1951,
    "Germany": 1940, "Morocco": 1918, "Croatia": 1895, "Uruguay": 1882,
    "Switzerland": 1868, "Japan": 1845, "Senegal": 1832, "Iran": 1818,
    "Korea": 1805, "Ecuador": 1798, "Australia": 1785, "Austria": 1780,
    "USA": 1775, "Mexico": 1770, "Canada": 1750, "Sweden": 1745,
    "Scotland": 1740, "Czechia": 1735, "Paraguay": 1730, "Egypt": 1725,
    "Ghana": 1720, "Ivory Coast": 1715, "Saudi Arabia": 1710, "Qatar": 1705,
    "Turkey": 1700, "Tunisia": 1695, "Algeria": 1690, "Norway": 1880,
    "DR Congo": 1670, "Panama": 1665, "Jordan": 1650, "Iraq": 1645,
    "Uzbekistan": 1640, "New Zealand": 1635, "Haiti": 1630, "Curacao": 1625,
    "Cape Verde": 1675, "Bosnia": 1705, "South Africa": 1685, "Belgium": 1920,
}

# 所有40场比赛 [match_id, team_a, team_b, result, group, round]
MATCHES = [
    # === R1 ===
    (1, "Mexico", "South Africa", "2-0", "A", 1),
    (2, "Korea", "Czechia", "2-1", "A", 1),
    (3, "Canada", "Bosnia", "1-1", "B", 1),
    (4, "USA", "Paraguay", "4-1", "D", 1),
    (5, "Brazil", "Morocco", "1-1", "C", 1),
    (6, "Australia", "Turkey", "2-0", "D", 1),
    (7, "Haiti", "Scotland", "0-1", "C", 1),
    (8, "Qatar", "Switzerland", "1-1", "B", 1),
    (9, "Germany", "Curacao", "7-1", "E", 1),
    (10, "Ivory Coast", "Ecuador", "1-0", "E", 1),
    (11, "Netherlands", "Japan", "2-2", "F", 1),
    (12, "Sweden", "Tunisia", "5-1", "F", 1),
    (13, "Spain", "Cape Verde", "0-0", "H", 1),
    (14, "Saudi Arabia", "Uruguay", "1-1", "H", 1),
    (15, "Belgium", "Egypt", "1-1", "G", 1),
    (16, "Iran", "New Zealand", "2-2", "G", 1),
    (17, "France", "Senegal", "3-1", "I", 1),
    (18, "Iraq", "Norway", "1-4", "I", 1),
    (19, "Argentina", "Algeria", "3-0", "J", 1),
    (20, "Austria", "Jordan", "3-1", "J", 1),
    (21, "England", "Croatia", "4-2", "L", 1),
    (22, "Ghana", "Panama", "1-0", "L", 1),
    (23, "Portugal", "DR Congo", "1-1", "K", 1),
    (24, "Uzbekistan", "Colombia", "1-3", "K", 1),
    # === R2 A-H ===
    (25, "Czechia", "South Africa", "1-1", "A", 2),
    (26, "Switzerland", "Bosnia", "4-1", "B", 2),
    (27, "Canada", "Qatar", "6-0", "B", 2),
    (28, "Mexico", "Korea", "1-0", "A", 2),
    (29, "USA", "Australia", "2-0", "D", 2),
    (30, "Scotland", "Morocco", "0-1", "C", 2),
    (31, "Brazil", "Haiti", "3-0", "C", 2),
    (32, "Turkey", "Paraguay", "0-1", "D", 2),
    (33, "Germany", "Ivory Coast", "2-1", "E", 2),
    (34, "Ecuador", "Curacao", "0-0", "E", 2),
    (35, "Netherlands", "Sweden", "5-1", "F", 2),
    (36, "Tunisia", "Japan", "0-4", "F", 2),
    (37, "Spain", "Saudi Arabia", "4-0", "H", 2),
    (38, "Uruguay", "Cape Verde", "2-2", "H", 2),
    (39, "Belgium", "Iran", "0-0", "G", 2),
    (40, "New Zealand", "Egypt", "1-3", "G", 2),
]

def get_archetype(team):
    return TEAM_ARCHETYPE.get(team, "mid-tier")

def calc_sij(team_a, team_b):
    ea = ELO.get(team_a, 1700)
    eb = ELO.get(team_b, 1700)
    return (ea - eb) / 200.0  # approximate z-score

def sij_to_lambdas(sij: float):
    """Map Sij to base Poisson lambda pair (favorite, underdog)."""
    if sij > 1.50:
        return 2.30, 0.45   # huge mismatch
    elif sij > 0.80:
        return 1.55, 0.85   # medium advantage
    elif sij > 0.30:
        return 1.30, 1.00   # small advantage
    elif sij > -0.30:
        return 1.15, 1.15   # coin flip
    elif sij > -0.80:
        return 1.00, 1.30   # small advantage (B-side)
    elif sij > -1.50:
        return 0.85, 1.55   # medium advantage (B-side)
    else:
        return 0.45, 2.30   # huge mismatch (B-side)

def parse_result(result_str):
    parts = result_str.split("-")
    return int(parts[0]), int(parts[1])

def result_to_wdl(a_goals, b_goals):
    if a_goals > b_goals: return "win"
    elif a_goals == b_goals: return "draw"
    else: return "loss"

def analyze_match(match):
    mid, team_a, team_b, result, group, rd = match
    a_goals, b_goals = parse_result(result)
    actual = result_to_wdl(a_goals, b_goals)

    archetype_a = get_archetype(team_a)
    archetype_b = get_archetype(team_b)
    sij = calc_sij(team_a, team_b)

    # Base WDL from Sij table
    base = simplified_wdl_from_sij(sij)

    # Determine if A is favorite (positive Sij = A stronger)
    is_fav_a = sij >= 0
    fav_arch = archetype_a if is_fav_a else archetype_b
    opp_arch = archetype_b if is_fav_a else archetype_a

    if is_fav_a:
        fav_team, opp_team = team_a, team_b
        fav_win, fav_draw, fav_loss = base["a_win"], base["draw"], base["b_win"]
        fav_elo, opp_elo = ELO.get(team_a, 1700), ELO.get(team_b, 1700)
    else:
        fav_team, opp_team = team_b, team_a
        fav_win, fav_draw, fav_loss = base["b_win"], base["draw"], base["a_win"]
        fav_elo, opp_elo = ELO.get(team_b, 1700), ELO.get(team_a, 1700)

    # Compute base lambdas from Sij: always returns (favorite_λ, underdog_λ)
    base_λa, base_λb = sij_to_lambdas(abs(sij))

    # r5: opponent strength modifier for A- teams against weak opponents
    elo_gap = fav_elo - opp_elo
    opponent_strength_mod = 1.0
    if fav_arch == "unstable-low-block" and elo_gap > 30:
        opponent_strength_mod = max(0.5, 1.0 - 0.5 * (elo_gap - 30) / 120.0)

    # Determine if we should apply V3.3 corrections
    apply_lb = False
    lb_triggers = []
    if fav_arch == "unstable-low-block" and opp_arch in ("athletic-resistance", "tactical-resistance"):
        apply_lb = True
        lb_triggers = ["older_or_slower_cf", "low_recent_sot_rate", "tempo_drops_after_lead", "opponent_fast_counter"]
    elif fav_arch in ("S-finisher", "high-depth") and opp_arch in ("athletic-resistance", "tactical-resistance"):
        apply_lb = True
        lb_triggers = ["opponent_fast_counter"]

    apply_surge = False
    surge_conds = []
    if fav_arch == "high-depth":
        apply_surge = True
        surge_conds = ["strong_bench_depth", "strong_coach_adjustment", "opponent_defensive_age", "multiple_scoring_points"]
    elif fav_arch == "S-finisher" and opp_arch in ("tactical-resistance", "mid-tier"):
        apply_surge = True
        surge_conds = ["strong_bench_depth", "multiple_scoring_points"]

    opp_grade = 0.8 if opp_arch == "athletic-resistance" else (0.5 if opp_arch == "tactical-resistance" else 0.3)

    # Determine if this matchup needs λ-driven pipeline (archetype-specific effects exist)
    needs_lambda = (
        fav_arch in ("S-finisher", "high-depth", "unstable-low-block") and
        opp_arch in ("athletic-resistance", "tactical-resistance")
    ) or (
        fav_arch in ("athletic-resistance", "tactical-resistance") and
        opp_arch in ("S-finisher", "high-depth", "unstable-low-block")
    ) or (
        fav_arch == "high-depth"  # always use λ for high-depth to get surge effects
    ) or (
        fav_arch == "unstable-low-block" and opp_arch == "mid-tier" and elo_gap <= 200
    )

    # Pick score-matrix profile
    if fav_arch == "S-finisher" and opp_arch != "athletic-resistance":
        matrix_profile = "elite-finisher"
    elif fav_arch == "S-finisher" and opp_arch == "athletic-resistance":
        matrix_profile = "defensive-favorite"
    elif fav_arch == "high-depth":
        matrix_profile = "high-depth"
    elif fav_arch == "unstable-low-block" and opp_arch == "athletic-resistance":
        matrix_profile = "defensive-favorite"
    elif fav_arch == "unstable-low-block":
        matrix_profile = "unstable-low-block"
    else:
        matrix_profile = "balanced"

    # Run V3.3 r5 pipeline
    v33 = v33_overlay_wdl(
        base_win=fav_win, base_draw=fav_draw, base_loss=fav_loss,
        base_λa=base_λa if needs_lambda else None,
        base_λb=base_λb if needs_lambda else None,
        favorite_archetype=fav_arch,
        opponent_archetype=opp_arch,
        opponent_strength_modifier=opponent_strength_mod,
        low_block_triggers=lb_triggers if apply_lb else [],
        opponent_physical_grade=opp_grade,
        surge_conditions=surge_conds if apply_surge else [],
        match_stage="group",
        motivation="neutral",
        profile_name=matrix_profile,
    )

    final = v33["final"]
    emp = v33["empirical_calibration"]

    # Use interaction-adjusted WDL for non-λ matches, matrix-derived for λ matches
    if needs_lambda and v33["score_matrix"] is not None:
        fav_win_final = final["win"]
        fav_draw_final = final["draw"]
        fav_loss_final = final["loss"]
    else:
        # For mid-tier matchups, use interaction-adjusted Sij WDL (preserves empirical calibration)
        interaction = v33["interaction"]
        fav_win_final = interaction["win"]
        fav_draw_final = interaction["draw"]
        fav_loss_final = interaction["loss"]

    # Map back to team_a perspective
    if is_fav_a:
        a_win_p = fav_win_final
        draw_p = fav_draw_final
        b_win_p = fav_loss_final
    else:
        a_win_p = fav_loss_final
        draw_p = fav_draw_final
        b_win_p = fav_win_final

    # WDL single pick
    if a_win_p >= 0.55:
        wdl_single = "A胜"
    elif b_win_p >= 0.55:
        wdl_single = "B胜"
    elif draw_p >= 0.30:
        wdl_single = "平局"
    else:
        wdl_single = "无明确单选"

    # Safe direction
    if a_win_p + draw_p >= 0.75:
        safe = "A不败(1X)"
    elif b_win_p + draw_p >= 0.75:
        safe = "B不败(X2)"
    else:
        safe = "无明确方向"

    # HT/FT recommendation
    if fav_arch == "S-finisher" and not apply_lb:
        htft_main = "胜胜" if is_fav_a else "负负"
        htft_backup = "平胜" if is_fav_a else "平负"
    elif fav_arch == "high-depth":
        htft_main = "平胜" if is_fav_a else "平负"
        htft_backup = "胜胜" if is_fav_a else "负负"
    elif fav_arch == "unstable-low-block" and opp_arch in ("athletic-resistance", "tactical-resistance"):
        htft_main = "平胜/平平"
        htft_backup = "平平/平胜"
    elif fav_arch == "unstable-low-block":
        htft_main = "平胜" if is_fav_a else "平负"
        htft_backup = "平平"
    else:
        htft_main = "平胜" if is_fav_a else "平负"
        htft_backup = "胜胜" if is_fav_a else "负负"

    # Risk grade
    if a_win_p >= 0.68 and draw_p <= 0.25:
        risk = "A"
    elif max(a_win_p, b_win_p) + draw_p >= 0.78 and max(a_win_p, b_win_p) < 0.68:
        risk = "B"
    elif draw_p >= 0.33 or max(a_win_p, b_win_p) - draw_p < 0.12:
        risk = "C"
    else:
        risk = "D"

    # Handicap
    if a_win_p >= 0.70 and draw_p <= 0.24:
        hcap = f"{team_a} -1 可看"
    elif b_win_p >= 0.70 and draw_p <= 0.24:
        hcap = f"{team_b} -1 可看"
    elif a_win_p >= 0.55:
        hcap = f"{team_a} -1 谨慎"
    elif b_win_p >= 0.55:
        hcap = f"{team_b} -1 谨慎"
    else:
        hcap = "不推荐让球"

    # 适配串关
    suit_acca = risk in ("A", "B") and v33["auto_corrected"] == False

    # Check WDL hit
    if wdl_single == "A胜" and actual == "win":
        wdl_hit = True
    elif wdl_single == "B胜" and actual == "loss":
        wdl_hit = True
    elif wdl_single == "平局" and actual == "draw":
        wdl_hit = True
    else:
        wdl_hit = False

    # Check safe direction hit
    if safe == "A不败(1X)" and actual in ("win", "draw"):
        safe_hit = True
    elif safe == "B不败(X2)" and actual in ("loss", "draw"):
        safe_hit = True
    else:
        safe_hit = False

    return {
        "id": mid, "match": f"{team_a} vs {team_b}", "result": result,
        "group": group, "round": rd,
        "actual": actual,
        "arch_a": archetype_a, "arch_b": archetype_b,
        "sij": round(sij, 2),
        "fav": fav_team, "fav_arch": fav_arch, "opp_arch": opp_arch,
        "base_wdl": {"a_win": round(base["a_win"], 3), "draw": round(base["draw"], 3), "b_win": round(base["b_win"], 3)},
        "v33_wdl": {"a_win": round(a_win_p, 3), "draw": round(draw_p, 3), "b_win": round(b_win_p, 3)},
        "emp_cal": {
            "a_win": round(emp["win"]["calibrated"] if is_fav_a else emp["loss"]["calibrated"], 3),
            "draw": round(emp["draw"]["calibrated"], 3),
            "b_win": round(emp["loss"]["calibrated"] if is_fav_a else emp["win"]["calibrated"], 3),
        },
        "wdl_single": wdl_single,
        "safe": safe,
        "htft": f"{htft_main}/{htft_backup}",
        "hcap": hcap,
        "risk": risk,
        "acca": suit_acca,
        "auto_corrected": v33["auto_corrected"],
        "lb_score": round(v33["low_block_penalty_score"], 3),
        "surge_score": round(v33["second_half_surge_score"], 3),
        "wdl_hit": wdl_hit,
        "safe_hit": safe_hit,
        "interaction": f"{fav_arch} vs {opp_arch}",
    }

# Run all
results = []
for m in MATCHES:
    try:
        r = analyze_match(m)
        results.append(r)
    except Exception as e:
        print(f"Error on match {m[0]} {m[1]} vs {m[2]}: {e}", file=sys.stderr)

# Print summary as JSON
output = {
    "draw_base": draw_posterior(40, 13, 0.24, 20),
    "total_matches": len(results),
    "results": results,
    "stats": {}
}

wdl_hits = sum(1 for r in results if r["wdl_hit"])
safe_hits = sum(1 for r in results if r["safe_hit"])
auto_corrected = sum(1 for r in results if r["auto_corrected"])
risk_a = sum(1 for r in results if r["risk"] == "A")
risk_b = sum(1 for r in results if r["risk"] == "B")
risk_c = sum(1 for r in results if r["risk"] == "C")
risk_d = sum(1 for r in results if r["risk"] == "D")

output["stats"] = {
    "total": len(results),
    "wdl_hits": wdl_hits,
    "wdl_rate": round(wdl_hits / len(results), 3),
    "safe_hits": safe_hits,
    "safe_rate": round(safe_hits / len(results), 3),
    "auto_corrected": auto_corrected,
    "risk_dist": {"A": risk_a, "B": risk_b, "C": risk_c, "D": risk_d},
    "acca_suitable": sum(1 for r in results if r["acca"]),
}

# Per-archetype hit rates
from collections import defaultdict
arch_hits = defaultdict(lambda: {"total": 0, "wdl_hit": 0, "safe_hit": 0})
for r in results:
    key = r["interaction"]
    arch_hits[key]["total"] += 1
    if r["wdl_hit"]: arch_hits[key]["wdl_hit"] += 1
    if r["safe_hit"]: arch_hits[key]["safe_hit"] += 1

output["archetype_stats"] = {}
for key in sorted(arch_hits.keys()):
    d = arch_hits[key]
    output["archetype_stats"][key] = {
        "total": d["total"],
        "wdl_hit": d["wdl_hit"],
        "wdl_rate": round(d["wdl_hit"] / d["total"], 2),
        "safe_hit": d["safe_hit"],
        "safe_rate": round(d["safe_hit"] / d["total"], 2),
    }

print(json.dumps(output, ensure_ascii=False, indent=2))
