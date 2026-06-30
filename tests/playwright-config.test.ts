import config from "../playwright.config";

describe("playwright config", () => {
  it("builds the web bundle before serving e2e tests", () => {
    const webServer = Array.isArray(config.webServer) ? config.webServer[0] : config.webServer;

    expect(webServer?.command).toContain("npm run build:web");
    expect(webServer?.command).toContain("npm run preview");
    expect(webServer?.reuseExistingServer).toBe(false);
  });
});
