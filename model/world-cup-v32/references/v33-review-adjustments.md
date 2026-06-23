# V3.3 Review Adjustments

Source: `C:\Users\dl\Desktop\足球模型复盘调整.md`.

**Current r5 (2026-06-22)**: Architecture is fully bottom-layer λ-driven. Interaction, LowBlockConversionPenalty, SecondHalfSurgeFactor, stage and motivation are converted into lambda multipliers before the Poisson score matrix. Surface WDL pp shifts, WDL target fitting, and Danger-Zone draw overrides are retired.

---

## Application Order (λ-multiplier, r5)

V3.3 operates on the underlying Poisson parameters (λa, λb), not on surface probability percentages. This guarantees mathematical consistency across WDL, score matrix, handicap, total goals, and HT/FT.

1. **Base λ** — from V3.2 Sij/profile/manual controls.
2. **Opponent Interaction** — dyadic archetype matrix produces Δwin/Δdraw direction, then maps to λ multipliers. Example: A- vs athletic −4pp/+7pp ≈ favorite λ×0.88, opponent λ×1.06.
3. **Opponent Strength Modifier** — if an A- favorite is >150 Elo stronger than the opponent, halve negative interaction pressure before converting to λ.
4. **LowBlockConversionPenalty** — sigmoid dose maps to λ_favorite down / λ_opponent up, not WDL pp.
5. **SecondHalfSurgeFactor** — maps to λ_favorite and second-half route uplift; no surface WDL residual bump is forced.
6. **Stage & Motivation** — applies direct λ scale and penalty scale.
7. **Poisson Matrix** — WDL, handicap, total goals, scorelines, and HT/FT all derive from the same adjusted matrix.
8. **Selector Guard** — Danger Zone is an application-layer risk flag: mark extreme risk and avoid HAD single picks; do not rewrite model probabilities.

Helper: `python scripts/world_cup_v32_helpers.py v33-wdl --base-lambda-a X --base-lambda-b Y ...`

## Team Reclassification (P7-fixed)

| Class | Teams | Treatment |
|---|---|---|
| S finisher | France, Argentina, Germany | Keep win lean; large-score tail |
| A high-depth | England, Netherlands, Norway | Draw/win, win/win HT/FT priority; surge-driven |
| A- unstable low-block | Portugal, Spain, Belgium, Uruguay | Trim win, strengthen draw; avoid -2 handicap |
| **Athletic resistance** | DR Congo, Senegal, Ivory Coast, Panama | Raw physical duels; highest draw-boost; ⚠️ vs unstable-low-block |
| **Tactical resistance** | Morocco, Croatia, Egypt, Japan | Discipline/experience-based; moderate draw-boost; less severe than athletic |

**P7 note**: `physical-resistance` as a catch-all bucket is retired. Athletic resistance (physically imposing) and tactical resistance (disciplined/organised) have different interaction coefficients. The old `physical-resistance` keyword still works but maps to athletic-resistance for backward compatibility.

Portugal must not be treated as S finisher. Current Portugal is A- unstable low-block.
DR Congo belongs in athletic-resistance, not an undifferentiated bucket.

## Profile Probabilities (P5, P6)

| Profile | Win | Draw | Loss | Template | Sample | Status |
|---|---|---|---|---|---|---|
| `high-depth` | 60% | 22% | 18% | England 4-2 Croatia | n=1 | ⚠️ ACTIVE |
| `unstable-low-block` | 55% | 35% | 10% | Portugal 1-1 DR Congo | n=1 | ⚠️ ACTIVE |
| `early-ease` | 56% | 34% | 10% | **NONE** | n=0 | ❌ DEPRECATED |

**P5**: `early-ease` has zero template matches. It auto-demotes to `balanced` in the helper. Must NOT be used as a routing target. Either find a real template match and re-activate, or remove entirely.

**P6 – Empirically Calibrated (2026-06-18 r3)**:

Using 2018+2022 calibration bins (212 predictions, Brier 0.198, ECE 3.2pp), the three profiles calibrate as follows:

| Profile | Raw (expert) | **Empirically Calibrated** | Key driver |
|---|---|---|---|
| `high-depth` | 60/22/18 | **61.1/21.8/17.1** | Win=60% in 50-60% bin (+7.5pp bias → 61.1%) |
| `unstable-low-block` | 55/35/10 | **57.6/33.9/8.6** | Win=55% in 50-60% bin (+7.5pp → major shift) |
| `early-ease` (deprecated) | 56/34/10 | **57.1/35.8/7.1** | Win=56% also in 50-60% bin |

