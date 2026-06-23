# Model Core (V3.3 · 最后更新 2026-06-18)

Source: `World Cup V3.2 Model.docx` → V3.3 升级基于 2026-06-17~18 比赛复盘。This is the compact reusable model spec; keep it loaded for most predictions.

## Original Data Priority

| Priority | Data | Weight |
|---|---|---:|
| P0 | Recent national-team official matches | 30% |
| P1 | Club xG/xT and core player form | 25% |
| P2 | Elo rating | 15% |
| P3 | Market odds / prediction markets | 15% |
| P4 | Historical major-tournament data | 10% |
| P5 | Transfermarkt value / squad depth | 5% |

Odds are consensus-bias variables, not direct truth. If odds and model disagree, mark `MarketDisagreement = True`.

## Required Match Fields

| Layer | Field | Meaning |
|---|---|---|
| Rating | `Elo_A`, `Elo_B` | Elo ratings |
| Rating | `FIFA_A`, `FIFA_B` | FIFA rank or FIFA SUM proxy |
| Rating | `SPI_off`, `SPI_def` | Attack/defense rating if available |
| Attack/defense | `ATT_rating`, `DEF_rating` | last-20 xG/xGA relative to tournament average |
| Process | `xG_diff_5`, `xT_per90` | recent xG difference and expected threat |
| Form | `HFI` | historical form index |
| Context | `HOME_ADV`, `ALTITUDE`, `WBGT`, `TRAVEL_km` | venue and logistics |
| Squad | `SQUAD_depth`, `KEY_dep`, `InjuryAdj` | bench depth, core dependency, injuries |
| Market | `IMPLIED_prob` | de-vigged implied odds probability |
| History | `H2H_5yr`, `MOMENTUM` | head-to-head and Bayesian momentum |

## Seed Elo/FIFA Table

Use this only when live data is unavailable; live Elo/FIFA overrides it.

| Team | Elo | FIFA rank | Note |
|---|---:|---:|---|
| Spain | 2090 | 1 | dual-system consensus |
| Argentina | 2047 | 2 | defending champion, tournament premium |
| France | 2041 | 3 | best squad depth |
| Brazil | 1990 | 5 | Elo more optimistic |
| England | 1974 | 4 | market priced high |
| Colombia | 1970 | 9 | Elo high / recent strength |
| Portugal | 1967 | 6 | broadly consistent |
| Netherlands | 1951 | 7 | broadly consistent |
| Germany | 1940 | 10 | large market disagreement |
| Morocco | 1918 | 8 | FIFA high |
| Croatia | 1895 | 11 | aging signal |
| Uruguay | 1882 | 13 | Elo slightly optimistic |
| Switzerland | 1868 | 14 | stable middle tier |
| Japan | 1845 | 15 | strongest AFC Elo |
| Senegal | 1832 | 12 | FIFA high |
| Iran | 1818 | 17 | broadly consistent |
| Korea | 1805 | 19 | Elo slightly optimistic |
| Ecuador | 1798 | 20 | altitude/home-region bonus |
| Australia | 1785 | 21 | Elo slightly optimistic |
| Austria | 1780 | 16 | Elo materially lower than FIFA |

## Core Formulas

P0 is an ensemble:

`P0 = Ensemble(Elo/FIFA/SPI, HFI, xG/xGA, xT, Poisson/Dixon-Coles, MonteCarlo, MarketOdds, Environment, SquadDepth, KeyPlayerDependency)`

Base strength:

`BaseStrength = 0.35*Elo_Z + 0.20*FIFA_Z + 0.20*HFI_Z + 0.15*xG_eff_Z + 0.05*InjuryAdj + 0.05*EnvAdj`

Fallback z-scale when data is thin: very strong `+2`, strong `+1`, neutral `0`, weak `-1`, very weak `-2`.

HFI:

`w_m = time_decay * event_weight * opponent_weight`

`time_decay = exp(-days / 365)`

Event weights: World Cup/continental finals `1.25`; qualifiers `1.00`; Nations League/regional official `0.85`; friendly `0.35`.

Opponent weights: top team `1.20`; upper-mid `1.10`; ordinary `1.00`; weak `0.85`; minnow `0.70`.

Single-match score:

`score_m = points + 0.35*capGD + 0.25*xG_diff + 0.15*clean_sheet - 0.10*red_cards - 0.03*yellow_cards`

