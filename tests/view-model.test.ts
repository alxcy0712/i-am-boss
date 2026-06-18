import { createGameViewModel } from "../src/ui/view-model";
import { runHarness } from "../src/harness/sim-harness";

describe("createGameViewModel", () => {
  it("maps harness output into browser HUD and city map data", () => {
    const summary = runHarness({
      seed: 1,
      days: 120,
      initialChoiceId: "network-founder",
    });
    const viewModel = createGameViewModel(summary);

    expect(viewModel.title).toBe("我是老板 / I am boss");
    expect(viewModel.hud.cash.label).toBe("Cash");
    expect(viewModel.hud.cash.value).toMatch(/^¥/);
    expect(viewModel.hud.score.value).toMatch(/^\d/);
    expect(viewModel.hud.culture.label).toBe("Culture");
    expect(viewModel.hud.morale.value).toMatch(/\/10$/);
    expect(viewModel.hud.reputation.value).toMatch(/\/10$/);
    expect(viewModel.hud.pressure.value).toMatch(/\/10$/);
    expect(viewModel.mapLocations.map((location) => location.id)).toEqual([
      "company",
      "bank",
      "exchange",
      "labor-market",
      "court",
      "policy-office",
    ]);
    expect(viewModel.eventFeed.length).toBeLessThanOrEqual(8);
    expect(viewModel.events.length).toBeLessThanOrEqual(8);
    expect(viewModel.events.every((event) => event.category)).toBe(true);
    expect(viewModel.events.every((event) => event.severity)).toBe(true);
  });
});