**Finding**: The model is systematically underconfident in the 50-60% range (predicts 55%, reality gives 62.5%). Both high-depth and unstable-low-block profiles fall into this bin, meaning their raw win probabilities are understated by ~2-7pp. The empirically-calibrated values use the model's own 212-match track record to correct this.

Helper: `python scripts/world_cup_v32_helpers.py v33-calibrate-profile --win 0.60 --draw 0.22 --loss 0.18 --label high-depth`

## Opponent Interaction Matrix (P7-fixed)

Football is dyadic. Archetype × archetype interaction replaces single-team personality.

| Favorite ↓ \ Opponent → | S-finisher | high-depth | u-l-b | athletic-res | tactical-res | mid-tier |
|---|---|---|---|---|---|---|
| **S-finisher** | 0 / 0 | +2 / −3 | −4 / +5 | −3 / +5 | −1 / +3 | +4 / −3 |
| **high-depth** | −3 / +2 | +1 / −1 | −5 / +6 | +1 / +4 | +3 / +2 | +3 / −2 |
| **unstable-low-block** | −6 / +5 | −4 / +4 | 0 / +2 | **−4 / +7** ⚠️ | −2 / +5 | +2 / −2 |
| **athletic-resistance** | −6 / +7 | −5 / +6 | −4 / +6 | +1 / +4 | +1 / +2 | −3 / +5 |
| **tactical-resistance** | −4 / +5 | −3 / +4 | −2 / +5 | −1 / +3 | 0 / +3 | −1 / +3 |
| **mid-tier** | −6 / +4 | −5 / +3 | −3 / +4 | −3 / +6 | −2 / +4 | 0 / +1 |

Cells: `(Δwin_pp, Δdraw_pp)`. u-l-b = unstable-low-block.

⚠️ **Danger zone (r5)**: unstable-low-block vs athletic-resistance remains a severe risk signal, but it is no longer a bottom-model draw override. The −4pp/+7pp cell is mapped into lambda multipliers (approximately favorite λ×0.88, opponent λ×1.06), and the玩法选择器 must mark it as extreme risk and avoid HAD single picks.

**Opponent strength modifier (r5)**: for A- favorites against clearly weaker opponents (Elo gap >150), apply a 0.5 multiplier to the negative interaction delta before converting it to λ. This keeps Spain-vs-weak-team mismatches from being treated like Uruguay-vs-Cape-Verde or Portugal-vs-DR-Congo danger games.

**P1 – Empirically Calibrated (2026-06-18 r3)**:

The 2018+2022 calibration bins were applied to each cell. Key findings:

**Danger zone corrected**: `unstable-low-block vs athletic-resistance`:
- Expert judgment: Δwin=−4pp, Δdraw=+7pp
- **Empirically calibrated: Δwin=−1.08pp, Δdraw=+3.33pp** ← ~3.7× weaker
- Reason: base win=55% in 50-60% bin (+7.5pp underconfidence) and target draw=42% in 40-50% bin (−3.3pp overconfidence) partially cancel the expert deltas.

**Largest discrepancy**: `unstable-low-block vs S-finisher`:
- Expert: Δwin=−6pp, Δdraw=+5pp
- **Empirically calibrated: Δwin=−8.97pp, Δdraw=+9.94pp** ← needs to be STRONGER
- Reason: the calibration bins amplify rather than dampen this cell.

**General pattern**: most cells show calibrated deltas that are 30-70% of expert-judgment magnitudes. The empirical data consistently says "interaction effects are weaker than you think" — except when base probabilities fall into the 50-60% underconfidence bin, which amplifies the adjustment.

Full calibrated 6×6 matrix available via:
```bash
python scripts/world_cup_v32_helpers.py v33-calibrate-matrix
```

Single cell calibration:
```bash
python scripts/world_cup_v32_helpers.py v33-calibrate-cell --base-win 0.55 --base-draw 0.35 --delta-win-pp -0.04 --delta-draw-pp 0.07
```

Helper: `python scripts/world_cup_v32_helpers.py v33-interaction --favorite unstable-low-block --opponent athletic-resistance`

## LowBlockConversionPenalty (P3-fixed)

### Sigmoid Dose-Response

Replaces the old linear 0→0.20→0.40 mapping. Football tactics are non-linear — isolated weaknesses don't shift odds; a critical mass of weaknesses triggers a phase transition.

