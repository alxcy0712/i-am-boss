# 我是老板 / I am boss

2D 像素风网页经营模拟游戏。玩家扮演创业老板，从初始创始人画像开始经营公司，招聘员工、管理工资和文化、面对政策与市场周期、争取贷款和上市，最终在破产、退休或死亡时结算总分。

[English README](README.en.md)

## 当前状态

项目已有可玩的网页原型、确定性模拟系统、harness、平衡报告、Vitest 单元测试和 Playwright 核心流程测试。

核心需求完成度：

| 需求 | 状态 | 入口 |
| --- | --- | --- |
| 个人能力与公司能力 | 已实现 | `src/sim/types.ts`, `src/sim/state.ts` |
| 三选一初始条件 | 已实现 | `src/config/initial-choices.ts` |
| 破产、退休、死亡 game over | 已实现 | `src/sim/game-over.ts` |
| 1:2:1 评分 | 已实现 | `src/sim/scoring.ts` |
| 未上市估值与上市市值 | 已实现 | `src/sim/valuation.ts`, `src/sim/securities-market.ts` |
| 招聘、工资、谈判、离职、赔偿 | 已实现 | `src/sim/hiring.ts`, `src/sim/staffing.ts`, `src/sim/employee-lifecycle.ts`, `src/sim/resignation.ts` |
| 政策、法院、宏观周期、特殊事件 | 已实现 | `src/sim/policy.ts`, `src/sim/court.ts`, `src/sim/macro-cycle.ts`, `src/sim/special-events.ts` |
| 银行贷款、IPO、上市治理 | 已实现 | `src/sim/finance.ts`, `src/sim/listed-governance.ts` |
| 概率集中配置 | 已实现 | `src/config/probabilities.ts` |
| 中文默认、英文切换 | 已实现 | `src/web/i18n.ts` |

后续迭代资料见 [AI 迭代开发资料](docs/ai-iteration-guide.md) 和 [UI 草案](docs/ui-drafts.md)。

## 快速开始

```bash
npm install
npm run dev
```

浏览器原型默认运行在 `127.0.0.1`，Vite 会打印具体端口。

## 常用命令

```bash
npm run build
npm run build:web
npm test
npm run test:e2e
npm run harness -- --seed 1 --days 365
npm run harness -- --seed 7 --days 200 --checkpointIntervalDays 90
npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90
npm run probability:audit
```

`npm run test:e2e` 会使用内存截图检查桌面和移动端布局，不保留本地截图产物。

## 项目结构

```text
src/config/        初始选项、概率表、平衡常量
src/sim/           公司、员工、金融、社会、评分等纯模拟系统
src/harness/       seeded runner、快进、快照、平衡报告、概率审计
src/game/          渲染无关的 session 控制器和玩家动作
src/ui/            HUD 与城市地图 view model
src/web/           Vite 浏览器客户端
tests/             Vitest 与 Playwright 测试
docs/              经济模型、AI 迭代资料、UI 草案
public/fonts/      像素字体资源
```

## 玩法系统

初始阶段提供三种创始人画像：技术型、人脉型、抗压型。选择后创建初始公司状态，生成创始人能力、现金、知名度、文化和社会环境。

经营阶段包含：

- 招聘：根据公司规模、收入、资源规划岗位，生成候选人背景、能力、目标工资和底线工资。
- 人员：员工拥有技术、经验、抗压、沟通、情商、智商、性格、薪资、任期和管理层级。
- 公司：公司拥有现金、负债、估值、收入、月消耗、知名度、士气、文化、资源、运营能力和人员配比。
- 社会：宏观周期影响市场情绪和失业率，政策支持、法院案件和特殊事件改变现金、声誉与市场。
- 金融：银行贷款、IPO、上市市值、上市治理、退市风险、保险和投资组合。
- 结局：破产、退休或死亡触发 game over，按经营天数、公司估值、创始人身价计算总分。

## Harness

Harness 是后续平衡和 AI 迭代的主入口。它提供确定性种子、快进、时间线检查点、平衡批跑和概率配置审计。

单种子摘要：

```bash
npm run harness -- --seed 1 --days 365
```

时间线检查点：

```bash
npm run harness -- --seed 7 --days 200 --checkpointIntervalDays 90
```

多种子平衡报告：

```bash
npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90
```

## 概率和平衡

所有概率、权重和调参项集中在 `src/config/probabilities.ts`。修改玩法概率时优先改该文件，并补充或更新对应测试。

建议平衡流程：

1. 修改 `src/config/probabilities.ts`
2. 运行聚焦测试
3. 运行 `npm run balance -- --seedStart 1 --runs 10 --days 365 --checkpointIntervalDays 90`
4. 记录关键种子、game over 原因、估值、现金、人数、事件数量

## 内容安全

游戏可以保留抽象的公司违规、员工违规、法院案件和金融风险事件。黄色、暴力、色情、剥削性内容不得进入玩法、文案、素材、fixtures 和测试。

## 开发建议

后续 AI 迭代优先从文档中选择一个小目标，配套 deterministic seed 和测试入口。模拟逻辑保持渲染无关，网页层只消费 session 和 view model。
