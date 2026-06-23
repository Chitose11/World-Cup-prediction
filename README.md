# World Cup V3.3 赔率概率工作台

这是一个本地运行的世界杯赔率概率分析工作台。项目把 sporttery 官方赔率、联网情报、V3.3 r6 模型、玩法选择器和桌面端打包整合到一个可视化界面里，便于做赛前复盘、玩法筛选和模型留档。

> ⚠️ 数据和模型结果仅用于研究分析，不构成投注建议。量化有风险，进场需谨慎。

## 当前版本

- 应用版本：`0.2.6`
- 模型版本：`World Cup V3.3 r6` (Lambda 架构终极修订版)
- 核心变化：彻底抛弃了早期表层胜平负的加减法修补，全面转由底层泊松 Lambda 乘数驱动。并在此基础上解决了"战术叠加导致的概率坍塌"与"长尾高赔率幻觉"两大命门。

## 核心能力

- 同步 sporttery 官方足球计算器赔率接口。
- 展示胜平负、让球胜平负、比分、总进球、半全场等玩法的隐含概率、模型概率、差值和风险。
- 联网搜索首发/预测阵容、伤停停赛、赛程动机、出线形势和盘口异动（支持 Tavily Search 回退机制）。
- 自动把联网情报映射为模型输入，并刷新完整 V3.3 模型输出。
- **三重风控选择器**：按模型方向、赔率差值、比分矩阵、让球一致性筛选候选项；结合 `EV / (Odds - 1)` 的分母惩罚自然粉碎长尾陷阱；配置了 `2.2倍偏离度熔断` 防止 EV 幻觉。
- 生成单场玩法方案、全日玩法计划（区分稳健/进取模式）和世界杯模拟盘。
- 支持整体模型快照导入/导出，支持 Electron portable exe 独立打包。

## V3.3 r6 模型概要

V3.3 r6 是当前最严谨的泊松驱动版本。它的核心链路：

```text
P0 ensemble + Elo/FIFA baseline
  -> Bayesian draw posterior
  -> dynamic signals & research penalty
  -> tactical lambda multipliers (with 0.85 floor limit)
  -> Poisson score matrix
  -> play-specific tuning (HT/FT, Handicap, TTG)
```

**r6 关键跃迁与修正：**

- **Lambda 乘数坍塌修复 (The Lambda Shift)**：将低位防守、战术克制、不稳定标签等"同质化战术惩罚"由无脑连乘改为合并计算，并设置 `0.85` 的跌停底线锁。彻底解决强队打大巴时预期进球被严重低估（如 0-0 概率异常飙升）的 Bug。外部伤停情报则保持独立运算。
- **高赔率偏离度熔断**：在玩法选择器加入最后一道物理防线 `prob / impliedProb > 2.2`。直接斩杀模型底层在极低比分区间的天然残余偏差，根绝长尾暴利陷阱。
- **动态局势唤醒**：激活半全场 (hafu)、让球与总进球的定制微调。泊松矩阵时间轴分布真实映射了诸如"上半场久攻不下，下半场依靠板凳深度发力"的战术剧本。
- **底层概率倒挂兜底**：引入 `fav_win ≥ max(base_win - 8pp, 40%)` 绝对下限保护，防止极端惩罚引发冷热概率倒挂。
- **平局先验自适应**：`p0` 从 `0.25` 调整为 `0.24`，并缩小贝叶斯先验样本量（n0=20），使模型对当届杯赛真实的沉闷/开放程度更加敏感。

## 运行与部署

安装依赖：
```powershell
npm install
```

启动本地服务：
```powershell
npm start
```
> 打开浏览器访问：`http://localhost:4173`
> Windows 用户亦可直接双击 `start-workbench.cmd`

### Tavily API 配置
后端仅从本机读取密钥，不会向前端暴露。任选以下一种方式：
```powershell
# 方式一：环境变量注入
$env:TAVILY_API_KEY="your-tavily-api-key"
npm start
```
或保存到秘钥文件（推荐）：
`%USERPROFILE%\.codex\secrets\tavily_api_key.txt`

## 桌面版打包

```powershell
npm run dist
```
产物默认输出到：`dist\World Cup V3.2 Workbench-0.2.6-portable.exe`
> 桌面版启动时会分配随机本地端口，避免与已运行的 `4173` 冲突。

## 复测与回溯验证

每次修改模型后，必须执行以下基准测试：
```powershell
# 语法与链路自检
node --check src/v32-engine.js
node --check public/app.js
python -m py_compile model/world-cup-v32/scripts/world_cup_v32_helpers.py

# 历史回测 JSON 快照对比
node scripts/backtest-v33-selector.js
```

## 项目结构

```text
src/                         后端服务、模型引擎、Electron 入口
public/                      前端页面、样式和交互逻辑
model/world-cup-v32/         Skill、模型规则文档、辅助脚本和参考数据
scripts/                     回测和验证脚本
outputs/                     (自动生成) 本地输出日志，勿提交
dist/                        (自动生成) 打包产物，勿提交
```

## 发布守则
- 绝对禁止提交 `node_modules/`、`dist/`、`outputs/` 及任何包含本机 Key 的文件！
- 共享开源项目时只脱敏分享源码、模型文档和打分架构。
- 独立发行可将 `dist` 目录下的 portable exe 打包分发。
