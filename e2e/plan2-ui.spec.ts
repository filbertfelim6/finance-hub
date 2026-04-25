import { test, expect } from "@playwright/test";

// ─── Unauthenticated route guard ─────────────────────────────────────────────
// These override the global storageState so we can test the redirect behaviour.
test.describe("Plan 2 route guard (unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const protectedRoutes = [
    "/accounts",
    "/transactions",
    "/log",
    "/accounts/some-uuid",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /auth/login`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  }
});

// ─── Auth pages still render ─────────────────────────────────────────────────
test.describe("Auth pages render correctly after Plan 2", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("login page still has email + password fields", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register page still renders", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });
});

// ─── Authenticated UI ─────────────────────────────────────────────────────────
// Session is injected via storageState (set up once by e2e/setup/auth.setup.ts).
// All tests in this block get a pre-authenticated page with no login overhead.
test.describe("Plan 2 authenticated UI", () => {
  test.skip(!process.env.E2E_TEST_EMAIL, "Set E2E_TEST_EMAIL + E2E_TEST_PASSWORD to run");

  test("accounts page renders heading and Add account button", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page.getByRole("heading", { name: /accounts/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add account/i })).toBeVisible();
  });

  test("transactions page renders heading and Export CSV button", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.getByRole("heading", { name: /transactions/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export csv/i })).toBeVisible();
  });

  test("log page renders log transaction heading and type step", async ({ page }) => {
    await page.goto("/log");
    await expect(page.getByRole("heading", { name: /log transaction/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /expense/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /income/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /transfer/i })).toBeVisible();
  });

  test("log form advances from type → amount on Expense click", async ({ page }) => {
    await page.goto("/log");
    await page.getByRole("button", { name: /expense/i }).click();
    await expect(page.getByPlaceholder("0")).toBeVisible();
  });

  test("log form advances through expense flow to category", async ({ page }) => {
    await page.goto("/log");
    // Step 1: select Expense
    await page.getByRole("button", { name: /expense/i }).click();
    // Step 2: tap keypad digits to enter 10000
    const keypad = page.locator("button[type='button']");
    await page.locator("button[type='button']").filter({ hasText: /^1$/ }).click();
    await page.locator("button[type='button']").filter({ hasText: /^0$/ }).click();
    await page.locator("button[type='button']").filter({ hasText: /^0$/ }).click();
    await page.locator("button[type='button']").filter({ hasText: /^0$/ }).click();
    await page.locator("button[type='button']").filter({ hasText: /^0$/ }).click();
    // Proceed — button is labeled "Continue" in AmountStep
    await page.getByRole("button", { name: /continue/i }).click();
    // Step 3: category heading should appear
    await expect(page.getByRole("heading", { name: /category/i })).toBeVisible();
  });

  test("accounts page Add Account dialog opens", async ({ page }) => {
    await page.goto("/accounts");
    await page.getByRole("button", { name: /add account/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("heading", { name: /add account/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
  });

  test("transactions page filters are visible", async ({ page }) => {
    await page.goto("/transactions");
    await expect(page.getByPlaceholder(/search notes/i)).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("account detail page navigates from accounts list", async ({ page }) => {
    await page.goto("/accounts");
    await expect(page.getByRole("heading", { name: /accounts/i })).toBeVisible();
    const cards = page.locator("a[href^='/accounts/']");
    const count = await cards.count();
    if (count === 0) { test.skip(); return; }
    await cards.first().click();
    await expect(page).toHaveURL(/\/accounts\/.+/);
    await expect(page.getByLabel(/back/i)).toBeVisible();
  });

  test("⋯ button on account card does NOT navigate (stopPropagation)", async ({ page }) => {
    await page.goto("/accounts");
    const cards = page.locator("a[href^='/accounts/']");
    const count = await cards.count();
    if (count === 0) { test.skip(); return; }
    const moreBtn = cards.first().getByRole("button", { name: /more/i });
    await moreBtn.click();
    await expect(page).toHaveURL("/accounts");
    await expect(page.getByText(/edit/i).first()).toBeVisible();
  });
});
