# AI 迭代开发资料

本文档用于后续 AI 接手项目时快速建立上下文、确认完成度、选择迭代目标并验证结果。

## 项目目标

《我是老板 / I am boss》是一款 2D 像素风网页经营模拟游戏。玩家扮演老板，从创业初期开始经营公司，处理员工、工资、离职、赔偿、政策、社会周期、金融和上市，最终在公司破产、创始人退休或创始人死亡时计算总分。

## 完成度审计

| 初始需求 | 当前实现 | 主要文件 | 后续方向 |
| --- | --- | --- | --- |
| 个人能力 | 创始人与员工有技术、经验、抗压、沟通、情商、智商 | `src/sim/types.ts`, `src/sim/state.ts` | 增加更多性格对话和事件影响 |
| 公司能力 | 现金、负债、估值、知名度、士气、文化、资源、运营能力、人员配比 | `src/sim/types.ts`, `src/sim/company-resources.ts` | 增加办公地点、设备、管理制度 |
| 初始三选一 | 技术型、人脉型、抗压型创始人 | `src/config/initial-choices.ts` | 加入中文说明和难度提示 |
| game over | 破产、退休、死亡 | `src/sim/game-over.ts`, `src/sim/founder-lifecycle.ts` | 增加退休主动操作和结算动画 |
| 评分 | 天数×1 + 公司估值×2 + 创始人身价×1 | `src/sim/scoring.ts` | 展示历史最佳和分项趋势 |
| 未上市估值 | 分析师式收入倍数估值 | `src/sim/valuation.ts` | 加入券商研报事件和估值分歧 |
| 上市市值 | 上市后由公开市场波动计算 | `src/sim/securities-market.ts` | 增加交易所规则、披露和投资者关系 |
| 招聘系统 | 候选人、背景、目标工资、底线工资、报价、录用概率 | `src/sim/staffing.ts`, `src/sim/hiring.ts` | 增加面试轮次、岗位职级和 Offer 谈判 |
| 工资与离职 | 发薪、加薪、解雇赔偿、离职风险 | `src/sim/employee-lifecycle.ts`, `src/sim/resignation.ts` | 增加劳动仲裁、竞业和团队连锁离职 |
| 社会系统 | 康波周期、失业率、政策、法院、特殊事件 | `src/sim/macro-cycle.ts`, `src/sim/policy.ts`, `src/sim/court.ts`, `src/sim/special-events.ts` | 增加行业政策和区域差异 |
| 金融系统 | 银行贷款、IPO、上市治理、保险、投资 | `src/sim/finance.ts`, `src/sim/listed-governance.ts`, `src/sim/insurance.ts`, `src/sim/investment.ts` | 增加融资轮次、股权稀释和债务再融资 |
| 概率配置 | 全部 tunable 概率和权重集中在配置文件 | `src/config/probabilities.ts` | 每个新增概率附 gameplay impact 注释 |
| Harness | 单种子、时间线、平衡批跑、快进、快照、概率审计 | `src/harness/` | 输出更多 UI 可视化平衡指标 |
| 网页端 | Vite 原型、像素风城市地图、中文默认、英文切换 | `src/web/`, `src/ui/` | 完善交互反馈、动效、移动端密度 |

## 架构边界

模拟层保持纯逻辑：

- `src/sim/`：业务规则和状态变更，避免 DOM、浏览器 API 和渲染概念。
- `src/config/`：初始选项和概率调参，新增随机行为优先放在这里配置。
- `src/harness/`：确定性 runner、快照、平衡报告和 CLI。
- `src/game/`：把玩家动作转成模拟层调用，输出 session。
- `src/ui/`：把 harness summary 转成渲染无关 view model。
- `src/web/`：浏览器事件、i18n、HTML 渲染和 CSS。

## Harness 输出契约

`HarnessSummary` 是 AI 迭代、平衡和 UI 的主要数据结构。关键字段：

| 字段 | 用途 |
| --- | --- |
| `daysPlayed` | 游戏天数和评分分项 |
| `companyValuation`, `valuationKind`, `listedMarketValue` | 私有估值/上市市值展示 |
| `playerWealth`, `score` | 结算和排行榜 |
| `cash`, `debt`, `totalMonthlyPayroll`, `averageEmployeeSalary` | 财务压力 |
| `staffRoleCounts`, `employees` | 人员配比、员工列表、离职风险 |
| `companyReputation`, `companyMorale`, `companyCulture`, `culturePressure` | 公司能力和文化 |
| `cyclePhase`, `unemploymentRate`, `legalCaseCount`, `policySupportCount`, `specialEventCount` | 社会环境 |
| `events`, `eventSummary`, `eventLog` | UI 事件流和调试 |
| `gameOverReason` | 结局原因 |
| `aiHiringEnabled`, `aiHires`, `aiHiringFailures` | AI 招聘验证 |
| `activeInsurancePolicies`, `investmentCount`, `portfolioValue`, `governanceScore`, `delistingRiskLevel` | 金融扩展 |

## 验证流程

小改动优先运行聚焦测试：

```bash
npm test -- tests/hiring.test.ts
npm test -- tests/web-screen.test.ts
```

通用验证：

```bash
npm run build
npm test
npm run build:web
```

浏览器流程验证：

```bash
npm run test:e2e
```

平衡验证：

```bash
npm run harness -- --seed 1 --days 365
npm run harness -- --seed 7 --days 200 --checkpointIntervalDays 90
npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90
npm run probability:audit
```

## 性能原则

- 模拟层使用确定性 seed，避免在渲染中重复跑长模拟。
- UI 层消费 summary 和 view model，避免直接扫描大型历史状态。
- 事件筛选和计数使用单次遍历。
- 浏览器点击使用根节点事件委托，减少每次 render 的监听器绑定成本。
- 大型 roster 后续应加入分页或虚拟列表；当前原型只展示最近关键员工和事件。
- 像素风视觉优先使用 CSS、字体和少量静态资源，控制 JS 包体积。

## 下一轮推荐目标

1. 新手引导：解释三种初始画像、现金跑道、招聘报价和 IPO 条件。
2. 招聘深化：加入面试轮次、候选人期望变化、谈判失败后的提价操作。
3. 平衡报表可读化：将 balance JSON 转成表格或网页报告。
4. UI 动效：添加像素风按钮反馈、事件闪烁、game over 结算动画。
5. 上市玩法：加入披露周期、股东压力、退市预警 UI。

每次迭代选择一个目标，新增或更新测试，记录至少一个 deterministic seed 示例。
