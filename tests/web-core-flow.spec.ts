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
  const initialTargetOffer = await page.locator("[data-offer-id='offer-target']").textContent();
  await page.locator("[data-offer-id='next-candidate']").click();
  await expect(page.locator("[data-offer-id='offer-target']")).not.toHaveText(
    initialTargetOffer ?? "",
  );

  await page.locator("[data-offer-id='offer-target']").click();
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