`capGD = max(-3, min(3, goal_difference))`

`HFI = 100 * sum(w_m * score_m) / sum(w_m)`

HFI interpretation: `>250` elite form; `180-250` very good; `100-180` normal-strong; `50-100` average; `<50` weak.

xG efficiency:

`xG_eff = ln((goals + 0.5)/(xG + 0.5)) - ln((goals_against + 0.5)/(xGA + 0.5))`

When xG is missing:

`proxy_chance = 0.50*SOT_share + 0.30*shot_share + 0.20*possession_share`

`proxy_eff = proxy_chance - 0.50`

## Strength Difference

`Sij = BaseStrength_A - BaseStrength_B`

| Sij | Match type |
|---:|---|
| `>1.50` | clear mismatch |
| `0.80-1.50` | favorite advantage |
| `0.30-0.80` | small advantage |
| `-0.30-0.30` | coin flip |
| `<-0.30` | B-side advantage |

Simplified WDL fallback:

| Sij | A win | Draw | B win |
|---|---:|---:|---:|
| `>1.80` | 80% | 16% | 4% |
| `1.20-1.80` | 68% | 23% | 9% |
| `0.80-1.20` | 58% | 29% | 13% |
| `0.40-0.80` | 47% | 35% | 18% |
| `0.00-0.40` | 39% | 38% | 23% |
| `-0.40-0.00` | 23% | 38% | 39% |
| `-0.80--0.40` | 18% | 35% | 47% |
| `-1.20--0.80` | 13% | 29% | 58% |
| `<-1.20` | 9% | 23% | 68% |

## Draw Posterior

V3.2 must update draw base from completed matches:

`DrawBase = (n0*p0 + draws_so_far) / (n0 + matches_played)`

Defaults: `p0 = 0.24`, `n0 = 20`.

Draw adjustment:

`DrawAdj = DrawBase + close_strength + opener_conservatism + low_block + weak_favorite_breakdown + environment_tempo - mismatch_penalty`

Recommended factors: close teams `abs(Sij)<0.5` = `+0.04`; first-round caution `+0.03`; clear low block `+0.04`; favorite has weak low-block breaking `+0.03`; heat/travel/altitude slows tempo `+0.02`; extreme mismatch `abs(Sij)>1.8` = `-0.12`; large mismatch `abs(Sij)>1.2` = `-0.06`; elite attacking favorite `-0.03`.

Clamp final draw probability to `0.12-0.42`.

## Team Archetypes (V3.3 重新分类 · 2026-06-18)

### 强队层级（必须按此分类，不可混用）

| 类型 | 球队 | 处理规则 |
|---|---|---|
| **S级终结型** | 法国、阿根廷、德国 | 胜率 `+4%` 到 `+7%`；大比分尾部保留 `+5%`；平局微降；让球可看-1；半全场主推胜胜 |
| **A级高深度型** | 英格兰、荷兰、挪威 | 胜率 `+5%` 到 `+8%`；平局 `-4%` 到 `-6%`；半全场平胜/胜胜优先；对老化/弱防线可看让胜；大比分尾部上调 |
| **A- 阵容强但破低位不稳** | 葡萄牙、西班牙、比利时、乌拉圭 | 胜率下调 `-5%` 到 `-8%`；平局上调到 `24%-30%`；半全场平胜/平平优先；让球-1谨慎，-2绝对不碰；总进球改低比分 |
| **中游热门** | 奥地利、瑞士、哥伦比亚、日本、韩国、加纳 | 先对对手身体对抗、低位防守、旅途、环境做修正；不败优先于单选主胜 |
| **身体抗压型·运动型** (P7-split) | 刚果金、塞内加尔、科特迪瓦、巴拿马 | 纯身体对抗；平局 `+5%` 到 `+7%`；⚠️ 对阵 A- 破低位不稳队时尤其危险 |
| **身体抗压型·战术型** (P7-split) | 摩洛哥、克罗地亚、埃及、日本 | 纪律/经验型抗压；平局 `+3%` 到 `+5%`；强度低于运动型 |

> ⚠️ **葡萄牙特别警示**：2026-06-17 葡萄牙 1-1 刚果金证明，本届葡萄牙≠S级终结型。C罗首发带来经验和牵制，但也带来进攻流动性问题。对模型而言，**阵容豪华 ≠ 稳定终结**。后续所有葡萄牙比赛自动降级为 A- 处理。

