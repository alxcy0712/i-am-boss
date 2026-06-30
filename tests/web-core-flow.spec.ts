import { expect, test } from "@playwright/test";

test("plays the startup, recruitment, and time-advance browser flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("[data-stage]")).toHaveAttribute("data-stage", "startup");
  await expect(page.locator("[data-choice-id]")).toHaveCount(3);
  await expect(page.locator("[data-language-id='zh-CN']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".subtitle")).toContainText("选择创始人画像");

  await page.locator("[data-language-id='en']").click();
  await expect(page.locator("[data-language-id='en']")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".subtitle")).toContainText("Choose a founder profile");

  await page.locator("[data-choice-id='network-founder']").click();
  await expect(page.locator("[data-stage]")).toHaveAttribute("data-stage", "operating");
  await expect(page.locator(".command-panel .recruitment-panel")).toHaveCount(0);
  await expect(page.locator(".command-panel .finance-panel")).toHaveCount(0);
  await expect(page.locator(".command-panel .event-feed")).toHaveCount(0);
  await expect(page.locator("[data-open-dialog-id='events']")).toBeVisible();

  await page.locator("[data-zone-id='labor-market']").click();
  await expect(page.locator(".workspace-dialog[data-dialog-id='recruitment']")).toContainText(
    "Recruitment Desk",
  );
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='company']").click();
  await expect(page.locator(".workspace-dialog[data-dialog-id='company']")).toContainText(
    "Staff Mix",
  );
  await expect(page.locator("[data-staff-role='engineer']")).toContainText("0");
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='culture']").click();
  await expect(page.locator(".workspace-dialog[data-dialog-id='culture']")).toContainText(
    "Culture Strategy",
  );
  await expect(page.locator("[data-culture='laissez-faire']")).toContainText("Resignation Risk");
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-zone-id='bank']").click();
  await expect(page.locator(".workspace-dialog[data-dialog-id='finance']")).toContainText(
    "Finance Desk",
  );
  await expect(page.locator(".market-board")).toContainText("Analyst estimate");
  await expect(page.locator(".market-board")).toContainText("1.00x");
  await expect(page.locator(".workspace-dialog[data-dialog-id='finance']")).toContainText(
    "Loan ¥80,000",
  );
  await expect(page.locator("[data-ipo-requirement]")).toHaveCount(4);
  await expect(page.locator("[data-ipo-requirement='annual-revenue']")).toContainText("¥90,000");
  await expect(page.locator("[data-ipo-requirement='annual-revenue']")).toContainText("¥1,000,000");
  await expect(page.locator("[data-ipo-requirement='operational-capability']")).toContainText(
    "Operational capability",
  );
  await expect(page.locator("[data-zone-id]")).toHaveCount(6);

  await page.locator("[data-loan-amount='80000']").click();
  await expect(page.locator(".stat-tile").filter({ hasText: "Cash" })).toContainText("¥210,000");
  await expect(page.locator(".workspace-dialog[data-dialog-id='finance']")).toContainText(
    "¥80,000",
  );
  await page.locator("[data-close-dialog]").click();
  await expect(page.locator(".command-panel .event-feed")).toHaveCount(0);
  await page.locator("[data-open-dialog-id='events']").click();
  await expect(
    page.locator(".event-feed [data-event-category='finance'][data-event-severity='positive']"),
  ).toContainText("FINANCE");
  await expect(
    page.locator(".event-feed [data-event-category='finance'][data-event-severity='positive']"),
  ).toContainText("Bank loan approved");
  await expect(page.locator("[data-event-filter='all']")).toContainText("ALL");
  await expect(page.locator("[data-event-filter='finance']")).toContainText("FINANCE");
  await page.locator("[data-event-filter='finance']").click();
  await expect(page.locator("[data-event-filter='finance']")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.locator(".event-feed [data-event-category='finance']")).toHaveCount(1);
  await expect(page.locator(".event-feed [data-event-category='founder']")).toHaveCount(0);
  await page.locator("[data-event-filter='all']").click();
  await expect(page.locator("[data-event-filter='all']")).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='culture']").click();
  await page.locator("[data-culture='laissez-faire']").click();
  await expect(page.locator("[data-culture='laissez-faire']")).toBeDisabled();
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-zone-id='labor-market']").click();
  await expect(page.locator("[data-candidate-hex]")).toBeVisible();
  const offerInput = page.locator("[data-offer-input]");
  const initialOffer = await offerInput.inputValue();
  await page.locator("[data-offer-id='next-candidate']").click();
  await expect(offerInput).not.toHaveValue(initialOffer);

  await offerInput.fill("50000");
  await page.locator("[data-offer-form] [data-action-id='recruit-candidate']").click();
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='company']").click();
  await expect(page.locator(".workspace-dialog[data-dialog-id='company']")).toContainText(
    "Monthly Payroll",
  );
  await expect(page.locator("[data-staff-role='engineer']")).toContainText("1");
  await expect(page.locator("[data-employee-id]").first()).toContainText(/risk/i);
  await expect(page.locator("[data-employee-id]").first()).toContainText("%");
  await expect(page.locator(".stat-tile").filter({ hasText: "Headcount" })).toContainText("2");

  await page.locator("[data-action-id='raise-employee-salary']").first().click();
  await expect(page.locator("[data-employee-id]").first()).toContainText("¥");

  await page.locator("[data-action-id='terminate-employee']").first().click();
  await expect(page.locator("[data-staff-role='engineer']")).toContainText("0");
  await expect(page.locator(".stat-tile").filter({ hasText: "Headcount" })).toContainText("1");
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='events']").click();
  await expect(page.locator(".event-feed")).toContainText("Hired engineer");
  await expect(page.locator(".event-feed")).toContainText("Terminated engineer");
  await expect(page.locator(".event-feed")).toContainText("severance ¥");
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-action-id='advance-30-days']").click();
  await expect(page.locator(".stat-tile").filter({ hasText: "Headcount" })).toContainText("1");
  await expect(page.locator(".stat-tile").filter({ hasText: "Valuation" })).toContainText("¥");
});

