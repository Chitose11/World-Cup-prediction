# World Cup V3.3 赔率概率工作台

这是一个本地运行的世界杯赔率概率分析工作台。项目把 sporttery 官方赔率、联网情报、V3.3 r5 模型、玩法选择器和桌面端打包整合到一个可视化界面里，便于做赛前复盘、玩法筛选和模型留档。

> 数据和模型结果仅用于研究分析，不构成投注建议。

## 当前版本

- 应用版本：`0.2.6`
- 模型版本：`World Cup V3.3 r5`
- 核心变化：交互修正从表层胜平负百分点调整改为 lambda 乘数驱动，比分矩阵自然派生胜平负、让球、总进球、半全场等玩法概率。

## 核心能力

- 同步 sporttery 官方足球计算器赔率接口。
- 展示胜平负、让球胜平负、比分、总进球、半全场等玩法的隐含概率、模型概率、差值和风险。
- 联网搜索首发/预测阵容、伤停停赛、赛程动机、出线形势和盘口异动。
- 支持 Tavily Search，未配置或失败时回退到普通搜索链路。
- 自动把联网情报映射为模型输入，并刷新完整 V3.3 模型输出。
- 玩法选择器按模型方向、赔率差值、风险、比分矩阵、让球一致性和 V3.3 信号筛选候选项。
- 生成单场玩法方案、全日玩法计划和世界杯模拟盘。
- 支持整体模型快照导入/导出，用于复盘、回滚和分享。
- 支持 Electron portable exe 打包。

## V3.3 r5 模型概要

V3.3 r5 的核心链路：

```text
P0 ensemble + Elo/FIFA baseline
  -> Bayesian draw posterior
  -> dynamic signals
  -> lambda multipliers
  -> Poisson score matrix
  -> WDL / handicap / total goals / half-full / score markets
```

关键修正：

- 平局先验 `p0` 从 `0.25` 调整为 `0.24`。
- A- vs athletic resistance 不再在底层强制平局，而是在选择器层标记 Danger Zone，避免胜平负单选。
- A- 面对弱对手时按 Elo 差距降低交互惩罚，避免把强弱差过大的比赛与同级对抗等同处理。
- 玩法概率统一从同一个泊松比分矩阵派生，减少胜平负、让球、总进球之间的撕裂。

## 运行

安装依赖：

```powershell
npm install
```

启动本地服务：

```powershell
npm start
```

打开：

```text
http://localhost:4173
```

Windows 也可以双击：

```text
start-workbench.cmd
```

## Tavily 配置

后端只从本机读取 Tavily Key，不会暴露到前端页面，也不要把真实 Key 提交到仓库。

任选一种方式：

```powershell
$env:TAVILY_API_KEY="your-tavily-api-key"
npm start
```

或保存到：

```text
%USERPROFILE%\.codex\secrets\tavily_api_key.txt
```

## 桌面版打包

```powershell
npm run dist
```

产物默认输出到：

```text
dist\World Cup V3.2 Workbench-0.2.6-portable.exe
```

桌面版会启动内置本地服务，并使用随机本地端口，避免和已有 `4173` 端口冲突。

## 复测与验证

常用检查：

```powershell
node --check src/v32-engine.js
node --check public/app.js
node --check scripts/backtest-v33-selector.js
python -m py_compile model/world-cup-v32/scripts/world_cup_v32_helpers.py
```

玩法选择器回测：

```powershell
node scripts/backtest-v33-selector.js
```

历史回测 JSON 文件保留在项目根目录，便于对比不同模型版本表现。

## 项目结构

```text
src/                         后端服务、模型引擎、Electron 入口
public/                      前端页面、样式和交互逻辑
model/world-cup-v32/         Skill、模型说明、辅助脚本和参考数据
scripts/                     回测和验证脚本
outputs/                     本地输出目录，不建议提交
dist/                        打包产物，不提交
```

## 发布注意

- 不提交 `node_modules/`、`dist/`、`outputs/` 和任何本地密钥文件。
- 分享项目时只分享源码、模型文档、参考数据和脚本。
- 如果要分享可执行文件，单独提供 `dist` 里的 portable exe。
