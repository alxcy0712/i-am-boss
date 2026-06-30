import { calculateResignationRisk } from "../src/sim/resignation";

describe("calculateResignationRisk", () => {
  it("increases when salary is below target and company culture exceeds stress tolerance", () => {
    const lowPressureRisk = calculateResignationRisk({
      salary: 16000,
      targetSalary: 15000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8,
    });
    const highPressureRisk = calculateResignationRisk({
      salary: 10000,
      targetSalary: 15000,
      stressTolerance: 3,
      culturePressure: 8,
      morale: 4,
    });

    expect(highPressureRisk).toBeGreaterThan(lowPressureRisk);
    expect(highPressureRisk).toBeGreaterThan(0.5);
  });

  it("returns a bounded risk for non-finite inputs", () => {
    const risk = calculateResignationRisk({
      salary: Number.NaN,
      targetSalary: 15000,
      stressTolerance: 3,
      culturePressure: 8,
      morale: 4,
    });

    expect(Number.isFinite(risk)).toBe(true);
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(0.95);
  });

  it("returns a bounded risk for non-finite personality", () => {
    const risk = calculateResignationRisk({
      salary: 10000,
      targetSalary: 15000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8,
      culture: "wolf",
      personality: Number.NaN,
    });

    expect(Number.isFinite(risk)).toBe(true);
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(0.95);
  });

  it("ignores invalid culture values when calculating culture mismatch", () => {
    const withoutCulture = calculateResignationRisk({
      salary: 10000,
      targetSalary: 15000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8,
      personality: 5,
    });
    const invalidCulture = calculateResignationRisk({
      salary: 10000,
      targetSalary: 15000,
      stressTolerance: 8,
      culturePressure: 3,
      morale: 8,
      culture: "invalid" as never,
      personality: 5,
    });

    expect(invalidCulture).toBe(withoutCulture);
  });
});