test("dispatches secondary browser actions instead of advancing time", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();

  await page.locator("[data-open-dialog-id='actions']").click();
  await expect(page.locator(".workspace-dialog[data-dialog-id='actions']")).toContainText(
    "Operations",
  );
  await page.locator("[data-action-id='purchase-insurance']").click();

  await page.locator("[data-action-id='file-insurance-claim']").click();

  await page.locator("[data-action-id='make-investment']").click();

  await page.locator("[data-action-id='sell-investment']").click();

  await page.locator("[data-action-id='buy-car']").click();

  await page.locator("[data-action-id='upgrade-car']").click();

  await page.locator("[data-action-id='get-married']").click();

  await page.locator("[data-action-id='have-child']").click();

  await page.locator("[data-action-id='toggle-ai-hiring']").click();
  await expect(page.locator("[data-action-id='run-ai-hiring-cycle']")).toBeEnabled();
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='events']").click();
  await expect(page.locator(".event-feed")).toContainText("Insurance purchased");
  await expect(page.locator(".event-feed")).toContainText("Investment made");
  await expect(page.locator(".event-feed")).toContainText("Child born");
});

test("dispatches the finance button loan amount from DOM data", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  await page.locator("[data-open-dialog-id='finance']").click();

  await page.locator("[data-action-id='request-bank-loan']").evaluate((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error("Expected bank loan button");
    }
    button.dataset.loanAmount = "1";
  });
  await page.locator("[data-action-id='request-bank-loan']").click();
  await page.locator("[data-close-dialog]").click();
  await page.locator("[data-open-dialog-id='events']").click();

  await expect(page.locator(".event-feed")).toContainText("Bank loan approved: 1");
});

test("ignores unknown browser action ids without advancing time", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  const statValuesBefore = await page.locator(".stat-tile strong").allTextContents();

  await page.evaluate(() => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.actionId = "unknown-action";
    button.textContent = "Unknown action";
    document.querySelector("#app")?.append(button);
  });
  await page.locator("[data-action-id='unknown-action']").click();

  await expect(page.locator("[data-stage]")).toHaveAttribute("data-stage", "operating");
  await expect(page.locator(".stat-tile strong")).toHaveText(statValuesBefore);
});

test("ignores unknown startup choice ids without throwing", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/");
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.choiceId = "unknown-founder";
    button.textContent = "Unknown founder";
    document.querySelector(".startup")?.append(button);
  });
  await page.locator("[data-choice-id='unknown-founder']").click();

  await expect(page.locator("[data-stage]")).toHaveAttribute("data-stage", "startup");
  expect(pageErrors).toEqual([]);
});

