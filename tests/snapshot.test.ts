import { deserializeGameState, serializeGameState } from "../src/harness/snapshot";
import { hireEmployee } from "../src/sim/employee-lifecycle";
import { purchaseInsurance } from "../src/sim/insurance";
import { makeInvestment } from "../src/sim/investment";
import { generateCandidate } from "../src/sim/staffing";
import { createInitialGameState } from "../src/sim/state";

describe("game state snapshots", () => {
  it("round-trips game state without sharing mutable references", () => {
    const state = createInitialGameState({ seed: 9, initialChoiceId: "network-founder" });
    const candidate = generateCandidate({ seed: 11, role: "engineer", seniority: "junior" });
    hireEmployee(state, { candidate, salary: candidate.targetSalary, equityPercent: 0.1 });

    const snapshot = serializeGameState(state);
    const restored = deserializeGameState(snapshot);

    expect(restored).toEqual(state);
    restored.company.cash += 1;
    expect(restored.company.cash).not.toBe(state.company.cash);
    expect(snapshot).toContain('"version":1');
  });

  it("rejects snapshots without a usable game state", () => {
    expect(() => deserializeGameState(JSON.stringify({ version: 1 }))).toThrow(
      "Invalid snapshot: missing game state",
    );
    expect(() => deserializeGameState(JSON.stringify({ version: 1, state: null }))).toThrow(
      "Invalid snapshot: missing game state",
    );
    expect(() => deserializeGameState(JSON.stringify({ version: 1, state: {} }))).toThrow(
      "Invalid snapshot: missing company state",
    );
  });

  it("rejects snapshots with invalid company numeric fields", () => {
    const state = createInitialGameState({ seed: 9 });
    const snapshot = JSON.parse(serializeGameState(state)) as {
      state: { company: { cash: null } };
    };
    snapshot.state.company.cash = null;

    expect(() => deserializeGameState(JSON.stringify(snapshot))).toThrow(
      "Invalid snapshot: invalid numeric field: company.cash",
    );
  });

  it("rejects snapshots with invalid founder numeric fields", () => {
    const state = createInitialGameState({ seed: 9 });
    const snapshot = JSON.parse(serializeGameState(state)) as {
      state: { founder: { wealth: string } };
    };
    snapshot.state.founder.wealth = "bad";

    expect(() => deserializeGameState(JSON.stringify(snapshot))).toThrow(
      "Invalid snapshot: invalid numeric field: founder.wealth",
    );
  });

  it("rejects snapshots with invalid employee numeric fields", () => {
    const state = createInitialGameState({ seed: 9 });
    const candidate = generateCandidate({ seed: 11, role: "engineer", seniority: "junior" });
    hireEmployee(state, { candidate, salary: candidate.targetSalary, equityPercent: 0.1 });
    const snapshot = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ salary: null }> } };
    };
    snapshot.state.company.employees[0].salary = null;

    expect(() => deserializeGameState(JSON.stringify(snapshot))).toThrow(
      "Invalid snapshot: invalid numeric field: company.employees[0].salary",
    );

    const invalidSalary = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ salary: number }> } };
    };
    invalidSalary.state.company.employees[0].salary = -1;

    expect(() => deserializeGameState(JSON.stringify(invalidSalary))).toThrow(
      "Invalid snapshot: invalid positive numeric field: company.employees[0].salary",
    );

    const invalidTargetSalary = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ targetSalary: number }> } };
    };
    invalidTargetSalary.state.company.employees[0].targetSalary = -1;

    expect(() => deserializeGameState(JSON.stringify(invalidTargetSalary))).toThrow(
      "Invalid snapshot: invalid positive numeric field: company.employees[0].targetSalary",
    );

    const invalidId = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ id: string }> } };
    };
    invalidId.state.company.employees[0].id = " ";

    expect(() => deserializeGameState(JSON.stringify(invalidId))).toThrow(
      "Invalid snapshot: invalid non-empty string field: company.employees[0].id",
    );

    const invalidRole = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ role: string }> } };
    };
    invalidRole.state.company.employees[0].role = "bad";

    expect(() => deserializeGameState(JSON.stringify(invalidRole))).toThrow(
      "Invalid snapshot: invalid company role: company.employees[0].role",
    );

    const invalidEducationTier = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ background: { educationTier: string } }> } };
    };
    invalidEducationTier.state.company.employees[0].background.educationTier = "bad";

    expect(() => deserializeGameState(JSON.stringify(invalidEducationTier))).toThrow(
      "Invalid snapshot: invalid education tier: company.employees[0].background.educationTier",
    );

    const invalidAbilityScore = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ technical: number }> } };
    };
    invalidAbilityScore.state.company.employees[0].technical = 99;

    expect(() => deserializeGameState(JSON.stringify(invalidAbilityScore))).toThrow(
      "Invalid snapshot: invalid score field: company.employees[0].technical",
    );

    const invalidMonthsTenure = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ monthsTenure: number }> } };
    };
    invalidMonthsTenure.state.company.employees[0].monthsTenure = -1;

    expect(() => deserializeGameState(JSON.stringify(invalidMonthsTenure))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: company.employees[0].monthsTenure",
    );
  });

  it("rejects snapshots missing required event and society collections", () => {
    const state = createInitialGameState({ seed: 9 });

    const missingSociety = JSON.parse(serializeGameState(state)) as {
      state: { society?: unknown };
    };
    delete missingSociety.state.society;
    expect(() => deserializeGameState(JSON.stringify(missingSociety))).toThrow(
      "Invalid snapshot: missing society state",
    );

    const missingEvents = JSON.parse(serializeGameState(state)) as { state: { events?: unknown } };
    delete missingEvents.state.events;
    expect(() => deserializeGameState(JSON.stringify(missingEvents))).toThrow(
      "Invalid snapshot: missing event list",
    );

    const missingEventLog = JSON.parse(serializeGameState(state)) as {
      state: { eventLog?: unknown };
    };
    delete missingEventLog.state.eventLog;
    expect(() => deserializeGameState(JSON.stringify(missingEventLog))).toThrow(
      "Invalid snapshot: missing event log",
    );
  });

  it("rejects snapshots missing required company and personal collections", () => {
    const state = createInitialGameState({ seed: 9 });

    const missingInsurance = JSON.parse(serializeGameState(state)) as {
      state: { company: { insurancePolicies?: unknown } };
    };
    delete missingInsurance.state.company.insurancePolicies;
    expect(() => deserializeGameState(JSON.stringify(missingInsurance))).toThrow(
      "Invalid snapshot: missing insurance policies",
    );

    const missingInvestments = JSON.parse(serializeGameState(state)) as {
      state: { company: { investments?: unknown } };
    };
    delete missingInvestments.state.company.investments;
    expect(() => deserializeGameState(JSON.stringify(missingInvestments))).toThrow(
      "Invalid snapshot: missing investments",
    );

    const missingCars = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { cars?: unknown } } };
    };
    delete missingCars.state.founder.personalLife.cars;
    expect(() => deserializeGameState(JSON.stringify(missingCars))).toThrow(
      "Invalid snapshot: missing car list",
    );

    const missingChildren = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { children?: unknown } } };
    };
    delete missingChildren.state.founder.personalLife.children;
    expect(() => deserializeGameState(JSON.stringify(missingChildren))).toThrow(
      "Invalid snapshot: missing child list",
    );
  });

  it("rejects snapshots with out-of-domain numeric fields", () => {
    const state = createInitialGameState({ seed: 9 });
    const candidate = generateCandidate({ seed: 11, role: "engineer", seniority: "junior" });
    hireEmployee(state, { candidate, salary: candidate.targetSalary, equityPercent: 0.1 });

    const negativeDay = JSON.parse(serializeGameState(state)) as { state: { day: number } };
    negativeDay.state.day = -1;
    expect(() => deserializeGameState(JSON.stringify(negativeDay))).toThrow(
      "Invalid snapshot: invalid non-negative integer field: state.day",
    );

    const fractionalHeadcount = JSON.parse(serializeGameState(state)) as {
      state: { company: { headcount: number } };
    };
    fractionalHeadcount.state.company.headcount = 1.5;
    expect(() => deserializeGameState(JSON.stringify(fractionalHeadcount))).toThrow(
      "Invalid snapshot: invalid non-negative integer field: company.headcount",
    );

    const negativeListedMarketValue = JSON.parse(serializeGameState(state)) as {
      state: { company: { isPublic: boolean; listedMarketValue: number } };
    };
    negativeListedMarketValue.state.company.isPublic = true;
    negativeListedMarketValue.state.company.listedMarketValue = -1;
    expect(() => deserializeGameState(JSON.stringify(negativeListedMarketValue))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: company.listedMarketValue",
    );

    const negativeEquity = JSON.parse(serializeGameState(state)) as {
      state: { company: { employees: Array<{ equityPercent: number }> } };
    };
    negativeEquity.state.company.employees[0].equityPercent = -0.01;
    expect(() => deserializeGameState(JSON.stringify(negativeEquity))).toThrow(
      "Invalid snapshot: invalid percentage field: company.employees[0].equityPercent",
    );

    const negativeSocietyCount = JSON.parse(serializeGameState(state)) as {
      state: { society: { policySupportCount: number } };
    };
    negativeSocietyCount.state.society.policySupportCount = -1;
    expect(() => deserializeGameState(JSON.stringify(negativeSocietyCount))).toThrow(
      "Invalid snapshot: invalid non-negative integer field: society.policySupportCount",
    );
  });

  it("rejects snapshots with invalid core enum fields", () => {
    const state = createInitialGameState({ seed: 9 });

    const invalidCulture = JSON.parse(serializeGameState(state)) as {
      state: { company: { culture: string } };
    };
    invalidCulture.state.company.culture = "bad";
    expect(() => deserializeGameState(JSON.stringify(invalidCulture))).toThrow(
      "Invalid snapshot: invalid company culture: company.culture",
    );

    const invalidIndustry = JSON.parse(serializeGameState(state)) as {
      state: { company: { industry: string } };
    };
    invalidIndustry.state.company.industry = "bad";
    expect(() => deserializeGameState(JSON.stringify(invalidIndustry))).toThrow(
      "Invalid snapshot: invalid company industry: company.industry",
    );

    const invalidCyclePhase = JSON.parse(serializeGameState(state)) as {
      state: { society: { cyclePhase: string } };
    };
    invalidCyclePhase.state.society.cyclePhase = "bad";
    expect(() => deserializeGameState(JSON.stringify(invalidCyclePhase))).toThrow(
      "Invalid snapshot: invalid macro cycle phase: society.cyclePhase",
    );
  });

  it("rejects snapshots with invalid governance metrics", () => {
    const state = createInitialGameState({ seed: 9 });
    const snapshot = JSON.parse(serializeGameState(state)) as {
      state: {
        company: {
          isPublic: boolean;
          governanceMetrics: {
            shareholderSatisfaction: null;
            disclosureCompliance: number;
            regulatoryCompliance: number;
            overallScore: number;
          };
        };
      };
    };
    snapshot.state.company.isPublic = true;
    snapshot.state.company.governanceMetrics = {
      shareholderSatisfaction: null,
      disclosureCompliance: 1,
      regulatoryCompliance: 1,
      overallScore: 1,
    };

    expect(() => deserializeGameState(JSON.stringify(snapshot))).toThrow(
      "Invalid snapshot: invalid percentage field: company.governanceMetrics.shareholderSatisfaction",
    );
  });

  it("rejects snapshots with invalid personal life fields", () => {
    const state = createInitialGameState({ seed: 9 });

    const invalidCarBrand = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { cars: Array<{ brand: unknown }> } } };
    };
    invalidCarBrand.state.founder.personalLife.cars.push({
      id: "car-1",
      brand: "   ",
      value: 1,
      maintenanceCost: 1,
      purchaseDate: 0,
    } as never);
    expect(() => deserializeGameState(JSON.stringify(invalidCarBrand))).toThrow(
      "Invalid snapshot: invalid non-empty string field: founder.personalLife.cars[0].brand",
    );

    const invalidCarValue = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { cars: Array<{ value: number }> } } };
    };
    invalidCarValue.state.founder.personalLife.cars.push({
      id: "car-1",
      brand: "test",
      value: -1,
      maintenanceCost: 1,
      purchaseDate: 0,
    } as never);
    expect(() => deserializeGameState(JSON.stringify(invalidCarValue))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: founder.personalLife.cars[0].value",
    );

    const invalidChildCost = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { children: Array<{ educationCost: number }> } } };
    };
    invalidChildCost.state.founder.personalLife.children.push({
      id: "child-1",
      name: "test",
      birthDate: 0,
      educationCost: -1,
      happiness: 5,
    } as never);
    expect(() => deserializeGameState(JSON.stringify(invalidChildCost))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: founder.personalLife.children[0].educationCost",
    );

    const invalidChildName = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { children: Array<{ name: unknown }> } } };
    };
    invalidChildName.state.founder.personalLife.children.push({
      id: "child-1",
      name: "",
      birthDate: 0,
      educationCost: 1,
      happiness: 5,
    } as never);
    expect(() => deserializeGameState(JSON.stringify(invalidChildName))).toThrow(
      "Invalid snapshot: invalid non-empty string field: founder.personalLife.children[0].name",
    );

    const invalidMarriageRisk = JSON.parse(serializeGameState(state)) as {
      state: {
        founder: {
          personalLife: {
            marriage: {
              spouseName: string;
              marriageDate: number;
              happiness: number;
              divorceRisk: number;
            };
          };
        };
      };
    };
    invalidMarriageRisk.state.founder.personalLife.marriage = {
      spouseName: "test",
      marriageDate: 0,
      happiness: 5,
      divorceRisk: 2,
    };
    expect(() => deserializeGameState(JSON.stringify(invalidMarriageRisk))).toThrow(
      "Invalid snapshot: invalid percentage field: founder.personalLife.marriage.divorceRisk",
    );

    const invalidMarriageName = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { marriage: { spouseName: unknown } } } };
    };
    invalidMarriageName.state.founder.personalLife.marriage = {
      spouseName: "",
      marriageDate: 0,
      happiness: 5,
      divorceRisk: 0,
    } as never;
    expect(() => deserializeGameState(JSON.stringify(invalidMarriageName))).toThrow(
      "Invalid snapshot: invalid non-empty string field: founder.personalLife.marriage.spouseName",
    );

    const invalidHappiness = JSON.parse(serializeGameState(state)) as {
      state: { founder: { personalLife: { happiness: null } } };
    };
    invalidHappiness.state.founder.personalLife.happiness = null;
    expect(() => deserializeGameState(JSON.stringify(invalidHappiness))).toThrow(
      "Invalid snapshot: invalid score field: founder.personalLife.happiness",
    );
  });

  it("rejects snapshots with invalid event records", () => {
    const state = createInitialGameState({ seed: 9 });

    const invalidType = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<{ type: string }> };
    };
    invalidType.state.events[0].type = "bad";
    expect(() => deserializeGameState(JSON.stringify(invalidType))).toThrow(
      "Invalid snapshot: invalid event type: events[0].type",
    );

    const invalidCategory = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<{ category: string }> };
    };
    invalidCategory.state.events[0].category = "bad";
    expect(() => deserializeGameState(JSON.stringify(invalidCategory))).toThrow(
      "Invalid snapshot: invalid event category: events[0].category",
    );

    const invalidSeverity = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<{ severity: string }> };
    };
    invalidSeverity.state.events[0].severity = "bad";
    expect(() => deserializeGameState(JSON.stringify(invalidSeverity))).toThrow(
      "Invalid snapshot: invalid event severity: events[0].severity",
    );

    const negativeEventDay = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<{ day: number }> };
    };
    negativeEventDay.state.events[0].day = -1;
    expect(() => deserializeGameState(JSON.stringify(negativeEventDay))).toThrow(
      "Invalid snapshot: invalid non-negative integer field: events[0].day",
    );

    const mismatchedCategory = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<{ category: string }> };
    };
    mismatchedCategory.state.events[0].category = "operations";
    expect(() => deserializeGameState(JSON.stringify(mismatchedCategory))).toThrow(
      "Invalid snapshot: mismatched event category: events[0].category",
    );

    const mismatchedSeverity = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<{ severity: string }> };
    };
    mismatchedSeverity.state.events[0].severity = "critical";
    expect(() => deserializeGameState(JSON.stringify(mismatchedSeverity))).toThrow(
      "Invalid snapshot: mismatched event severity: events[0].severity",
    );
  });

  it("rejects snapshots with invalid event log entries", () => {
    const state = createInitialGameState({ seed: 9 });
    const snapshot = JSON.parse(serializeGameState(state)) as {
      state: { eventLog: Array<null> };
    };
    snapshot.state.eventLog[0] = null;

    expect(() => deserializeGameState(JSON.stringify(snapshot))).toThrow(
      "Invalid snapshot: invalid string field: eventLog[0]",
    );

    const emptyEntry = JSON.parse(serializeGameState(state)) as {
      state: { eventLog: Array<string> };
    };
    emptyEntry.state.eventLog[0] = " ";
    expect(() => deserializeGameState(JSON.stringify(emptyEntry))).toThrow(
      "Invalid snapshot: invalid non-empty string field: eventLog[0]",
    );
  });

  it("rejects snapshots with invalid event payload fields", () => {
    const state = createInitialGameState({ seed: 9 });

    const invalidInitialChoice = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidInitialChoice.state.events[0] = {
      type: "initial_choice",
      choiceId: " ",
      choiceLabel: "Network Founder",
      day: 0,
      category: "founder",
      severity: "info",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidInitialChoice))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].choiceId",
    );

    const negativePayroll = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    negativePayroll.state.events[0] = {
      type: "payroll_paid",
      amount: -1,
      day: 0,
      category: "operations",
      severity: "info",
    };
    expect(() => deserializeGameState(JSON.stringify(negativePayroll))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: events[0].amount",
    );

    const invalidRole = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidRole.state.events[0] = {
      type: "employee_hired",
      role: "bad",
      salary: 1,
      day: 0,
      category: "people",
      severity: "positive",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidRole))).toThrow(
      "Invalid snapshot: invalid company role: events[0].role",
    );

    const invalidInvestmentType = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidInvestmentType.state.events[0] = {
      type: "investment_made",
      investmentType: "bad",
      amount: 1,
      expectedReturn: 0.1,
      day: 0,
      category: "finance",
      severity: "positive",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidInvestmentType))).toThrow(
      "Invalid snapshot: invalid investment type: events[0].investmentType",
    );

    const invalidCurrentValue = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidCurrentValue.state.events[0] = {
      type: "investment_return",
      investmentId: "inv-1",
      returnAmount: 1,
      currentValue: null,
      day: 0,
      category: "finance",
      severity: "positive",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidCurrentValue))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: events[0].currentValue",
    );

    const invalidPolicyId = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidPolicyId.state.events[0] = {
      type: "insurance_claim_paid",
      policyId: "",
      payout: 1,
      damageAmount: 1,
      day: 0,
      category: "finance",
      severity: "warning",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidPolicyId))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].policyId",
    );

    const invalidInvestmentId = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidInvestmentId.state.events[0] = {
      type: "investment_return",
      investmentId: " ",
      returnAmount: 1,
      currentValue: 1,
      day: 0,
      category: "finance",
      severity: "positive",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidInvestmentId))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].investmentId",
    );

    const invalidGameOverReason = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidGameOverReason.state.events[0] = {
      type: "game_over",
      reason: "bad",
      day: 0,
      category: "founder",
      severity: "critical",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidGameOverReason))).toThrow(
      "Invalid snapshot: invalid game over reason: events[0].reason",
    );

    const invalidDelistingReasons = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidDelistingReasons.state.events[0] = {
      type: "delisting_warning",
      riskLevel: "high",
      reasons: "bad",
      day: 0,
      category: "market",
      severity: "critical",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidDelistingReasons))).toThrow(
      "Invalid snapshot: invalid string list field: events[0].reasons",
    );

    const emptyGovernanceReason = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    emptyGovernanceReason.state.events[0] = {
      type: "governance_penalty",
      reason: "",
      severityLevel: 0.5,
      penalty: 1,
      day: 0,
      category: "market",
      severity: "warning",
    };
    expect(() => deserializeGameState(JSON.stringify(emptyGovernanceReason))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].reason",
    );

    const emptyOptionalReason = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    emptyOptionalReason.state.events[0] = {
      type: "hiring_failed",
      role: "engineer",
      reason: " ",
      day: 0,
      category: "people",
      severity: "warning",
    };
    expect(() => deserializeGameState(JSON.stringify(emptyOptionalReason))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].reason",
    );

    const emptyDelistingReason = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    emptyDelistingReason.state.events[0] = {
      type: "delisting_warning",
      riskLevel: "high",
      reasons: [""],
      day: 0,
      category: "market",
      severity: "critical",
    };
    expect(() => deserializeGameState(JSON.stringify(emptyDelistingReason))).toThrow(
      "Invalid snapshot: invalid non-empty string list field: events[0].reasons",
    );

    const invalidCarBrand = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidCarBrand.state.events[0] = {
      type: "car_purchased",
      carId: "car-1",
      brand: " ",
      value: 1,
      day: 0,
      category: "founder",
      severity: "positive",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidCarBrand))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].brand",
    );

    const invalidChildName = JSON.parse(serializeGameState(state)) as {
      state: { events: Array<Record<string, unknown>> };
    };
    invalidChildName.state.events[0] = {
      type: "child_born",
      childId: "child-1",
      childName: "",
      day: 0,
      category: "founder",
      severity: "positive",
    };
    expect(() => deserializeGameState(JSON.stringify(invalidChildName))).toThrow(
      "Invalid snapshot: invalid non-empty string field: events[0].childName",
    );
  });

  it("rejects snapshots with invalid insurance policy fields", () => {
    const state = createInitialGameState({ seed: 9 });
    purchaseInsurance(state, { type: "legal" });

    const invalidPremium = JSON.parse(serializeGameState(state)) as {
      state: { company: { insurancePolicies: Array<{ premium: string }> } };
    };
    invalidPremium.state.company.insurancePolicies[0].premium = "bad";

    expect(() => deserializeGameState(JSON.stringify(invalidPremium))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: company.insurancePolicies[0].premium",
    );
  });

  it("rejects snapshots with invalid investment fields", () => {
    const state = createInitialGameState({ seed: 9 });
    makeInvestment(state, { type: "stocks", amount: 20_000 });

    const invalidType = JSON.parse(serializeGameState(state)) as {
      state: { company: { investments: Array<{ type: string }> } };
    };
    invalidType.state.company.investments[0].type = "bad";

    expect(() => deserializeGameState(JSON.stringify(invalidType))).toThrow(
      "Invalid snapshot: invalid investment type: company.investments[0].type",
    );

    const invalidValue = JSON.parse(serializeGameState(state)) as {
      state: { company: { investments: Array<{ currentValue: string }> } };
    };
    invalidValue.state.company.investments[0].currentValue = "bad";

    expect(() => deserializeGameState(JSON.stringify(invalidValue))).toThrow(
      "Invalid snapshot: invalid non-negative numeric field: company.investments[0].currentValue",
    );
  });
});
