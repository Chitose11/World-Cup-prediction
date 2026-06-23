# PDF Baselines

Source: `Kimi_2026_World_Cup_Report.pdf`, extracted and compressed from a 205-page PDF. Report date: 2026-06-05. Use as pre-tournament prior, not live truth.

## Data Source Layers

| Layer | Source | Data | Granularity | Update | Reliability |
|---|---|---|---|---|---|
| L1 results | FIFA, eloratings.net | match results, scores, event type | match | real-time/monthly | high |
| L2 ratings | FIFA SUM, Elo | national-team points/ranks | team | real-time/monthly | high |
| L3 event data | Opta, StatsBomb | shots, passes, touches | event | real-time | medium-high |
| L4 tracking | StatsBomb 360, Second Spectrum | player locations | frame | delayed | medium-high |
| L5 market | Polymarket, Kalshi, odds | odds, volume, implied probability | match/tournament | minute-level | medium-high |
| L6 player | Transfermarkt, club data | value, age, minutes | player | weekly | medium |
| L7 environment | NOAA, FIFA venue data | temperature, humidity, altitude, WBGT | venue | 24h before match | medium-high |

Use the data availability four-check before model calls: provenance, granularity, sample size, timeliness.

## Core Features From PDF

| Category | Feature | Build method |
|---|---|---|
| Rating | `ELO_1`, `ELO_2` | real-time Elo |
| Rating | `FIFA_SUM_1`, `FIFA_SUM_2` | FIFA monthly rank/points converted |
| Rating | `SPI_off`, `SPI_def` | attack/defense rating if available |
| Attack/defense | `ATT_rating`, `DEF_rating` | last-20 xG/xGA relative to event average |
| Process | `xG_diff_5`, `xT_per_90` | recent process form |
| Context | `HOME_ADV`, `ALTITUDE`, `WBGT_max`, `TRAVEL_km` | venue and logistics |
| Squad | `SQUAD_depth`, `KEY_dep` | bench quality and core-player dependency |
| Market | `IMPLIED_prob` | de-vigged implied probability |
| History | `H2H_5yr`, `MOMENTUM` | matchup history and Bayesian state |

## FIFA vs Elo Top 20 Baseline

| Rank | Team | Elo | Market implied title probability | FIFA rank | Elo-FIFA diff | Diagnosis |
|---:|---|---:|---|---:|---:|---|
| 1 | Spain | 2090 | 14.6%-20.0% | 1 | 0 | dual-system consensus |
| 2 | Argentina | 2047 | 11.7%-11.8% | 2 | 0 | defending champion premium |
| 3 | France | 2041 | 11.2%-16.7% | 3 | 0 | best squad depth |
| 4 | Brazil | 1990 | 6.7%-12.5% | 5 | +1 | Elo more optimistic |
| 5 | England | 1974 | 5.7%-15.4% | 4 | -1 | market high |
| 6 | Colombia | 1970 | 5.4% | 9 | +3 | Elo high |
| 7 | Portugal | 1967 | 5.2%-9.1% | 6 | -1 | consistent |
| 8 | Netherlands | 1951 | 3.9%-4.8% | 7 | -1 | consistent |
| 9 | Germany | 1940 | 3.7%-10.0% | 10 | +1 | market disagreement |
| 10 | Morocco | 1918 | 2.8% | 8 | -2 | FIFA high from 2022 |
| 11 | Croatia | 1895 | <2% | 11 | 0 | aging signal |
| 12 | Uruguay | 1882 | <2% | 13 | +1 | Elo slightly optimistic |
| 13 | Switzerland | 1868 | <1% | 14 | +1 | stable middle tier |
| 14 | Japan | 1845 | <1% | 15 | +1 | strongest AFC Elo |
| 15 | Senegal | 1832 | <1% | 12 | -3 | FIFA high |
| 16 | Iran | 1818 | <1% | 17 | +1 | consistent |
| 17 | Korea | 1805 | <1% | 19 | +2 | Elo slightly optimistic |
| 18 | Ecuador | 1798 | <1% | 20 | +2 | altitude/home-region bonus |
| 19 | Australia | 1785 | <1% | 21 | +2 | Elo slightly optimistic |
| 20 | Austria | 1780 | <1% | 16 | -4 | Elo materially lower |

