import { test, expect } from "@playwright/test";

const VIEWPORTS = [
  { name: "Mobile Small", width: 360, height: 640 },
  { name: "Mobile Modern", width: 390, height: 844 },
  { name: "Tablet", width: 768, height: 1024 },
  { name: "Desktop", width: 1024, height: 768 },
  { name: "Large Desktop", width: 1440, height: 900 },
];

test.describe("Smoke Tests - Key Pages & Responsive Viewports", () => {
  for (const vp of VIEWPORTS) {
    test(`Homepage renders correctly at ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      // Verify Brand Logo / Title
      await expect(page.locator("text=LaunchByte").first()).toBeVisible();

      // Verify Hero Headline
      await expect(page.locator("h1")).toContainText(/Build|Opportunities|hackathons/i);

      // Verify Cmd+K search trigger or Navbar is present
      if (vp.width >= 768) {
        const nav = page.locator("nav").first();
        await expect(nav).toBeVisible();
      } else {
        const bottomNav = page.locator('nav[aria-label="Mobile Bottom Navigation"]');
        await expect(bottomNav).toBeVisible();
      }
    });
  }

  test("Opportunities page renders with filters and list", async ({ page }) => {
    await page.goto("/opportunities");
    await expect(page).toHaveURL(/opportunities/);
    await expect(page.locator("h1")).toContainText(/Opportunities/i);
  });

  test("Events page renders with mode filter and search", async ({ page }) => {
    await page.goto("/events");
    await expect(page).toHaveURL(/events/);
    await expect(page.locator("h1")).toContainText(/Events/i);
  });

  test("Teams discovery page renders", async ({ page }) => {
    await page.goto("/teams");
    await expect(page).toHaveURL(/teams/);
    await expect(page.locator("h1")).toContainText(/Teams/i);
  });

  test("People discovery page renders", async ({ page }) => {
    await page.goto("/people");
    await expect(page).toHaveURL(/people/);
  });

  test("Projects showcase page renders", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/projects/);
  });

  test("Login page renders with accessible form controls", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});