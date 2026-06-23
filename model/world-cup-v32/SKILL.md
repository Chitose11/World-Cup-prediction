---
name: world-cup-v32
description: "Use for Chinese football match forecasting with the World Cup V3.3 model: 2026 FIFA World Cup, continental cups, international A matches, pre-match prediction, post-match review, Bayesian updating, score matrix, win/draw/loss, handicap, half-time/full-time, upset risk, confidence grading, LowBlockConversionPenalty, SecondHalfSurgeFactor, and S/A/A- tier reclassification. Trigger when the user asks about 世界杯预测, 足球预测, 胜平负, 让球, 半全场, 比分, 串关风险, 赛后复盘, or asks to reuse the World Cup V3.2/Kimi 2026 report model."
---

# World Cup V3.3

## Core Rule

Use World Cup V3.3 as a layered football prediction workflow:

`V3.3 = V3.2 贝叶斯底层 + 强队重新分层(S/A/A-) + 低位兑现惩罚(LowBlockConversionPenalty) + 下半场增压因子(SecondHalfSurgeFactor) + 半全场决策矩阵重排 + 让球硬约束`

Do not jump straight to final picks. First build or refresh the original-model data pack, then apply V3.3 corrections. Treat all betting-play outputs as probability/risk analysis only; do not promise profit, certainty, or staking advice.

## 🔴 强制数据源 (Mandatory Data Source)

**所有预测必须先抓取实时数据。禁止使用离线/过期数据。**

数据来源固定为竞彩网官方 API：
- **网页**: https://m.sporttery.cn/mjc/jsq/zqspf/
- **API**: `https://webapi.sporttery.cn/gateway/uniform/football/getMatchCalculatorV1.qry`

### 抓取命令

```bash
# 抓取并保存实时数据
python scripts/fetch_sporttery.py --save

# 查看摘要
python scripts/fetch_sporttery.py --summary

# 输出去水概率
python scripts/fetch_sporttery.py --summary --de-vig
```

抓取后数据保存在 `references/live-matches.json`，包含：
- `homeTeam / awayTeam` — 标准英文队名
- `had` — 胜平负固定奖金 (home/draw/away)
- `handicap` — 让球盘口 (goalLine + 赔率)
- `bettingSingle` — 是否开售单关
- `matchNumStr / matchDate / matchTime` — 比赛标识

The Kimi PDF data bundled into this skill is a pre-tournament baseline dated 2026-06-05. **For any request after 2026-06-11, or any request mentioning latest/current/live/today: FIRST run `python scripts/fetch_sporttery.py --save`, THEN read `references/live-matches.json` for current odds.** Never use the PDF baseline when live data is available.

## Reference Routing

Read only what is needed:

- For formulas, required fields, output template, risk grades, score matrix, and post-match review rules, read `references/model-core.md`.
- For Kimi PDF extracted baseline data, seed Elo/FIFA table, title/semi/quarter probabilities, disagreement, odds divergence, and calibration, read `references/pdf-baselines.md`.
- For group A-L matrices, group-third thresholds, and first-round prediction notes, read `references/groups-and-matches.md`.
- For venue, heat, altitude, travel, host advantage, and upset candidate data, read `references/environment-and-upsets.md`.
- For Bayesian updating, backtest targets, calibration bins, and post-result drift logic, read `references/dynamic-review-and-calibration.md`.
- For V3.3 post-review adjustments (定量触发评分、对手交互矩阵、λ分离、回测协议), read `references/v33-review-adjustments.md`.
- For repeated calculations, run or inspect `scripts/world_cup_v32_helpers.py`.

## Workflow

0. **🔴 FETCH LIVE DATA FIRST**: Run `python scripts/fetch_sporttery.py --save`, then read `references/live-matches.json`. Never skip this step for live predictions. The API returns real-time HAD odds, handicap lines, and single-bet status from sporttery.cn.
1. Identify match context: teams, competition, date, venue, home/neutral status, and whether the request is pre-match or post-match.
2. Refresh unstable facts when needed: completed results, injuries, likely XI, suspensions, odds, weather/WBGT, travel path, and venue.
3. Build P0 using the original data priority: recent national-team official matches, club xG/xT and player status, Elo, **live market odds from API**, historical tournament data, and squad value/depth.
4. Compute or approximate base strength from Elo/FIFA/HFI/xG efficiency/injury/environment. Mark missing data explicitly and lower confidence.
5. Apply V3.3 corrections: draw posterior, S/A/A- team archetype tier, LowBlockConversionPenalty check, SecondHalfSurgeFactor check, low-block/finisher/collapse states, environment, market disagreement, handicap hard constraints, and score matrix.
6. Split outputs separately: win-draw-loss, double chance, handicap, half-time/full-time, top scorelines, risk grade, and suitability for accumulator use.
7. If reviewing after a match, compare predicted vs actual outcome, classify error type, and state which parameter should move next.

## Output Format

For a pre-match prediction, use this compact structure:

```text
比赛：
数据状态：
原模型 P0：
V3.2 修正：
修正后概率：
胜平负单选：
安全方向：
半全场主推 / 备选：
让球方向：
比分 Top3：
风险等级：
是否适合串关：
一句话结论：
```

For post-match review, add:

```text
实际赛果：
命中情况：
错因/命中归因：
参数调整建议：
下一场影响：
```

## Calculation Helper

### 🔴 数据抓取 (每次预测前必须先执行)

```bash
# 抓取竞彩网实时数据
python scripts/fetch_sporttery.py --save
python scripts/fetch_sporttery.py --summary --de-vig
```

### V3.2 Core
python scripts/world_cup_v32_helpers.py draw --played 16 --draws 8
python scripts/world_cup_v32_helpers.py sij --sij 0.72
python scripts/world_cup_v32_helpers.py matrix --lambda-a 1.55 --lambda-b 0.85 --profile defensive-favorite
```

V3.3 λ-driven overlay (P2-fixed, 2026-06-18 r2):

```bash
# Full pipeline (λ-driven: REQUIRES --base-lambda-a and --base-lambda-b for consistency)
python scripts/world_cup_v32_helpers.py v33-wdl \
  --win 0.55 --draw 0.35 --loss 0.10 \
  --base-lambda-a 1.55 --base-lambda-b 0.85 \
  --favorite-archetype unstable-low-block \
  --opponent-archetype athletic-resistance \
  --low-block-triggers older_or_slower_cf low_recent_sot_rate tempo_drops_after_lead opponent_fast_counter \
  --opponent-physical-grade 0.8 \
  --surge-conditions strong_bench_depth multiple_scoring_points \
  --match-stage group --motivation neutral \
  --profile unstable-low-block

# Half-time λ split
python scripts/world_cup_v32_helpers.py v33-half-lambda --lambda-ft 1.55 \
  --surge-conditions strong_bench_depth strong_coach_adjustment opponent_defensive_age

# Archetype interaction lookup (P7: athletic-resistance / tactical-resistance)
python scripts/world_cup_v32_helpers.py v33-interaction --favorite unstable-low-block --opponent athletic-resistance

# Sigmoid dose curve (P3)
python scripts/world_cup_v32_helpers.py v33-dose --triggers 6
```

**New parameters (r2)**: `--match-stage` (group/round_of_32/round_of_16/quarter/semi/final), `--motivation` (neutral/already_qualified/must_win/draw_enough), `--base-lambda-a`, `--base-lambda-b`.

The helper does not replace judgment. **Always verify `auto_corrected` and `consistency_warning` fields** in the output. When auto-correct fires, the model has detected internal inconsistency and rolled back to the safest consistent state. See `references/v33-review-adjustments.md` for full documentation.