### 英格兰特别规则

2026-06-17 英格兰 4-2 克罗地亚证明：上半场乱≠全场平。英格兰属于「高深度终结型热门」——首战慢热但下半场增压能力强：
- 替补深度强（Rashford 85' 进球为证）
- 教练临场调整能力突出
- 定位球+边路冲击对老化防线杀伤力大
- 多得分点（Kane, Bellingham, Rashford 三人破门）

后续英格兰遇到老化/速度慢/定位球弱的防线：**不再优先让负，可看让胜**。

## Three-State Poisson

States: normal `N`, low-block `L`, collapse `C`.

Default weights: `N=67%`, `L=23%`, `C=10%`.

Profiles:

| Profile | N | L | C |
|---|---:|---:|---:|
| elite finisher vs lower team | 62% | 20% | 18% |
| ordinary favorite vs defensive underdog | 60% | 30% | 10% |
| coin flip / mid-tier favorite | 58% | 27% | 15% |

Normal lambdas by matchup:

| Match type | Favorite lambda | Underdog lambda |
|---|---:|---:|
| huge mismatch | 2.30 | 0.45 |
| clear mismatch | 1.85 | 0.65 |
| medium advantage | 1.55 | 0.85 |
| small advantage | 1.30 | 1.00 |
| coin flip | 1.15 | 1.15 |

Low-block state: `lambda_A_L = 0.82 * lambda_A_N`, `lambda_B_L = 0.82 * lambda_B_N`.

Collapse state: favorite `lambda_C = 1.35 * lambda_N`, underdog `lambda_C = 0.90 * lambda_N`.

Score matrix:

`P(x,y) = w_N*Pois(x|lambda_A_N)*Pois(y|lambda_B_N) + w_L*Pois(x|lambda_A_L)*Pois(y|lambda_B_L) + w_C*Pois(x|lambda_A_C)*Pois(y|lambda_B_C)`

Usually compute scorelines `0-0` through `5-5`.

## Low-Block Conversion Penalty (V3.3 新增)

> **定量升级**：布尔开关已替换为 6 条件连续评分系统。使用 `python scripts/world_cup_v32_helpers.py v33-wdl --low-block-triggers ... --opponent-physical-grade ...` 自动计算惩罚幅度。完整评分映射、对手交互矩阵和回测协议见 `references/v33-review-adjustments.md`。

对阵身体型/非洲队/低位防守型弱队时，若强队满足以下**任意 2 条**，触发：

```text
LowBlockConversionPenalty = True
```

触发条件：
- 中锋年龄偏大或绝对速度不足
- 边路爆破效率一般
- 近场射正率低
- 依赖传中/定位球为主要得分手段
- 领先后节奏明显下降
- 对手反击速度快

触发后修正：

| 项目 | 修正 |
|---|---|
| 强队胜率 | `-5%` 到 `-8%` |
| 平局 | `+6%` 到 `+9%` |
| 弱队进球概率 | `+4%` |
| 半全场平平 | `+5%` |
| 让球胜 | 下调一档 |

> 教材案例：葡萄牙 1-1 刚果金。早进球后未继续压死比赛，最终被扳平。

## Second-Half Surge Factor (V3.3 新增)

> **定量升级**：布尔开关已替换为 λ_fh/λ_sh 分离模型。使用 `python scripts/world_cup_v32_helpers.py v33-half-lambda --lambda-ft ... --surge-conditions ...` 计算上下半场独立 λ。WDL 调整已从 +5~+8pp 降级为最大 +5pp（主要效果转移至 HT/FT 路由）。详见 `references/v33-review-adjustments.md`。

若热门队满足以下条件（至少 3 条），触发：

```text
SecondHalfSurgeFactor = True
```

触发条件：
- 替补深度强
- 教练临场调整能力突出
- 对手后防年龄偏大
- 对手上半场消耗大
- 热门定位球强
- 热门有多点得分能力

触发后修正：

| 项目 | 修正 |
|---|---|
| 热门胜率 | `+5%` 到 `+8%` |
| 半全场平胜 | `+8%` |
| 半全场胜胜 | `+3%` |
| 半全场平平 | `-6%` |
| 让胜 | `+5%` |
| 总进球 3+ | `+6%` |

