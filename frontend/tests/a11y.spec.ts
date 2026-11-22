import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility (A11y) Checks", () => {
  test("Homepage passes critical WCAG 2.1 AA rules", async ({ page }) => {
    await page.goto("/");
    // Wait for initial render
    await page.waitForLoadState("domcontentloaded");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // dark theme custom gradients can produce false positives in headless Chrome
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Opportunities page has no structural accessibility violations", async ({ page }) => {
    await page.goto("/opportunities");
    await page.waitForLoadState("domcontentloaded");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Events page has accessible headings and landmarks", async ({ page }) => {
    await page.goto("/events");
    await page.waitForLoadState("domcontentloaded");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});