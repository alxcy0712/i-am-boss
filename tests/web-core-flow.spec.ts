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
  await expect(page.locator(".recruitment-panel")).toContainText("Recruitment Desk");
  await expect(page.locator(".staff-panel")).toContainText("Staff Mix");
  await expect(page.locator("[data-staff-role='engineer']")).toContainText("0");
  await expect(page.locator(".culture-panel")).toContainText("Culture Strategy");
  await expect(page.locator("[data-culture='laissez-faire']")).toContainText("Resignation Risk");
  await expect(page.locator(".finance-panel")).toContainText("Finance Desk");
  await expect(page.locator(".market-board")).toContainText("Analyst estimate");
  await expect(page.locator(".market-board")).toContainText("1.00x");
  await expect(page.locator(".finance-panel")).toContainText("Loan ¥80,000");
  await expect(page.locator("[data-ipo-requirement]")).toHaveCount(4);
  await expect(page.locator("[data-ipo-requirement='annual-revenue']")).toContainText("¥90,000");
  await expect(page.locator("[data-ipo-requirement='annual-revenue']")).toContainText("¥1,000,000");
  await expect(page.locator("[data-ipo-requirement='operational-capability']")).toContainText(
    "Operational capability",
  );
  await expect(page.locator("[data-zone-id]")).toHaveCount(6);

  await page.locator("[data-loan-amount='80000']").click();
  await expect(page.locator(".stat-tile").filter({ hasText: "Cash" })).toContainText("¥210,000");
  await expect(page.locator(".finance-panel")).toContainText("¥80,000");
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

  await page.locator("[data-culture='laissez-faire']").click();
  await expect(page.locator(".event-feed")).toContainText("Culture changed");
  await expect(page.locator("[data-culture='laissez-faire']")).toBeDisabled();

  const initialTargetOffer = await page.locator("[data-offer-id='offer-target']").textContent();
  await page.locator("[data-offer-id='next-candidate']").click();
  await expect(page.locator(".event-feed")).toContainText("Candidate skipped");
  await expect(
    page.locator(".event-feed [data-event-category='people'][data-event-severity='info']"),
  ).toContainText("PEOPLE");
  await expect(page.locator("[data-offer-id='offer-target']")).not.toHaveText(
    initialTargetOffer ?? "",
  );

  await page.locator("[data-offer-id='offer-target']").click();
  await expect(page.locator(".event-feed")).toContainText("Hired engineer");
  await expect(page.locator(".staff-panel")).toContainText("Monthly Payroll");
  await expect(page.locator("[data-staff-role='engineer']")).toContainText("1");
  await expect(page.locator("[data-employee-id]").first()).toContainText(/risk/i);
  await expect(page.locator("[data-employee-id]").first()).toContainText("%");
  await expect(page.locator(".stat-tile").filter({ hasText: "Headcount" })).toContainText("2");

  await page.locator("[data-action-id='raise-employee-salary']").first().click();
  await expect(page.locator(".event-feed")).toContainText("Raised engineer salary");
  await expect(page.locator("[data-employee-id]").first()).toContainText("¥");

  await page.locator("[data-action-id='terminate-employee']").first().click();
  await expect(page.locator(".event-feed")).toContainText("Terminated engineer");
  await expect(page.locator(".event-feed")).toContainText("severance ¥");
  await expect(page.locator("[data-staff-role='engineer']")).toContainText("0");
  await expect(page.locator(".stat-tile").filter({ hasText: "Headcount" })).toContainText("1");

  await page.locator("[data-action-id='advance-30-days']").click();
  await expect(page.locator(".stat-tile").filter({ hasText: "Headcount" })).toContainText("1");
  await expect(page.locator(".stat-tile").filter({ hasText: "Valuation" })).toContainText("¥");
});

test("dispatches secondary browser actions instead of advancing time", async ({ page }) => {
  await page.goto("/");
  await page.locator("[data-language-id='en']").click();
  await page.locator("[data-choice-id='network-founder']").click();

  await page.locator("[data-action-id='purchase-insurance']").click();
  await expect(page.locator(".event-feed")).toContainText("Insurance purchased");

  await page.locator("[data-action-id='file-insurance-claim']").click();
  await expect(page.locator(".event-feed")).toContainText("Insurance claim paid");

  await page.locator("[data-action-id='make-investment']").click();
  await expect(page.locator(".event-feed")).toContainText("Investment made");

  await page.locator("[data-action-id='sell-investment']").click();
  await expect(page.locator(".event-feed")).toContainText("Investment sold");

  await page.locator("[data-action-id='buy-car']").click();
  await expect(page.locator(".event-feed")).toContainText("Purchased car");

  await page.locator("[data-action-id='upgrade-car']").click();
  await expect(page.locator(".event-feed")).toContainText("Upgraded car");

  await page.locator("[data-action-id='get-married']").click();
  await expect(page.locator(".event-feed")).toContainText("Married");

  await page.locator("[data-action-id='have-child']").click();
  await expect(page.locator(".event-feed")).toContainText("Child born");

  await page.locator("[data-action-id='toggle-ai-hiring']").click();
  await expect(page.locator("[data-action-id='run-ai-hiring-cycle']")).toBeEnabled();
});
