import { test, expect } from "@playwright/test";

// ─── Unauthenticated route guard ─────────────────────────────────────────────
test.describe("Plan 2 route guard (unauthenticated)", () => {
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

// ─── Authenticated UI — only runs when E2E credentials provided ───────────────
test.describe("Plan 2 authenticated UI", () => {
  test.skip(!process.env.E2E_TEST_EMAIL, "Set E2E_TEST_EMAIL + E2E_TEST_PASSWORD to run");

  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD ?? "");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
  });

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
    // Amount step should now be visible (numeric keypad or input)
    await expect(page.getByPlaceholder("0")).toBeVisible();
  });

  test("log form advances through expense flow to details", async ({ page }) => {
    await page.goto("/log");
    // Step 1: type
    await page.getByRole("button", { name: /expense/i }).click();
    // Step 2: amount — enter 10000
    await page.getByText("1").click();
    await page.getByText("0").first().click();
    await page.getByText("0").first().click();
    await page.getByText("0").first().click();
    await page.getByText("0").first().click();
    await page.getByRole("button", { name: /next/i }).click();
    // Step 3: category — skip if no categories yet, check heading visible
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
    const heading = page.getByRole("heading", { name: /accounts/i });
    await expect(heading).toBeVisible();
    // If there are account cards, click the first one
    const cards = page.locator("a[href^='/accounts/']");
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await expect(page).toHaveURL(/\/accounts\/.+/);
      await expect(page.getByRole("link", { name: /back/i }).or(page.getByLabel(/back/i))).toBeVisible();
    } else {
      test.skip();
    }
  });

  test("⋯ button on account card does NOT navigate (stopPropagation)", async ({ page }) => {
    await page.goto("/accounts");
    const cards = page.locator("a[href^='/accounts/']");
    const count = await cards.count();
    if (count === 0) { test.skip(); return; }

    // Click the ⋯ button — should open dropdown, NOT navigate
    const moreBtn = cards.first().getByRole("button", { name: /more/i });
    await moreBtn.click();
    // Should still be on /accounts
    await expect(page).toHaveURL("/accounts");
    // Dropdown items should be visible
    await expect(page.getByRole("menuitem", { name: /edit/i }).or(page.getByText(/edit/i))).toBeVisible();
  });
});