test("ignores startup action ids without throwing before a founder is selected", async ({
  page,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  await page.goto("/");
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.actionId = "unknown-action";
    button.textContent = "Unknown action";
    document.querySelector(".startup")?.append(button);
  });
  await page.locator("[data-action-id='unknown-action']").click();

  await expect(page.locator("[data-stage]")).toHaveAttribute("data-stage", "startup");
  expect(pageErrors).toEqual([]);
});

test("fits the operating screen in a landscape viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();

  const metrics = await page.evaluate(() => ({
    htmlScrollHeight: document.documentElement.scrollHeight,
    bodyScrollHeight: document.body.scrollHeight,
    viewportHeight: window.innerHeight,
    rootFontSize: Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
  }));

  expect(metrics.htmlScrollHeight).toBeLessThanOrEqual(metrics.viewportHeight + 2);
  expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.viewportHeight + 2);
  expect(metrics.rootFontSize).toBeGreaterThanOrEqual(12);
});

test("fits the recruitment desk without internal vertical scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  await page.locator("[data-zone-id='labor-market']").click();

  const metrics = await page
    .locator(".workspace-dialog[data-dialog-id='recruitment']")
    .evaluate((dialog) => {
      const body = dialog.querySelector(".dialog-body");
      if (!(body instanceof HTMLElement)) {
        throw new Error("Expected recruitment dialog body");
      }

      const dialogRect = dialog.getBoundingClientRect();
      const bodyStyle = getComputedStyle(body);

      return {
        dialogTop: dialogRect.top,
        dialogBottom: dialogRect.bottom,
        viewportHeight: window.innerHeight,
        bodyClientHeight: body.clientHeight,
        bodyScrollHeight: body.scrollHeight,
        bodyOverflowY: bodyStyle.overflowY,
      };
    });

  expect(metrics.dialogTop).toBeGreaterThanOrEqual(0);
  expect(metrics.dialogBottom).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.bodyScrollHeight).toBeLessThanOrEqual(metrics.bodyClientHeight + 2);
  expect(metrics.bodyOverflowY).toBe("visible");
});

test("renders the candidate hex chart at a legible size", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  await page.locator("[data-zone-id='labor-market']").click();

  const metrics = await page.locator("[data-candidate-hex]").evaluate((card) => {
    const chart = card.querySelector(".candidate-hex-chart");
    const svgLabel = card.querySelector(".hex-label");
    const axisList = card.querySelector(".hex-axis-list");
    if (
      !(chart instanceof SVGElement) ||
      !(svgLabel instanceof SVGTextElement) ||
      !(axisList instanceof HTMLElement)
    ) {
      throw new Error("Expected candidate hex chart elements");
    }

    const chartRect = chart.getBoundingClientRect();

    return {
      chartWidth: chartRect.width,
      chartHeight: chartRect.height,
      svgLabelFontSize: Number.parseFloat(getComputedStyle(svgLabel).fontSize),
      axisListFontSize: Number.parseFloat(getComputedStyle(axisList).fontSize),
    };
  });

  expect(metrics.chartWidth).toBeGreaterThanOrEqual(260);
  expect(metrics.chartHeight).toBeGreaterThanOrEqual(220);
  expect(metrics.svgLabelFontSize).toBeGreaterThanOrEqual(5);
  expect(metrics.axisListFontSize).toBeGreaterThanOrEqual(9);
});

test("disables custom recruitment offers until the salary is valid", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  await page.locator("[data-open-dialog-id='recruitment']").click();

  const offerInput = page.locator("[data-offer-input]");
  const submitOffer = page.locator("[data-offer-form] [data-action-id='recruit-candidate']");

  await offerInput.fill("");
  await expect(submitOffer).toBeDisabled();

  await offerInput.fill("-1");
  await expect(submitOffer).toBeDisabled();

  await offerInput.fill("0");
  await expect(submitOffer).toBeDisabled();

  await offerInput.fill("100");
  await expect(submitOffer).toBeDisabled();

  await offerInput.fill((await offerInput.getAttribute("min")) ?? "10000");
  await expect(submitOffer).toBeEnabled();
});

test("disables recruitment after hiring the final available candidate", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  await page.locator("[data-open-dialog-id='recruitment']").click();

  const nextCandidate = page.locator("[data-offer-id='next-candidate']");
  for (let index = 0; index < 10; index += 1) {
    await nextCandidate.click();
  }

  await expect(nextCandidate).toBeDisabled();
  await expect(nextCandidate).toContainText("0/10");

  const offerInput = page.locator("[data-offer-input]");
  const submitOffer = page.locator("[data-offer-form] [data-action-id='recruit-candidate']");
  await offerInput.fill("200000");
  await expect(submitOffer).toBeEnabled();
  await submitOffer.click();

  await expect(submitOffer).toBeDisabled();
  await page.locator("[data-close-dialog]").click();
  await expect(page.locator("[data-zone-id='labor-market']")).toBeDisabled();
});