> 教材案例：英格兰 4-2 克罗地亚。上半场 2-2，下半场 Bellingham(47') + Rashford(85') 收下比赛。

## Market Splits

WDL: sum score matrix where `x>y`, `x=y`, `x<y`.

Double chance: `1X = Awin+draw`, `X2 = draw+Bwin`, `12 = Awin+Bwin`.

Handicap must come from score matrix, not WDL:

- A -1 cover: `sum(P(x,y), x-y>1)`
- A -2 cover: `sum(P(x,y), x-y>2)`
- A +1 cover: `sum(P(x,y), x+1>y)`

Handicap thresholds: `-1` cover needs at least `45%`; `-2` cover needs at least `32%`; handicap loss needs at least `50%`; underdog cover/unbeaten needs at least `60%`.

### V3.3 让球新增硬约束

-2 盘口禁入规则：
```text
如果 强队胜率 < 70% 或 平局概率 > 24%
则 绝对不碰 -2 盘口。
```

对 A- 阵容强但破低位不稳（葡萄牙、西班牙、比利时、乌拉圭）VS 身体抗压型弱队：
> **一律不碰 -2。**

让球方向与 SecondHalfSurgeFactor 联动：
```text
如果 热门队触发 SecondHalfSurgeFactor
且 对手防线老化 / 定位球防守弱
则 让负下调，让胜上调。
```

## Half-Time/Full-Time (V3.3 重排)

`lambda_HT ~= 0.42-0.47 * lambda_FT`.

### V3.3 半全场决策矩阵

| 比赛类型 | 主推 | 备选 |
|---|---|---|
| S级强队 vs 弱队 | **胜胜** | 平胜 |
| 强队破低位不稳（A-） | **平胜** | 平平 |
| 强队早进后容易松 | **胜平 / 平平** | 平胜 |
| 高深度强队 vs 老化防线 | **平胜** | 胜胜 |
| 两队都保守 | **平平** | 胜平 / 负平 |
| 客队强但慢热 | **平负** | 负负 |
| 低位防守型弱队抗压 | **平平** | 平胜 |

### 典型场景对照

| 比赛 | V3.2 旧输出 | V3.3 新输出 |
|---|---|---|
| 葡萄牙 vs 刚果金类 | 胜胜/平胜 | **平胜/平平** |
| 英格兰 vs 克罗地亚类 | 平平/平胜 | **平胜/胜胜** |

Only output one main and one backup. Lower confidence one grade for HT/FT.

## Risk Grades

| Grade | Condition | Output |
|---|---|---|
| A | top win probability `>=68%`, draw `<=25%`, no deep handicap dependency | can be single WDL / accumulator anchor |
| B | advantaged side unbeaten `>=78%`, win `<68%` | double chance / cautious WDL |
| C | draw `>=33%` or favorite-win minus draw `<12%` | draw protection / avoid main accumulator |
| D | three outcomes close, data conflict, or WDL-handicap contradiction | no recommendation |

Trigger draw protection when `P_draw >= 33%` and `favorite_win - P_draw < 12%`.

## Data Missing Rules

Missing xG/xT: use `proxy_chance`.

Missing last-20 match data: lower confidence one grade (`A->B`, `B->C`, `C->D`).

Missing injuries: mark `InjuryUnknown = True`; lower HT/FT and scoreline confidence.

Odds conflict: mark `MarketDisagreement = True`; risk review, do not follow odds mechanically.

## Post-Match Review

Track: WDL single, safe direction, HT/FT, handicap, score Top3 coverage, A/B/C/D layer performance.

Error types: draw underestimated; top finisher underestimated; collapse tail underestimated; physical resistance underestimated; low-block breaking underestimated; LowBlockConversionPenalty miss (未触发/应触发); SecondHalfSurgeFactor miss (未触发/应触发); possession-favorite misclassification (A- 被误归为 S); injury error; goalkeeper overperformance; red card/VAR non-structural event.

Parameter adjustments: draw streak raises `DrawBase`; elite favorites repeatedly break late raises `FinisherFactor`; possession favorites repeatedly fail → 降级为 A- 并触发 LowBlockConversionPenalty; A- 球队连续打穿 → 考虑升为 A 级; African/physical teams overperform raises `PhysicalResistance`; big scores raise `CollapseTail`; handicap failures raise handicap thresholds; SecondHalfSurgeFactor 连续命中 → 扩大触发范围.
