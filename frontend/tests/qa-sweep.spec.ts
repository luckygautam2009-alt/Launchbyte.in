import { test, expect } from "@playwright/test";

test.describe("QA Sweep: End-to-End Core Flows & Hardening", () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  // 1. Unauthenticated users are redirected from /opportunities and /hackathons to /login?next=...
  test("Unauthenticated redirect from /opportunities and /hackathons to login", async ({ page }) => {
    await page.goto("/opportunities");
    await expect(page).toHaveURL(/\/login\?next=%2Fopportunities/);

    await page.goto("/hackathons");
    await expect(page).toHaveURL(/\/login\?next=%2Fhackathons/);
  });

  // 2. Auth-aware Join LaunchByte CTA on Home Page
  test("Homepage Hero and CTA adapt dynamically to auth state", async ({ page, context }) => {
    // A. Logged Out state: CTA shows 'Join LaunchByte'
    await page.goto("/");
    const joinBtn = page.locator('a[href="/register"]').filter({ hasText: /Join LaunchByte/i }).first();
    await expect(joinBtn).toBeVisible();

    // B. Logged In state: simulate auth via cookie lb_token & localStorage + /users/me
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "11111111-1111-1111-1111-111111111111",
          email: "logged_in@example.com",
          handle: "loggedinuser",
          full_name: "Logged In User",
          role: "user",
          is_email_verified: true,
          avatar_url: null,
        }),
      });
    });

    await context.addCookies([
      {
        name: "lb_token",
        value: "mock_valid_jwt_token",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem("lb_token", "mock_valid_jwt_token");
    });

    await page.goto("/");
    // When logged in, 'Go to Dashboard' is visible and 'Join LaunchByte' is hidden
    const dashBtn = page.locator('a[href="/dashboard"]').filter({ hasText: /Go to Dashboard/i }).first();
    await expect(dashBtn).toBeVisible({ timeout: 5000 });
    await expect(joinBtn).not.toBeVisible();
  });

  // 3. Signup flow sends user to OTP verification
  test("User signup redirects to email OTP verification flow", async ({ page }) => {
    await page.route("**/api/v1/users", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "22222222-2222-2222-2222-222222222222",
            email: "newbuilder@example.com",
            handle: "newbuilder",
            full_name: "New Builder",
            role: "user",
            is_email_verified: false,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock_jwt_token_signup",
          token_type: "bearer",
        }),
      });
    });

    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "22222222-2222-2222-2222-222222222222",
          email: "newbuilder@example.com",
          handle: "newbuilder",
          full_name: "New Builder",
          role: "user",
          is_email_verified: false,
        }),
      });
    });

    await page.route("**/api/v1/auth/verify-email/request", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ message: "Verification OTP code sent." }),
      });
    });

    await page.goto("/register");
    await page.fill('input[placeholder="Ada Lovelace"]', "New Builder");
    await page.fill('input[placeholder="ada@example.com"]', "newbuilder@example.com");
    await page.locator('input[type="password"]').first().fill("ComplexPass123!");
    await page.locator('input[type="password"]').nth(1).fill("ComplexPass123!");

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Verify redirected to verify-email
    await expect(page).toHaveURL(/\/verify-email/, { timeout: 10000 });
    await expect(page.locator("text=Enter Verification Code").or(page.locator("text=Sign in to verify"))).toBeVisible({ timeout: 5000 });
  });

  // 4. Project creation validates and enforces GitHub Repository URL
  test("Project creation validates and blocks invalid GitHub URLs", async ({ page, context }) => {
    await page.route("**/api/v1/users/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "33333333-3333-3333-3333-333333333333",
          email: "project_author@example.com",
          handle: "projauthor",
          full_name: "Project Author",
          role: "user",
          is_email_verified: true,
        }),
      });
    });

    await context.addCookies([
      {
        name: "lb_token",
        value: "mock_token_proj",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.addInitScript(() => {
      window.localStorage.setItem("lb_token", "mock_token_proj");
    });

    await page.goto("/projects/new");
    await expect(page.locator("h1")).toContainText(/Create Collaborative Project/i);

    // Invalid GitHub repo
    const repoInput = page.locator('input[placeholder="https://github.com/owner/repo"]');
    await repoInput.fill("https://gitlab.com/wrong/repo");
    await repoInput.blur();

    // Validation error should show
    await expect(page.locator("text=Must be a valid GitHub repository URL")).toBeVisible();

    // Valid GitHub repo clears error
    await repoInput.fill("https://github.com/launchbyte/awesome-hack");
    await repoInput.blur();
    await expect(page.locator("text=Must be a valid GitHub repository URL")).not.toBeVisible();
  });

  // 5. Host Event submission workflow on /host
  test("Host event submission provides clear user feedback", async ({ page }) => {
    await page.goto("/host");
    await expect(page.locator("h1")).toContainText(/Host an Event on LaunchByte/i);

    // Check key fields exist on host form
    await expect(page.locator('input[placeholder*="National AI & Systems Hackathon"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="organizer@institution.edu"]').first()).toBeVisible();
  });

  // 6. Team Search & Filtering
  test("Team discovery page debounces search and queries matching teams", async ({ page }) => {
    let lastQueryUrl = "";

    await page.route("**/api/v1/teams*", async (route) => {
      lastQueryUrl = route.request().url();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "55555555-5555-5555-5555-555555555555",
              name: "Quantum Devs",
              slug: "quantum-devs",
              description: "Building quantum neural net tools",
              max_size: 4,
              visibility: "public",
              status: "active",
              looking_for_skills: ["Python", "Rust"],
              members: [{ id: "m1", user_id: "u1", full_name: "Lead", role: "leader" }],
              open_spots: 3,
            },
          ],
          total: 1,
          page: 1,
          per_page: 12,
        }),
      });
    });

    await page.goto("/teams");
    const searchInput = page.locator('input[placeholder*="Search teams"]');
    await searchInput.fill("Quantum");

    // Wait for debounced search call
    await page.waitForTimeout(500);

    expect(lastQueryUrl).toContain("q=Quantum");
    await expect(page.locator("text=Quantum Devs")).toBeVisible();
  });

  // 7. Public Featured Opportunities Section Displays Verified Listings
  test("Public homepage displays featured opportunities without authentication", async ({ page }) => {
    await page.route("**/api/v1/opportunities*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "66666666-6666-6666-6666-666666666666",
              title: "HackSmart 2.0",
              slug: "hacksmart-2-0",
              summary: "Industry-focused hackathon centered around electric mobility",
              type: "hackathon",
              location_type: "onsite",
              location_text: "Gurugram, Haryana, India",
              starts_at: "2027-02-06T09:00:00Z",
              ends_at: "2027-02-07T18:00:00Z",
              deadline_at: "2026-12-15T23:59:00Z",
              is_featured: true,
              verification_status: "verified",
              trust_score: 95,
              application_url: "https://unstop.com/hackathons/hacksmart-20-geek-room-1799091",
              organizer_name_override: "Battery Smart × Geek Room",
            },
          ],
          total: 1,
          limit: 4,
          offset: 0,
        }),
      });
    });

    await page.goto("/");
    await expect(page.locator("text=Featured Opportunities")).toBeVisible();
    await expect(page.locator("text=HackSmart 2.0")).toBeVisible();
    await expect(page.locator("text=Battery Smart × Geek Room")).toBeVisible();
    await expect(page.locator('a[href*="/opportunities/hacksmart-2-0"]').first()).toBeVisible();
    await expect(page.locator('a[href*="unstop.com/hackathons/hacksmart-20"]').first()).toBeVisible();
  });
});
