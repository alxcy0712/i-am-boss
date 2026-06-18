import {
  createGameSession,
  getSessionActions,
  performSessionAction,
  previewRecruitmentCandidate,
  selectInitialChoice,
} from "../src/game/session";
import { hireEmployee } from "../src/sim/employee-lifecycle";
import type { Candidate } from "../src/sim/hiring";
import { makeInvestment } from "../src/sim/investment";
import { calculateResignationRisk } from "../src/sim/resignation";

describe("session actions", () => {
  it("lists city-map actions after an initial choice is selected", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");

    expect(getSessionActions(session).map((action) => action.id)).toEqual([
      "advance-30-days",
      "recruit-candidate",
      "request-bank-loan",
      "request-policy-support",
      "prepare-ipo",
      "change-culture",
      "toggle-ai-hiring",
      "run-ai-hiring-cycle",
      "purchase-insurance",
      "file-insurance-claim",
      "make-investment",
      "sell-investment",
      "buy-car",
      "upgrade-car",
      "get-married",
      "have-child",
    ]);
  });

  it("advances time through a city-map action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const result = performSessionAction(session, { id: "advance-30-days" });

    expect(result.session.summary?.daysPlayed).toBe(30);
    expect(result.message).toContain("Advanced");
  });

  it("requests bank financing through a city-map action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const before = session.summary?.cash ?? 0;
    const result = performSessionAction(session, {
      id: "request-bank-loan",
      amount: 80_000,
    });

    expect(result.session.summary?.cash).toBeGreaterThan(before);
    expect(result.session.summary?.debt).toBe(80_000);
  });

  it("requests policy support through a city-map action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const result = performSessionAction(session, { id: "request-policy-support" });

    expect(result.session.summary?.policySupportCount).toBe(1);
    expect(result.message).toContain("Policy");
  });

  it("attempts labor-market recruitment through a city-map action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const result = performSessionAction(session, { id: "recruit-candidate" });

    expect(result.message).toMatch(/Hired|Recruitment failed/);
    expect(result.session.summary?.eventLog.at(-1)).toMatch(/Hired|Hiring failed/);
  });

  it("previews a candidate, rejects low offers, and advances to the next candidate", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const preview = previewRecruitmentCandidate(session);

    const lowOffer = performSessionAction(session, {
      id: "recruit-candidate",
      salary: preview.minimumSalary - 1,
    });
    expect(lowOffer.message).toContain("below minimum");
    expect(lowOffer.session.summary?.headcount).toBe(session.summary?.headcount);
    expect(lowOffer.session.candidateCursor).toBe(session.candidateCursor);

    const skipped = performSessionAction(session, { id: "skip-candidate" } as never);
    const nextPreview = previewRecruitmentCandidate(skipped.session);

    expect(skipped.message).toContain("Skipped candidate");
    expect(skipped.session.candidateCursor).toBe((session.candidateCursor ?? 0) + 1);
    expect(nextPreview.seed).not.toBe(preview.seed);
  });

  it("changes company culture through a city-map action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const result = performSessionAction(session, {
      id: "change-culture",
      culture: "wolf",
    });

    expect(result.session.state?.company.culture).toBe("wolf");
    expect(result.session.state?.company.culturePressure).toBe(9);
    expect(result.session.summary?.eventLog.at(-1)).toBe("Culture changed: wolf");
    expect(result.message).toBe("Culture changed: wolf");
  });

  it("terminates an employee through a session action and pays severance", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    if (!session.state) {
      throw new Error("Expected selected session to have state");
    }

    const employee = hireEmployee(session.state, {
      candidate: createCandidate("engineer"),
      salary: 12_000,
      equityPercent: 0.2,
    });
    const cashBefore = session.state.company.cash;
    const monthlyBurnBefore = session.state.company.monthlyBurn;

    const result = performSessionAction(session, {
      id: "terminate-employee",
      employeeId: employee.id,
    });

    expect(result.message).toBe("Terminated engineer with ¥12,000 severance");
    expect(result.session.summary?.employeeCount).toBe(0);
    expect(result.session.summary?.headcount).toBe(1);
    expect(result.session.summary?.cash).toBe(cashBefore - 12_000);
    expect(result.session.state?.company.monthlyBurn).toBe(monthlyBurnBefore - 12_000);
    expect(result.session.summary?.eventLog.at(-1)).toBe(
      "Employee terminated: engineer, severance ¥12,000",
    );
  });

  it("raises an employee salary and lowers resignation risk", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    if (!session.state) {
      throw new Error("Expected selected session to have state");
    }

    const employee = hireEmployee(session.state, {
      candidate: createCandidate("engineer"),
      salary: 9_000,
      equityPercent: 0.2,
    });
    const riskBefore = calculateResignationRisk({
      salary: employee.salary,
      targetSalary: employee.targetSalary,
      stressTolerance: employee.stressTolerance,
      culturePressure: session.state.company.culturePressure,
      morale: session.state.company.morale,
      culture: session.state.company.culture,
      personality: employee.personality,
    });
    const monthlyBurnBefore = session.state.company.monthlyBurn;

    const result = performSessionAction(session, {
      id: "raise-employee-salary",
      employeeId: employee.id,
    });
    const updatedEmployee = result.session.state?.company.employees[0];
    const riskAfter = result.session.summary?.employees[0].resignationRisk ?? 1;

    expect(result.message).toBe("Raised engineer salary to ¥9,900");
    expect(updatedEmployee?.salary).toBe(9_900);
    expect(result.session.state?.company.monthlyBurn).toBe(monthlyBurnBefore + 900);
    expect(result.session.summary?.totalMonthlyPayroll).toBe(9_900);
    expect(riskAfter).toBeLessThan(riskBefore);
    expect(result.session.summary?.eventLog.at(-1)).toBe(
      "Salary adjusted: engineer, salary ¥9,000 -> ¥9,900",
    );
  });

  it("makes an investment through a session action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    const cashBefore = session.summary?.cash ?? 0;

    const result = performSessionAction(session, {
      id: "make-investment",
      investmentType: "stocks",
      amount: 20_000,
    });

    expect(result.message).toContain("Invested");
    expect(result.message).toContain("stocks");
    expect(result.session.state?.company.investments).toHaveLength(1);
    expect(result.session.summary?.investmentCount).toBe(1);
    expect(result.session.summary?.cash).toBeLessThan(cashBefore);
  });

  it("sells an investment through a session action", () => {
    const session = selectInitialChoice(createGameSession({ seed: 21 }), "network-founder");
    if (!session.state) {
      throw new Error("Expected selected session to have state");
    }

    const investResult = makeInvestment(session.state, { type: "bonds", amount: 20_000 });
    const investmentId = investResult.investment!.id;

    const result = performSessionAction(session, {
      id: "sell-investment",
      investmentId,
    });

    expect(result.message).toContain("Sold investment");
    expect(result.session.state?.company.investments).toHaveLength(0);
    expect(result.session.summary?.investmentCount).toBe(0);
  });
});

function createCandidate(role: Candidate["role"]): Candidate {
  return {
    role,
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
    personality: 5,
  };
}
