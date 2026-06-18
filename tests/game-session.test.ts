import {
  advanceSession,
  createGameSession,
  createSessionViewModel,
  selectInitialChoice,
} from "../src/game/session";

describe("game session", () => {
  it("starts with three selectable founder choices", () => {
    const session = createGameSession({ seed: 12 });

    expect(session.initialChoices.map((choice) => choice.id)).toEqual([
      "technical-founder",
      "network-founder",
      "resilient-founder",
    ]);
    expect(session.selectedInitialChoiceId).toBeUndefined();
  });

  it("locks the selected initial choice and creates the first summary", () => {
    const session = selectInitialChoice(createGameSession({ seed: 12 }), "network-founder");

    expect(session.selectedInitialChoiceId).toBe("network-founder");
    expect(session.summary?.daysPlayed).toBe(0);
    expect(session.summary?.cash).toBeGreaterThan(100000);
  });

  it("advances deterministic time after the initial choice is selected", () => {
    const session = selectInitialChoice(createGameSession({ seed: 12 }), "network-founder");
    const advanced = advanceSession(session, 120);

    expect(advanced.summary?.daysPlayed).toBe(120);
    expect(advanced.summary?.eventLog.length).toBeGreaterThan(1);
  });

  it("creates a UI view model from the active session summary", () => {
    const session = advanceSession(
      selectInitialChoice(createGameSession({ seed: 12 }), "network-founder"),
      120,
    );
    const viewModel = createSessionViewModel(session);

    expect(viewModel.title).toBe("我是老板 / I am boss");
    expect(viewModel.mapLocations.find((item) => item.id === "labor-market")?.enabled).toBe(true);
  });
});
