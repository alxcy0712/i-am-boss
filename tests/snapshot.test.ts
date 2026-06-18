import { deserializeGameState, serializeGameState } from "../src/harness/snapshot";
import { hireEmployee } from "../src/sim/employee-lifecycle";
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
});
