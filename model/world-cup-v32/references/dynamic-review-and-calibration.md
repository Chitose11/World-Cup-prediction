# Dynamic Review And Calibration

Use for tournament-state updates, post-match reviews, calibration, and model drift.

## Pre-Tournament Anchor

PDF baseline publication date: 2026-06-05. These probabilities are priors. Once matches begin, every completed result must be treated as new evidence, but updates must be capped to avoid overreaction.

Pre-tournament model snapshot:

| Team | Elo model | Dixon-Coles | SPI | Gradient boost | Ensemble | 95% credible interval | Confidence |
|---|---:|---:|---:|---:|---:|---|---|
| Spain | 18.2% | 16.8% | 16.1% | 17.5% | 16.8% | 13.2%-20.4% | high |
| France | 15.8% | 14.2% | 14.5% | 13.8% | 14.3% | 11.0%-17.6% | high |
| England | 12.4% | 11.5% | 11.2% | 10.5% | 11.2% | 8.2%-14.2% | medium |
| Germany | 11.5% | 12.0% | 11.2% | 12.8% | 11.8% | 8.8%-14.8% | medium |
| Argentina | 10.5% | 9.8% | 10.4% | 9.2% | 9.9% | 7.2%-12.6% | medium |
| Brazil | 8.2% | 7.5% | 8.8% | 7.0% | 7.8% | 5.2%-10.4% | low |
| Portugal | 5.8% | 6.2% | 6.5% | 5.5% | 6.0% | 3.8%-8.2% | low |
| Netherlands | 4.5% | 4.8% | 5.2% | 4.2% | 4.7% | 2.8%-6.6% | low |
| Other 39 | 13.1% | 17.2% | 16.1% | 19.5% | 15.5% | 12.0%-19.0% | mixed |

Confidence matrix:

| Team | Model consensus | Data completeness | Structural risk | Overall |
|---|---:|---:|---|---|
| Spain | 92% | 95% | low | high |
| France | 88% | 93% | low | high |
| Argentina | 78% | 85% | high, aging/injury/defending-champion pressure | medium |
| England | 65% | 82% | high, history vs current talent conflict | medium |
| Germany | 72% | 80% | medium, system transition | medium |
| Brazil | 58% | 75% | high, new coach/injuries/age | low |
| Portugal | 62% | 78% | high, aging core/tactical dependency | low |

## Bayesian Update Weights

Final update amount:

`update = base_weight * time_decay * opponent_strength_factor`

Apply the cumulative cap to avoid overreaction.

| Event | Base weight | Cumulative cap | Notes |
|---|---:|---:|---|
| Group win | 0.12 | +/-15% probability | win by >3 goals adds +50% weight |
| Group draw | 0.06 | +/-8% probability | value draw vs strong team x1.5 |
| Group loss | 0.15 | +/-18% probability | comeback loss adds +30% weight |
| Knockout win | 0.18 | +/-22% probability | penalty shootout also updates resilience |
| Knockout loss | 0.20 | +/-25% probability | eliminated teams stop title iteration |
| Key injury | 0.25 | +/-30% probability | immediate update by player dependency |
| Red card | 0.10 | +/-12% probability | updates discipline and referee-pattern risk |
| Coaching adjustment | 0.08 | +/-10% probability | quantify via substitutions/xT gain |

Context matters:

- Early goal says more about structure than a late random goal.
- Opponent strength scales update; beating Spain is more informative than beating a rank-40 team.
- Environment is a covariate, not pure team-strength signal. A poor Mexico City performance may be altitude effect rather than true attack decline.

## Probability Calibration

Historical calibration summary from PDF:

- 2018+2022 Brier Score: `0.198`, better than random `0.250`.
- Expected Calibration Error: `3.2pp`.
- Hosmer-Lemeshow p-value: `0.12`, not enough evidence to reject calibration.

Calibration bins:

| Predicted range | Predictions | Actual count | Actual frequency | Center | Bias pp |
|---|---:|---:|---:|---:|---:|
| 0-10% | 89 | 7 | 7.9% | 5.0% | +2.9 |
| 10-20% | 43 | 6 | 14.3% | 15.0% | -0.7 |
| 20-30% | 28 | 7 | 25.0% | 25.0% | 0.0 |
| 30-40% | 19 | 7 | 36.8% | 35.0% | +1.8 |
| 40-50% | 12 | 5 | 41.7% | 45.0% | -3.3 |
| 50-60% | 8 | 5 | 62.5% | 55.0% | +7.5 |
| 60-70% | 6 | 4 | 66.7% | 65.0% | +1.7 |
| 70-80% | 4 | 3 | 75.0% | 75.0% | 0.0 |
| 80-90% | 2 | 2 | 100.0% | 85.0% | +15.0 |
| 90-100% | 1 | 1 | 100.0% | 95.0% | +5.0 |

Low-probability events are underpredicted: add thick-tail compensation.

2026 calibration adjustment:

| Raw probability | Adjustment | Adjusted range | Logic |
|---|---:|---|---|
| 0-5% | +1.5pp | 1.5%-6.5% | compensate low-probability tail |
| 5-10% | +0.8pp | 5.8%-10.8% | light tail compensation |
| 10-15% | +0.3pp | 10.3%-15.3% | marginal correction |
| 15-20% | 0pp | 15%-20% | calibrated |
| 20-25% | -0.5pp | 19.5%-24.5% | mild overconfidence |
| >25% | -1.0pp | >24% | cap extreme estimates |

Frequency vs Bayesian split:

| Prediction | Frequentist | Bayesian | Difference source |
|---|---:|---:|---|
| Spain title | 16.8% | 16.5% | Bayesian discounts unbeaten run |
| Germany title | 10.2% | 11.0% | Bayesian includes rebound prior |
| Argentina title | 12.5% | 12.0% | defending-champion curse discount |
| England title | 10.5% | 11.0% | Tuchel effect premium |
| Brazil title | 8.5% | 9.0% | Ancelotti effect prior |

## Post-Match Attribution Template

Classify every review into at least one bucket:

| Bucket | Meaning | Typical adjustment |
|---|---|---|
| Draw underestimation | favorite did not lose but failed to win | raise DrawBase / low-block factor |
| Elite finisher underestimation | top side broke through late | raise FinisherFactor / collapse tail |
| Collapse tail miss | early goal/red card created big score | raise CollapseTail for similar profile |
| Physical resistance miss | CAF/AFC/CONCACAF team absorbed pressure better than expected | raise PhysicalResistance |
| Low-block miss | favorite process quality did not create enough | lower possession-favorite win |
| Injury/lineup miss | pre-match personnel was wrong | refresh InjuryAdj protocol |
| Goalkeeper/xG divergence | high xG but no goals or low xG but goals | mark variance; avoid structural overreaction |
| Red card/VAR | non-structural event | update discipline/referee only |

Use rolling diagnostics:

- Rolling Brier over last 5 matches above `0.60` triggers model review.
- Compare all new outputs against the 2026-06-05 anchor.
- If one direction repeats across groups, adjust the global factor; if one team repeats, adjust team-specific parameters only.

## Review Output

```text
实际赛果：
赛前主判断：
命中/偏差：
过程数据：
错因分类：
是否结构性：
参数调整：
对下一场影响：
```