| Triggers | Old linear dose | **New sigmoid dose** | Interpretation |
|---|---|---|---|
| 0 | 0.00 | **0.000** | No effect |
| 1 | 0.20 | **0.001** | Dead zone — isolated, ignorable |
| 2 | 0.40 | **0.023** | Dead zone — not enough to shift |
| 3 | 0.60 | **0.223** | Acceleration begins |
| 4 | 0.75 | **0.777** | Critical mass — strong signal |
| 5 | 0.90 | **0.977** | Near-saturation |
| 6 | 1.00 | **0.998** | Full penalty |

Sigmoid parameters: midpoint=3.5, steepness=2.5, dead_zone=2 (quadratic dampening for n≤2).

### Trigger Conditions (6 total)

| # | Condition | Signal |
|---|---|---|
| 1 | `older_or_slower_cf` | CF age ≥32 or sprint < median |
| 2 | `avg_wing_breaking_efficiency` | Wing xT or take-on rate < top quartile |
| 3 | `low_recent_sot_rate` | SOT rate < 35% in last 5 matches |
| 4 | `cross_or_setpiece_reliant` | >40% xG from crosses/set pieces |
| 5 | `tempo_drops_after_lead` | Historical intensity drop when leading |
| 6 | `opponent_fast_counter` | Opponent transition speed > median |

### Effective Penalty

`effective = sigmoid_dose(triggers) × opponent_grade × stage_multiplier × motivation_multiplier`

At full penalty (effective=1.0): −8pp win, +9pp draw, +4pp underdog score, +5pp HT/FT draw/draw.

## SecondHalfSurgeFactor (P2-fixed)

### Architecture Change

Old: "win +5pp to +8pp" — conflated timing with outcome. New: split λ into λ_fh (first half) and λ_sh (second half), with WDL receiving only a residual bump (max +5pp). The primary effect routes through HT/FT and total goals.

### Sigmoid Dose

Same architecture as LowBlockPenalty with parameters midpoint=3.0, steepness=2.0, dead_zone=2.

| Triggers | Dose | λ_fh multiplier | λ_sh multiplier |
|---|---|---|---|
| 0 | 0.000 | ×1.000 | ×1.000 |
| 1 | 0.006 | ×0.999 | ×1.002 |
| 2 | 0.095 | ×0.995 | ×1.029 |
| 3 | 0.500 | ×0.975 | ×1.150 |
| 4 | 0.905 | ×0.955 | ×1.272 |
| 5 | 0.994 | ×0.950 | ×1.298 |
| 6 | 1.000 | ×0.950 | ×1.300 |

### Trigger Conditions (6 total)

| # | Condition |
|---|---|
| 1 | `strong_bench_depth` |
| 2 | `strong_coach_adjustment` |
| 3 | `opponent_defensive_age` |
| 4 | `opponent_high_first_half_consumption` |
| 5 | `strong_set_pieces` |
| 6 | `multiple_scoring_points` |

### WDL Effect (residual, secondary)

+1pp to +5pp win (not +5pp to +8pp — the old blanket boost is retired).

Helper: `python scripts/world_cup_v32_helpers.py v33-half-lambda --lambda-ft 1.55 --surge-conditions strong_bench_depth strong_coach_adjustment opponent_defensive_age`

## HT/FT Routing

| Match type | Main | Backup |
|---|---|---|
| S strong vs weak | Win/win | Draw/win |
| A- unstable low-block | Draw/win | Draw/draw |
| Early-ease prone | Win/draw or draw/draw | Draw/win |
| High-depth vs aging defense | Draw/win | Win/win |
| Both conservative | Draw/draw | Win/draw or loss/draw |
| Away favorite slow starter | Draw/away win | Away/away |

## Handicap Rules

- If favorite win probability < 70% or draw > 24%, avoid -2 handicap.
- A- unstable-low-block vs athletic-resistance: **never touch -2**.
- Handicap from score matrix (via adjusted lambdas), not from WDL.

## P8: Match Stage Stratification

| Stage | LowBlockPenalty multiplier | SurgeFactor multiplier | Rationale |
|---|---|---|---|
| Group | ×1.00 | ×1.00 | Baseline |
| Round of 32 | ×1.10 | ×0.90 | Slight knockout caution |
| Round of 16 | ×1.15 | ×0.85 | Increased elimination pressure |
| Quarter | ×1.20 | ×0.82 | High stakes → conservative |
| Semi | ×1.25 | ×0.80 | Extreme caution |
| Final | ×1.25 | ×0.80 | Maximum stakes |

Knockout matches amplify low-block conservatism (teams fear elimination) and dampen second-half surge (opponents fight harder to the end).