test("opens every operating panel from the control center and city map", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();

  const consoleDialogs = [
    { opener: "[data-open-dialog-id='company']", dialog: "company", text: "Staff Mix" },
    { opener: "[data-open-dialog-id='culture']", dialog: "culture", text: "Culture Strategy" },
    {
      opener: "[data-open-dialog-id='recruitment']",
      dialog: "recruitment",
      text: "Recruitment Desk",
    },
    { opener: "[data-open-dialog-id='finance']", dialog: "finance", text: "Finance Desk" },
    { opener: "[data-open-dialog-id='actions']", dialog: "actions", text: "Operations" },
    { opener: "[data-open-dialog-id='events']", dialog: "events", text: "Initial choice" },
  ];

  for (const item of consoleDialogs) {
    await page.locator(item.opener).click();
    await expect(page.locator(`.workspace-dialog[data-dialog-id='${item.dialog}']`)).toContainText(
      item.text,
    );
    await page.locator("[data-close-dialog]").click();
  }

  const zoneDialogs = [
    { zone: "company", dialog: "company", text: "Founder Abilities" },
    { zone: "bank", dialog: "finance", text: "Loan ¥80,000" },
    { zone: "exchange", dialog: "finance", text: "IPO Requirements" },
    { zone: "labor-market", dialog: "recruitment", text: "Ability hex" },
    { zone: "court", dialog: "actions", text: "Operations" },
    { zone: "policy-office", dialog: "culture", text: "Culture Strategy" },
  ];

  for (const item of zoneDialogs) {
    await page.locator(`[data-zone-id='${item.zone}']`).click();
    await expect(page.locator(`.workspace-dialog[data-dialog-id='${item.dialog}']`)).toContainText(
      item.text,
    );
    await page.locator("[data-close-dialog]").click();
  }
});

test("keeps secondary action buttons disabled until their prerequisites are met", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  await page.locator("[data-open-dialog-id='actions']").click();

  await expect(page.locator("[data-action-id='file-insurance-claim']")).toBeDisabled();
  await expect(page.locator("[data-action-id='sell-investment']")).toBeDisabled();
  await expect(page.locator("[data-action-id='upgrade-car']")).toBeDisabled();
  await expect(page.locator("[data-action-id='have-child']")).toBeDisabled();
  await expect(page.locator("[data-action-id='run-ai-hiring-cycle']")).toBeDisabled();

  await page.locator("[data-action-id='purchase-insurance']").click();
  await expect(page.locator("[data-action-id='file-insurance-claim']")).toBeEnabled();
  await page.locator("[data-action-id='file-insurance-claim']").click();
  await expect(page.locator("[data-action-id='file-insurance-claim']")).toBeEnabled();

  await page.locator("[data-action-id='make-investment']").click();
  await expect(page.locator("[data-action-id='sell-investment']")).toBeEnabled();
  await page.locator("[data-action-id='sell-investment']").click();
  await expect(page.locator("[data-action-id='sell-investment']")).toBeDisabled();

  await page.locator("[data-action-id='buy-car']").click();
  await expect(page.locator("[data-action-id='upgrade-car']")).toBeEnabled();

  await page.locator("[data-action-id='get-married']").click();
  await expect(page.locator("[data-action-id='get-married']")).toBeDisabled();
  await expect(page.locator("[data-action-id='have-child']")).toBeEnabled();

  await page.locator("[data-action-id='toggle-ai-hiring']").click();
  await expect(page.locator("[data-action-id='run-ai-hiring-cycle']")).toBeEnabled();
});

test("fits the operating screen in a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();

  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
    visibleButtonCount: Array.from(document.querySelectorAll("button")).filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }).length,
    emptyVisibleButtonCount: Array.from(document.querySelectorAll("button")).filter((button) => {
      const rect = button.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && button.textContent?.trim() === "";
    }).length,
  }));

  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(metrics.visibleButtonCount).toBeGreaterThan(0);
  expect(metrics.emptyVisibleButtonCount).toBe(0);
});

