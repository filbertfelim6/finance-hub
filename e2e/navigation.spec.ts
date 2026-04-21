import { test, expect } from "@playwright/test";

// Navigation tests require an authenticated session.
// Run these manually after creating a test user in Supabase dashboard.

test.describe("App navigation (requires authenticated session)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL ?? "test@example.com");
    await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD ?? "password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/");
  });

  test("dashboard is accessible after login", async ({ page }) => {
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
  });

  test("sidebar contains all nav links on desktop", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /accounts/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /transactions/i }).first()).toBeVisible();
  });
});