## Title Probability Baseline

Eight-source equal-weight ensemble: Elo, FIFA, Poisson/Dixon-Coles, XGBoost, Goldman Sachs dynamic model, Opta Monte Carlo, prediction markets, bookmaker consensus. Market probabilities are de-vigged.

| Rank | Team | Confed | Base | 95% CI | Bull | Bear | Market | Bias pp |
|---:|---|---|---:|---|---:|---:|---:|---:|
| 1 | Spain | UEFA | 16.5% | 14%-20% | 22% | 10% | 18.2% | -1.7 |
| 2 | France | UEFA | 15.0% | 12%-18% | 20% | 8% | 16.7% | -1.7 |
| 3 | Argentina | CONMEBOL | 12.0% | 8%-14% | 16% | 6% | 11.1% | +0.9 |
| 4 | England | UEFA | 11.0% | 8%-14% | 16% | 5% | 14.3% | -3.3 |
| 5 | Germany | UEFA | 11.0% | 9%-14% | 18% | 5% | 7.4% | +3.6 |
| 6 | Brazil | CONMEBOL | 9.0% | 6%-11% | 14% | 4% | 11.1% | -2.1 |
| 7 | Portugal | UEFA | 7.0% | 5%-9% | 12% | 3% | 8.3% | -1.3 |
| 8 | Netherlands | UEFA | 4.0% | 3%-6% | 8% | 2% | 5.0% | -1.0 |
| 9 | Colombia | CONMEBOL | 3.5% | 2%-5% | 7% | 1% | 3.8% | -0.3 |
| 10 | Morocco | CAF | 1.5% | 1%-4% | 6% | 0.5% | 2.4% | +0.1 |
| 11 | Sweden | UEFA | 2.0% | 1%-3% | 3% | 0.8% | 1.5% | +0.5 |
| 12 | Belgium | UEFA | 1.0% | 1%-3% | 4% | 0.3% | 1.7% | -0.2 |
| 13 | Japan | AFC | 1.2% | 0.5%-2% | 3% | 0.2% | 0.8% | +0.4 |
| 14 | Mexico | CONCACAF | 1.0% | 0.3%-2% | 3% | 0.1% | 1.2% | -0.2 |
| 15 | United States | CONCACAF | 0.9% | 0.3%-2% | 2.5% | 0.1% | 1.0% | -0.1 |
| 16 | Uruguay | CONMEBOL | 0.8% | 0.3%-1.5% | 2% | 0.1% | 1.5% | -0.7 |
| 17 | Croatia | UEFA | 0.7% | 0.2%-1.5% | 2% | 0.1% | 0.9% | -0.2 |
| 18 | Scotland | UEFA | 0.6% | 0.2%-1.2% | 1.5% | 0.1% | 0.7% | -0.1 |
| 19 | Ecuador | CONMEBOL | 0.5% | 0.2%-1% | 1.5% | 0.1% | 0.4% | +0.1 |
| 20 | Switzerland | UEFA | 0.5% | 0.2%-1% | 1.2% | 0.1% | 0.6% | -0.1 |
| 21 | Senegal | CAF | 0.4% | 0.1%-0.8% | 1% | 0.05% | 0.3% | +0.1 |
| 22 | Turkiye | UEFA | 0.3% | 0.1%-0.6% | 0.8% | 0.05% | 0.5% | -0.2 |
| 23 | Norway | UEFA | 0.3% | 0.1%-0.6% | 1% | 0.03% | 0.4% | -0.1 |
| 24 | Korea | AFC | 0.3% | 0.1%-0.6% | 0.8% | 0.03% | 0.4% | -0.1 |
| 25 | Australia | AFC | 0.2% | 0.05%-0.5% | 0.6% | 0.02% | 0.2% | 0.0 |
| 26 | Canada | CONCACAF | 0.2% | 0.03%-0.5% | 0.5% | 0.01% | 0.3% | -0.1 |
| 27 | Iran | AFC | 0.15% | 0.03%-0.4% | 0.4% | 0.01% | 0.2% | -0.05 |
| 28 | Austria | UEFA | 0.15% | 0.03%-0.4% | 0.5% | 0.01% | 0.3% | -0.15 |
| 29 | Czechia | UEFA | 0.12% | 0.02%-0.3% | 0.3% | 0.01% | 0.2% | -0.08 |
| 30 | Qatar | AFC | 0.10% | 0.02%-0.25% | 0.3% | 0.01% | 0.15% | -0.05 |
| 31 | Saudi Arabia | AFC | 0.08% | 0.01%-0.2% | 0.2% | 0.01% | 0.1% | -0.02 |
| 32 | Egypt | CAF | 0.08% | 0.01%-0.2% | 0.25% | 0.01% | 0.1% | -0.02 |
| 33 | South Africa | CAF | 0.06% | 0.01%-0.15% | 0.15% | 0.005% | 0.08% | -0.02 |
| 34 | Algeria | CAF | 0.05% | 0.01%-0.12% | 0.12% | 0.005% | 0.06% | -0.01 |
| 35 | Bosnia-Herzegovina | UEFA | 0.04% | 0.005%-0.1% | 0.10% | 0.003% | 0.04% | -0.01 |
| 36 | Ivory Coast | CAF | 0.04% | 0.005%-0.1% | 0.1% | 0.003% | 0.05% | -0.01 |
| 37 | Tunisia | CAF | 0.03% | 0.003%-0.08% | 0.08% | 0.002% | 0.04% | -0.01 |
| 38 | Paraguay | CONMEBOL | 0.03% | 0.003%-0.08% | 0.08% | 0.002% | 0.04% | -0.01 |
| 39 | Haiti | CONCACAF | 0.02% | 0.002%-0.06% | 0.06% | 0.001% | 0.03% | -0.01 |
| 40 | DR Congo | CAF | 0.02% | 0.002%-0.06% | 0.06% | 0.001% | 0.03% | -0.01 |
| 41 | Ghana | CAF | 0.015% | 0.001%-0.05% | 0.04% | 0.001% | 0.02% | -0.005 |
| 42 | Jordan | AFC | 0.01% | 0.001%-0.03% | 0.03% | 0.0005% | 0.01% | 0.0 |
| 43 | New Zealand | OFC | 0.008% | 0.0005%-0.02% | 0.02% | 0.0003% | 0.01% | -0.002 |
| 44 | Uzbekistan | AFC | 0.005% | 0.0003%-0.015% | 0.015% | 0.0002% | 0.008% | -0.003 |
| 45 | Cape Verde | CAF | 0.003% | 0.0002%-0.01% | 0.01% | 0.0001% | 0.005% | -0.002 |
| 46 | Curacao | CONCACAF | 0.002% | 0.0001%-0.008% | 0.008% | 0.00005% | 0.003% | -0.001 |
| 47 | Iraq | AFC | 0.001% | 0.00005%-0.005% | 0.005% | 0.00003% | 0.002% | -0.001 |
| 48 | Panama | CONCACAF | 0.001% | 0.00003%-0.003% | 0.003% | 0.00002% | 0.001% | 0.0 |