## P9: Group-Stage Round-3 Motivation

For group-stage third-round matches, the 2026 48-team "best third-place" format creates asymmetric motivation:

| Motivation | λ scale | Penalty scale | Scenario |
|---|---|---|---|
| `neutral` | ×1.00 | ×1.00 | Standard match |
| `already_qualified` | ×0.88 | ×0.70 | May rotate, lower intensity |
| `must_win` | ×1.08 | ×0.60 | Desperation, penalty less relevant |
| `draw_enough` | ×0.90 | ×1.35 | Extreme conservatism, penalty amplified |

This is the single largest structural difference between 2026 and 2022 — the model must account for it.

## Cross-Play Consistency + Auto-Correct (P4)

After λ-driven overlay, verify three cross-checks:

1. **WDL ↔ Handicap**: If win>70% and draw>24%, flag.
2. **WDL ↔ Total Goals**: If draw>33% and win−draw<12%, check score matrix alignment.
3. **HT/FT ↔ WDL**: If win/win+draw/win>80% but win<55%, adjust FH/SH lambdas.

**Auto-correct trigger**: ≥2 checks failed OR 1 check failed with significant overlay (penalty>0.35 or surge>0.3).

**Auto-correct action**: Roll back to post-interaction WDL. Discard LowBlockPenalty and SurgeFactor WDL shifts. Preserve λ_fh/λ_sh split for HT/FT routing. Refit lambdas to post-interaction target. This ensures the model never outputs mathematically inconsistent probabilities — it sacrifices the overlays rather than the coherence.

## P10: Non-Linear Overlay Interaction (noted)

When both LowBlockPenalty (≥3 triggers) and SecondHalfSurgeFactor (≥3 triggers) fire simultaneously, their combined effect may be non-additive. A team that surges late against a low block might produce: higher total goals (surge), but still fail to cover handicap (low block). The current sequential-application model may under-estimate or over-estimate the net effect. Treat dual-trigger matches as +1 risk grade automatically.

## P11: Market Consensus Divergence

V3.2's `MarketDisagreement = True` flag should be re-checked after V3.3 overlay. If overlay shifts win probability by >10pp relative to the original model, compare the new probability against market implied probability. A divergence >15pp between V3.3 and market is a strong risk signal — downgrade risk grade by one tier.

## Backtest Protocol

V3.3 calibrations rest on n=2 matches. Minimum before trusting:

1. 8 sample-out matches before any coefficient update.
2. Rolling Brier ≤0.60 over last 5 overlayed matches.
3. Per-archetype tracking: separate S-finisher, high-depth, unstable-low-block, athletic-resistance, tactical-resistance accuracy.
4. Group vs knockout stratification (n≥5 per stratum).
5. Post-match mini-review for every V3.3-overlayed match.

## Score-Matrix Profile Routing

| Favorite archetype | Opponent archetype | Recommended profile |
|---|---|---|
| S-finisher | any (except athletic-res) | `elite-finisher` (62/20/18) |
| S-finisher | athletic-resistance | `defensive-favorite` (60/30/10) |
| high-depth | any | `high-depth` (60/22/18) |
| unstable-low-block | any (except athletic-res) | `unstable-low-block` (55/35/10) |
| unstable-low-block | athletic-resistance | `defensive-favorite` (60/30/10) ⚠️ draw-heavy |
| mid-tier | any | `balanced` (58/27/15) |
| **DEPRECATED** early-ease | any | → fall back to `balanced` |

## Revision History

| Date | Change | Problems addressed |
|---|---|---|
| 2026-06-18 r1 | Initial V3.3 overlay: profiles, boolean penalties, interaction matrix | — |
| 2026-06-18 r2 | λ-driven architecture, sigmoid dose, auto-correct, P5/P7/P8/P9 | P1–P11 |
| 2026-06-18 r3 | P1+P6 empirical calibration from 2018+2022 bins (Brier 0.198) | P1, P6 |
| 2026-06-22 r4 | Draw calibration: p0 0.27→0.25, n0 24→**20**, non-elite discount, drawTarget weight 0.35→0.25. A- vs tactical −2→−3pp. Norway S→high-depth. A- Elo −40. Danger-zone override. | draw over-prediction |
| 2026-06-22 r5 | Draw prior p0 0.25→0.24. Interaction/low-block/surge effects converted from surface WDL pp adjustments to bottom-layer λ multipliers. Danger Zone moved to selector guard. A- weak-opponent modifier added. | WDL/handicap/total-goals consistency |