test("reaches game over, records the score, and returns from leaderboard", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='technical-founder']").click();

  for (let index = 0; index < 18; index += 1) {
    await page.locator("[data-action-id='advance-30-days']").click();
    if ((await page.locator("[data-stage='game-over']").count()) > 0) {
      break;
    }
  }

  await expect(page.locator("[data-stage='game-over']")).toBeVisible();
  await expect(page.locator(".game-over")).toContainText("GAME OVER");
  await expect(page.locator(".game-over-reason")).toContainText("Bankruptcy");
  await expect(page.locator(".game-over-score-value")).toContainText(/\d/);
  await expect(page.locator(".game-over-breakdown-row")).toHaveCount(3);

  await page.locator("[data-action-id='view-leaderboard']").click();
  await expect(page.locator("[data-stage='leaderboard']")).toBeVisible();
  await expect(page.locator(".leaderboard")).toContainText("LEADERBOARD");
  await expect(page.locator(".leaderboard-table tbody tr.is-current-game")).toHaveCount(1);

  await page.locator("[data-action-id='back-to-game-over']").click();
  await expect(page.locator("[data-stage='game-over']")).toBeVisible();
});

test("leaderboard UI restores valid localStorage entries and ignores corrupt entries", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem(
      "i-am-boss-leaderboard",
      JSON.stringify([
        {
          id: "valid-history",
          score: 500000,
          daysPlayed: 300,
          companyValuation: 200000,
          playerWealth: 99700,
          gameOverReason: "retirement",
          date: "2026-01-01T00:00:00.000Z",
          rank: 0,
        },
        {
          id: "html-history",
          score: 400000,
          daysPlayed: 250,
          companyValuation: 180000,
          playerWealth: 90000,
          gameOverReason: '<img src=x alt="bad-history">',
          date: "2026-01-03T00:00:00.000Z",
          rank: 0,
        },
        {
          id: "negative-history",
          score: -1,
          daysPlayed: -10,
          companyValuation: -1000,
          playerWealth: -500,
          gameOverReason: "bankruptcy",
          date: "2026-01-02T00:00:00.000Z",
          rank: 0,
        },
        {
          id: "bad-history",
          score: 100,
          daysPlayed: 10,
          companyValuation: "oops",
        },
      ]),
    );
  });
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='technical-founder']").click();

  for (let index = 0; index < 18; index += 1) {
    await page.locator("[data-action-id='advance-30-days']").click();
    if ((await page.locator("[data-stage='game-over']").count()) > 0) {
      break;
    }
  }

  await page.locator("[data-action-id='view-leaderboard']").click();
  await expect(page.locator("[data-stage='leaderboard']")).toBeVisible();
  await expect(page.locator(".leaderboard-table")).toContainText("500,000");
  await expect(page.locator(".leaderboard-table")).toContainText("Retirement");
  await expect(page.locator(".leaderboard-table img")).toHaveCount(0);
  await expect(page.locator(".leaderboard-table")).not.toContainText("-1");
  await expect(page.locator(".leaderboard-table")).not.toContainText("oops");
  await expect(page.locator(".leaderboard-table tbody tr.is-current-game")).toHaveCount(1);
});

test("captures ephemeral Playwright self-test screenshots for desktop and mobile QA", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const startupDesktop = await page.screenshot({ fullPage: true });

  await expect(page.locator("[data-choice-id]")).toHaveCount(3);
  await expect(page.locator("[data-language-id='zh-CN']")).toHaveAttribute("aria-pressed", "true");

  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();
  const operatingDesktop = await page.screenshot({ fullPage: true });

  await page.locator("[data-open-dialog-id='finance']").click();
  await page.locator("[data-loan-amount='80000']").click();
  await page.locator("[data-close-dialog]").click();

  await page.locator("[data-open-dialog-id='events']").click();
  await page.locator("[data-event-filter='finance']").click();
  await expect(page.locator(".event-feed [data-event-category='finance']")).toHaveCount(1);
  await expect(page.locator(".event-feed [data-event-category='founder']")).toHaveCount(0);
  const eventsFinanceFilter = await page.screenshot({ fullPage: true });
  await page.locator("[data-close-dialog]").click();

  await page.setViewportSize({ width: 390, height: 844 });
  const operatingMobile = await page.screenshot({ fullPage: true });

  const metrics = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
  }));
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewportWidth + 2);
  expect(startupDesktop.length).toBeGreaterThan(0);
  expect(operatingDesktop.length).toBeGreaterThan(0);
  expect(eventsFinanceFilter.length).toBeGreaterThan(0);
  expect(operatingMobile.length).toBeGreaterThan(0);
});
