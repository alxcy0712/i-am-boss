import { createGameSession, performSessionAction, selectInitialChoice } from "../src/game/session";
import { summarizeGameState } from "../src/harness/sim-harness";
import { hireEmployee } from "../src/sim/employee-lifecycle";
import { createWebScreenModel } from "../src/web/screen";

describe("createWebScreenModel", () => {
  it("defaults the startup screen to Simplified Chinese", () => {
    const screen = createWebScreenModel(createGameSession({ seed: 9 }));

    expect(screen.language).toBe("zh-CN");
    expect(screen.languageOptions).toEqual([
      { id: "zh-CN", label: "简体中文", selected: true },
      { id: "en", label: "English", selected: false },
    ]);
    expect(screen.subtitle).toBe("选择创始人画像，设置公司的第一批公司能力。");
    expect(screen.initialChoices.map((choice) => choice.label)).toEqual([
      "技术型创始人",
      "人脉型创始人",
      "抗压型创始人",
    ]);
    expect(screen.actions.map((action) => action.label)).toContain("推进 30 天");
    expect(screen.eventFeed).toEqual(["选择一个创始人背景开始游戏。"]);
  });

  it("shows founder choices before the game starts", () => {
    const screen = createWebScreenModel(createGameSession({ seed: 9 }), { language: "en" });

    expect(screen.stage).toBe("startup");
    expect(screen.initialChoices.map((choice) => choice.id)).toEqual([
      "technical-founder",
      "network-founder",
      "resilient-founder",
    ]);
    expect(screen.actions.every((action) => !action.enabled)).toBe(true);
  });

  it("can render an English operating screen through the language option", () => {
    const started = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const screen = createWebScreenModel(started, { language: "en" });

    expect(screen.language).toBe("en");
    expect(screen.languageOptions).toEqual([
      { id: "zh-CN", label: "简体中文", selected: false },
      { id: "en", label: "English", selected: true },
    ]);
    expect(screen.subtitle).toBe(
      "Manage cash, people, policy, and market pressure from the city map.",
    );
    expect(screen.copy).toMatchObject({
      cityMapAria: "City map",
      recruitmentDesk: "Recruitment Desk",
      financeDesk: "Finance Desk",
      ipoRequirements: "IPO Requirements",
      loanPrefix: "Loan",
    });
    expect(screen.recruitment?.abilityRows.map((row) => row.label)).toEqual([
      "Technical",
      "Experience",
      "Stress",
      "Communication",
      "EQ",
      "IQ",
    ]);
  });

  it("shows HUD tiles, map zones, actions, and events after startup", () => {
    const started = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const acted = performSessionAction(started, { id: "advance-30-days" }).session;
    const screen = createWebScreenModel(acted, { language: "en" });

    expect(screen.stage).toBe("operating");
    expect(screen.statTiles.map((tile) => tile.id)).toEqual([
      "cash",
      "valuation",
      "score",
      "headcount",
      "culture",
      "morale",
      "reputation",
      "pressure",
      "cycle",
    ]);
    expect(screen.mapZones.map((zone) => zone.id)).toContain("labor-market");
    expect(screen.actions.map((action) => action.id)).toContain("recruit-candidate");
    expect(screen.eventFeed.length).toBeGreaterThan(0);
  });

  it("builds a pixel city scene with district and infrastructure tiles", () => {
    const session = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const screen = createWebScreenModel(session, { language: "en" });
    const mapTiles =
      (
        screen as {
          mapTiles?: Array<{
            id: string;
            kind: string;
            zoneId?: string;
            gridArea: string;
          }>;
        }
      ).mapTiles ?? [];

    const districtTiles = mapTiles.filter((tile) => tile.kind === "district");

    expect(districtTiles.map((tile) => tile.zoneId)).toEqual([
      "company",
      "bank",
      "exchange",
      "labor-market",
      "court",
      "policy-office",
    ]);
    expect(mapTiles.some((tile) => tile.kind === "road")).toBe(true);
    expect(mapTiles.some((tile) => tile.kind === "plaza")).toBe(true);
    expect(new Set(mapTiles.map((tile) => tile.gridArea)).size).toBe(mapTiles.length);
  });

  it("shows a recruitment panel with editable offer, next-candidate limit, and ability chart", () => {
    const session = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const screen = createWebScreenModel(session, { language: "en" });
    const recruitment = (
      screen as {
        recruitment?: {
          role: string;
          targetSalary: string;
          minimumSalary: string;
          abilityRows: Array<{ label: string; value: string }>;
          abilityChart: {
            label: string;
            polygonPoints: string;
            axes: Array<{ label: string; value: number; valueLabel: string }>;
          };
          customOffer: {
            inputLabel: string;
            salary: number;
            equityPercent: number;
            actionId: string;
          };
          offerOptions: Array<{
            id: string;
            actionId: string;
            enabled: boolean;
            remaining?: number;
          }>;
        };
      }
    ).recruitment;

    expect(recruitment?.role).toBe("engineer");
    expect(recruitment?.targetSalary).toMatch(/^¥/);
    expect(recruitment?.minimumSalary).toMatch(/^¥/);
    expect(recruitment?.abilityRows.map((row) => row.label)).toEqual([
      "Technical",
      "Experience",
      "Stress",
      "Communication",
      "EQ",
      "IQ",
    ]);
    expect(recruitment?.abilityChart.label).toBe("Ability hex");
    expect(recruitment?.abilityChart.axes.map((axis) => axis.label)).toEqual([
      "Technical",
      "Experience",
      "Stress",
      "Communication",
      "EQ",
      "IQ",
    ]);
    expect(
      recruitment?.abilityChart.axes.every((axis) => axis.value >= 0 && axis.value <= 10),
    ).toBe(true);
    expect(recruitment?.abilityChart.polygonPoints.split(" ")).toHaveLength(6);
    expect(recruitment?.customOffer.inputLabel).toBe("Offer");
    expect(recruitment?.customOffer.salary).toBeGreaterThan(0);
    expect(recruitment?.customOffer.actionId).toBe("recruit-candidate");
    expect(recruitment?.offerOptions).toHaveLength(1);
    expect(recruitment?.offerOptions[0]).toMatchObject({
      id: "next-candidate",
      actionId: "skip-candidate",
      enabled: true,
      remaining: 10,
    });
  });

  it("disables next-candidate after ten skips and re-enables it after advancing time", () => {
    let session = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");

    for (let index = 0; index < 10; index += 1) {
      session = performSessionAction(session, { id: "skip-candidate" } as never).session;
    }

    const blockedScreen = createWebScreenModel(session, { language: "en" });
    expect(blockedScreen.recruitment?.offerOptions).toHaveLength(1);
    expect(blockedScreen.recruitment?.offerOptions[0]).toMatchObject({
      id: "next-candidate",
      actionId: "skip-candidate",
      enabled: false,
      remaining: 0,
    });

    const advanced = performSessionAction(session, { id: "advance-30-days" }).session;
    const resetScreen = createWebScreenModel(advanced, { language: "en" });

    expect(resetScreen.recruitment?.offerOptions[0]).toMatchObject({
      id: "next-candidate",
      enabled: true,
      remaining: 10,
    });
  });

  it("shows localized staff mix and payroll metrics after hiring", () => {
    const session = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    if (!session.state) {
      throw new Error("Expected selected session to have state");
    }

    hireEmployee(session.state, {
      salary: 9_000,
      equityPercent: 0.2,
      candidate: {
        role: "engineer",
        targetSalary: 12_000,
        minimumSalary: 10_000,
        technical: 7,
        experienceYears: 3,
        stressTolerance: 6,
        communication: 5,
        eq: 5,
        iq: 7,
        background: {
          educationTier: "strong",
          major: "computer-science",
          industryExperienceYears: 2,
        },
        personality: 0,
      },
    });
    session.summary = summarizeGameState(session.state);

    const screen = createWebScreenModel(session, { language: "zh-CN" });

    expect(screen.staff).toMatchObject({
      title: "人员配比",
      employeeCount: { label: "员工", value: "1" },
      totalMonthlyPayroll: { label: "月薪总额", value: "¥9,000" },
      averageEmployeeSalary: { label: "平均工资", value: "¥9,000" },
    });
    expect(screen.staff?.roleRows).toEqual([
      { id: "engineer", label: "工程师", count: 1, share: "100%" },
      { id: "product", label: "产品", count: 0, share: "0%" },
      { id: "sales", label: "销售", count: 0, share: "0%" },
      { id: "finance", label: "财务", count: 0, share: "0%" },
      { id: "hr", label: "人力", count: 0, share: "0%" },
    ]);
    expect(screen.staff?.employeeRows).toEqual([
      {
        id: "engineer-0-1",
        role: "工程师",
        salary: "¥9,000",
        targetSalary: "¥12,000",
        personality: "稳健型",
        tenure: "0个月",
        managementLevel: "个人贡献者",
        resignationRisk: "27%",
        resignationRiskLevel: "低风险",
        raiseSalary: "¥9,900",
        raiseSalaryAmount: 9_900,
        raiseActionLabel: "加薪",
        terminateActionLabel: "解雇",
      },
    ]);
  });

  it("shows localized culture strategy options with projected impacts", () => {
    const session = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    if (!session.state) {
      throw new Error("Expected selected session to have state");
    }

    hireEmployee(session.state, {
      salary: 9_000,
      equityPercent: 0.2,
      candidate: {
        role: "engineer",
        targetSalary: 12_000,
        minimumSalary: 10_000,
        technical: 7,
        experienceYears: 3,
        stressTolerance: 6,
        communication: 5,
        eq: 5,
        iq: 7,
        background: {
          educationTier: "strong",
          major: "computer-science",
          industryExperienceYears: 2,
        },
        personality: 0,
      },
    });
    session.summary = summarizeGameState(session.state);

    const screen = createWebScreenModel(session, { language: "zh-CN" });

    expect(screen.culture).toMatchObject({
      title: "文化策略",
      currentLabel: "当前",
      pressureLabel: "压力",
      moraleLabel: "士气",
      reputationLabel: "声誉",
      resignationRiskLabel: "离职风险",
    });
    expect(screen.culture?.options).toEqual([
      {
        id: "wolf",
        label: "狼性文化",
        selected: false,
        pressure: "9/10",
        moraleDelta: "-0.8",
        reputationDelta: "+0.0",
        projectedAverageResignationRisk: "55%",
        actionLabel: "切换",
      },
      {
        id: "laissez-faire",
        label: "无为而治",
        selected: false,
        pressure: "3/10",
        moraleDelta: "+0.5",
        reputationDelta: "-0.2",
        projectedAverageResignationRisk: "28%",
        actionLabel: "切换",
      },
      {
        id: "adaptive",
        label: "适应型文化",
        selected: true,
        pressure: "5/10",
        moraleDelta: "+0.3",
        reputationDelta: "+0.2",
        projectedAverageResignationRisk: "26%",
        actionLabel: "当前",
      },
      {
        id: "striver",
        label: "奋斗精神",
        selected: false,
        pressure: "7/10",
        moraleDelta: "-0.2",
        reputationDelta: "+0.1",
        projectedAverageResignationRisk: "39%",
        actionLabel: "切换",
      },
    ]);
  });

  it("shows a finance panel with runway, debt, loan, and IPO status", () => {
    const session = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const screen = createWebScreenModel(session, { language: "en" });
    const finance = (
      screen as {
        finance?: {
          runway: string;
          cash: string;
          debt: string;
          valuationBasis: string;
          marketBoard: {
            basis: string;
            sourceLabel: string;
            value: string;
            sentiment: string;
          };
          loanOption: { amount: string; actionId: string };
          ipoStatus: { label: string; ready: boolean; actionId: string };
          ipoRequirements: Array<{
            id: string;
            label: string;
            current: string;
            required: string;
            met: boolean;
          }>;
        };
      }
    ).finance;

    expect(finance?.runway).toMatch(/months$/);
    expect(finance?.cash).toMatch(/^¥/);
    expect(finance?.debt).toMatch(/^¥/);
    expect(finance?.valuationBasis).toBe("analyst-estimate");
    expect(finance?.marketBoard).toEqual({
      basis: "analyst-estimate",
      sourceLabel: "Analyst estimate",
      value: "¥100,000",
      sentiment: "1.00x",
    });
    expect(finance?.loanOption).toEqual({
      amount: "¥80,000",
      actionId: "request-bank-loan",
      eligible: true,
    });
    expect(finance?.ipoStatus.actionId).toBe("prepare-ipo");
    expect(finance?.ipoStatus.ready).toBe(false);
    expect(finance?.ipoRequirements.map((requirement) => requirement.id)).toEqual([
      "annual-revenue",
      "reputation",
      "headcount",
      "operational-capability",
    ]);
    expect(finance?.ipoRequirements.map((requirement) => requirement.met)).toEqual([
      false,
      false,
      false,
      true,
    ]);
    expect(finance?.ipoRequirements[0]).toMatchObject({
      label: "Annual revenue",
      current: "¥90,000",
      required: "¥1,000,000",
    });
    expect(finance?.ipoRequirements[1]).toMatchObject({
      label: "Reputation",
      current: "5/10",
      required: "7/10",
    });
    expect(finance?.ipoRequirements[2]).toMatchObject({
      label: "Headcount",
      current: "1",
      required: "30",
    });
    expect(finance?.ipoRequirements[3]).toMatchObject({
      label: "Operational capability",
      current: "5/10",
      required: "5/10",
    });
  });

  it("shows listed market status after a successful IPO", () => {
    const mature = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    if (!mature.state) {
      throw new Error("Expected selected session to have state");
    }

    mature.state.company.annualRevenue = 2_000_000;
    mature.state.company.reputation = 8;
    mature.state.company.headcount = 35;

    const listed = performSessionAction(mature, { id: "prepare-ipo" }).session;
    const screen = createWebScreenModel(listed, { language: "en" });
    const finance = (
      screen as {
        finance?: {
          valuationBasis: string;
          marketBoard: {
            basis: string;
            sourceLabel: string;
            value: string;
            sentiment: string;
          };
          ipoStatus: {
            label: string;
            ready: boolean;
            completed: boolean;
            actionId: string;
          };
          ipoRequirements: Array<{ met: boolean }>;
        };
      }
    ).finance;

    expect(finance?.valuationBasis).toBe("listed-market");
    expect(finance?.ipoStatus).toEqual({
      label: "Listed company",
      ready: false,
      completed: true,
      actionId: "prepare-ipo",
    });
    expect(finance?.marketBoard).toMatchObject({
      basis: "listed-market",
      sourceLabel: "Public market",
      sentiment: "1.00x",
    });
    expect(finance?.marketBoard.value).toMatch(/^¥/);
    expect(finance?.ipoRequirements.every((requirement) => requirement.met)).toBe(true);
  });

  it("localizes core operating labels and common events in Simplified Chinese", () => {
    const started = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const borrowed = performSessionAction(started, {
      id: "request-bank-loan",
      amount: 80_000,
    }).session;
    const screen = createWebScreenModel(borrowed, { language: "zh-CN" });

    expect(screen.statTiles.map((tile) => tile.label)).toEqual([
      "现金",
      "估值",
      "得分",
      "人数",
      "文化",
      "士气",
      "知名度",
      "压力",
      "周期",
    ]);
    expect(screen.mapZones.map((zone) => zone.label)).toContain("劳动力市场");
    expect(screen.copy).toMatchObject({
      cityMapAria: "城市地图",
      recruitmentDesk: "招聘台",
      financeDesk: "财务台",
      ipoRequirements: "IPO 条件",
      loanPrefix: "贷款",
    });
    expect(screen.recruitment?.abilityRows.map((row) => row.label)).toEqual([
      "技术",
      "经验",
      "抗压",
      "沟通",
      "情商",
      "智商",
    ]);
    expect(screen.finance?.runway).toMatch(/个月$/);
    expect(screen.finance?.marketBoard.sourceLabel).toBe("分析师估值");
    expect(screen.founder).toMatchObject({
      title: "创始人能力",
      age: { label: "年龄", value: "25" },
      health: { label: "健康", value: "100/100" },
      wealth: { label: "身价", value: "¥20,000" },
    });
    expect(screen.founder?.abilityRows).toEqual([
      { label: "技术", value: "5/10" },
      { label: "经验", value: "1/10" },
      { label: "抗压", value: "5/10" },
      { label: "沟通", value: "6/10" },
      { label: "情商", value: "6/10" },
      { label: "智商", value: "5/10" },
    ]);
    expect(screen.finance?.ipoRequirements.map((requirement) => requirement.label)).toEqual([
      "年收入",
      "知名度",
      "人数",
      "运营能力",
    ]);
    expect(screen.actions.map((action) => action.label)).toEqual([
      "推进 30 天",
      "招聘候选人",
      "申请银行贷款",
      "申请政策支持",
      "准备 IPO",
      "切换公司文化",
      "切换 AI 招聘",
      "运行 AI 招聘周期",
      "购买保险",
      "提交保险理赔",
      "进行投资",
      "出售投资",
      "购买汽车",
      "升级汽车",
      "结婚",
      "生子",
    ]);
    expect(
      (
        screen as {
          eventItems?: Array<{
            text: string;
            category: string;
            severity: string;
            categoryLabel?: string;
            severityLabel?: string;
          }>;
        }
      ).eventItems?.at(-1),
    ).toMatchObject({
      text: "银行贷款获批：¥80,000",
      category: "finance",
      severity: "positive",
      categoryLabel: "金融",
      severityLabel: "正向",
    });
    expect(screen.eventFeed.at(-1)).toBe("银行贷款获批：¥80,000");
  });

  it("uses structured event payloads before legacy event strings", () => {
    const started = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const borrowed = performSessionAction(started, {
      id: "request-bank-loan",
      amount: 80_000,
    }).session;

    if (!borrowed.summary) {
      throw new Error("Expected action to produce a summary");
    }

    borrowed.summary.eventLog = ["legacy text"];
    (borrowed.summary as { events?: Array<{ type: string; day: number; amount: number }> }).events =
      [
        {
          type: "bank_loan_approved",
          day: 0,
          amount: 80_000,
        },
      ];

    const screen = createWebScreenModel(borrowed, { language: "zh-CN" });

    expect(screen.eventFeed).toEqual(["银行贷款获批：¥80,000"]);
  });

  it("builds localized event filter options and filters events by category", () => {
    const started = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const borrowed = performSessionAction(started, {
      id: "request-bank-loan",
      amount: 80_000,
    }).session;
    const screen = createWebScreenModel(borrowed, {
      language: "zh-CN",
      eventCategoryFilter: "finance",
    });

    expect(screen.eventFilterOptions).toEqual([
      { id: "all", label: "全部", count: 2, selected: false },
      { id: "founder", label: "创始人", count: 1, selected: false },
      { id: "finance", label: "金融", count: 1, selected: true },
    ]);
    expect(screen.eventItems.map((item) => item.category)).toEqual(["finance"]);
    expect(screen.eventFeed).toEqual(["银行贷款获批：¥80,000"]);
  });

  it("falls back to all events when the selected event category has no entries", () => {
    const started = selectInitialChoice(createGameSession({ seed: 9 }), "network-founder");
    const borrowed = performSessionAction(started, {
      id: "request-bank-loan",
      amount: 80_000,
    }).session;
    const screen = createWebScreenModel(borrowed, {
      language: "en",
      eventCategoryFilter: "legal",
    });

    expect(screen.eventFilterOptions).toEqual([
      { id: "all", label: "ALL", count: 2, selected: true },
      { id: "founder", label: "FOUNDER", count: 1, selected: false },
      { id: "finance", label: "FINANCE", count: 1, selected: false },
    ]);
    expect(screen.eventItems.map((item) => item.category)).toEqual(["founder", "finance"]);
  });
});