## Model Disagreement Top 10

| Rank | Team | Disagreement | Max spread | Main source |
|---:|---|---:|---|---|
| 1 | England | 0.42 | 9.4pp | Goldman Sachs 5.0% vs market 14.3% |
| 2 | Brazil | 0.31 | 5.5pp | WorldCupRanking 18.7% vs Foresportia 6.7% |
| 3 | Germany | 0.28 | 5.5pp | dim14 correction 14.0% vs market 7.4% |
| 4 | Spain | 0.25 | 11.4pp | Goldman Sachs 26.0% vs Foresportia 14.6% |
| 5 | Colombia | 0.22 | 4.2pp | Elo high vs tournament-experience discount |
| 6 | Mexico | 0.20 | 3.5pp | host model premium vs base strength |
| 7 | Netherlands | 0.18 | 3.0pp | De Jong injury vs Koeman system maturity |
| 8 | Japan | 0.17 | 2.8pp | 2022 Germany/Spain wins vs repeatability discount |
| 9 | Morocco | 0.16 | 2.5pp | 2022 semifinal + 2025 AFCON vs aging |
| 10 | Portugal | 0.15 | 2.4pp | Ronaldo age/role vs Bruno/Bernardo creation |

## Semifinal And Quarterfinal Probabilities

| Team | Semi probability | 95% CI | Path notes |
|---|---:|---|---|
| Spain | 33.9% | 28%-40% | Pathway 1; key friction: England, France |
| Argentina | 30.5% | 25%-37% | Pathway 2; key friction: Brazil/Portugal |
| France | 30.4% | 25%-36% | Pathway 1; key friction: Germany/Netherlands, Spain |
| England | 20.1% | 15%-26% | Pathway 2; key friction: Spain or Brazil/Argentina |
| Brazil | 22.5% | 17%-28% | Pathway 2; possible Japan, England, Argentina |
| Portugal | 18.4% | 14%-24% | Pathway 2; likely Argentina in quarter |
| Germany | 14.2% | 10%-19% | Pathway 1; likely France in quarter |
| Netherlands | 15.8% | 12%-21% | Pathway 1; likely France/Germany |

