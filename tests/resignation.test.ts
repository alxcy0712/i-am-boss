import { calculateResignationRisk } from "../src/sim/resignation";

describe("calculateResignationRisk", () => {
  it("increases when salary is below target and company culture exceeds stress tolerance", () => {
    const lowPressureRisk = calculateResignationRisk({
      salary: 16000,
      targetSalary: 15000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8
    });
    const highPressureRisk = calculateResignationRisk({
      salary: 10000,
      targetSalary: 15000,
      stressTolerance: 3,
      culturePressure: 8,
      morale: 4
    });

    expect(highPressureRisk).toBeGreaterThan(lowPressureRisk);
    expect(highPressureRisk).toBeGreaterThan(0.5);
  });
});
