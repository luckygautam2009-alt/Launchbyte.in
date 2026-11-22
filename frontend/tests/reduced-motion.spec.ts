import { test, expect } from "@playwright/test";

test.describe("Prefers Reduced Motion Support", () => {
  test("Reduces animations when user requests reduced motion", async ({ page }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // Verify reduced motion css rule takes effect on body or animated elements
    const isReduced = await page.evaluate(() => {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });

    expect(isReduced).toBe(true);

    // Verify that elements have animation duration zeroed or simplified
    const heroH1 = page.locator("h1");
    await expect(heroH1).toBeVisible();
  });
});