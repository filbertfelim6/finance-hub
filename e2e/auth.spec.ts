import { test, expect } from "@playwright/test";

test.describe("Auth flow", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /google/i })).toBeVisible();
  });

  test("register page renders correctly", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows validation error for invalid email on login", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("shows validation error when passwords don't match on register", async ({ page }) => {
    await page.goto("/auth/register");
    await page.getByLabel(/^password/i).fill("password123");
    await page.getByLabel(/confirm/i).fill("different");
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });
});