Quarterfinal Top 16:

| Team | QF probability | 95% CI | Largest obstacle |
|---|---:|---|---|
| Spain | 48.2% | 42%-55% | R32 uncertainty |
| France | 47.5% | 41%-54% | R32 uncertainty |
| Argentina | 45.8% | 40%-52% | possible R16 strong opponent |
| England | 42.1% | 36%-49% | R16 opponent quality |
| Brazil | 38.6% | 32%-45% | possible Japan |
| Portugal | 35.2% | 30%-42% | R16 quality |
| Germany | 33.8% | 28%-40% | high-temperature venues |
| Netherlands | 31.5% | 26%-38% | De Jong recovery |
| Colombia | 28.4% | 23%-35% | knockout experience |
| Morocco | 26.7% | 22%-33% | European opponents |
| Belgium | 24.3% | 20%-30% | aging squad |
| Uruguay | 19.5% | 14%-25% | midfield creation |
| Japan | 18.5% | 14%-24% | physical duels |
| Mexico | 17.2% | 13%-22% | R16 European opponent |
| United States | 16.8% | 13%-22% | squad depth |
| Croatia | 15.3% | 12%-20% | aging/renewal |

## Odds Divergence Notes

Germany is the clearest model-over-market case: `+3.6pp`, attributed mainly to recency bias from 2018/2022 group exits and liquidity bias. England is the clearest market-over-model case: `-3.3pp`, attributed to Tuchel-effect availability bias and a possible narrative premium.

Top bias attribution:

| Team | Bias pp | Main bias | Confidence |
|---|---:|---|---|
| Germany | +3.6 | recency bias | high |
| England | -3.3 | availability/Tuchel effect | medium |
| Spain | -1.7 | competition among favorites | medium |
| France | -1.7 | bracket/competition premium | medium |
| Brazil | -2.1 | Ancelotti narrative premium | medium |
| Argentina | +0.9 | Messi narrative / Americas pricing | low |
| Portugal | -1.3 | Ronaldo age discount and depth uncertainty | low |
| Netherlands | -1.0 | De Jong injury / Koeman underpricing | low |

## Baseline Model Parameters

Monte Carlo standard: use at least `100,000` iterations when distinguishing close title probabilities; `10,000` is only a basic significance threshold.

Scenario assumptions:

| Parameter | Base | Bull | Bear |
|---|---|---|---|
| Core injuries | historical avg 5% | no injuries | injury wave 15% |
| Home advantage | venue-specific 1.10-1.25 | +0.1 | -0.1 |
| Elo update | latest pre-match | +2% strong-team edge | reset to one year prior |
| Weather/altitude | historical average | no extremes | sustained extremes |
| Upset probability | base Poisson | -25% | +50% |

Backtest target ranges from PDF: integrated 20-model ensemble aims at `55%-65%` correct-result rate, RPS `0.175-0.195`, Brier `<0.55`, calibration error `<5%` on walk-forward validation. Treat these as targets, not guarantees.
