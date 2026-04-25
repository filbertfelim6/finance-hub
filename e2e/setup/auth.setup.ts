import { test as setup, expect } from "@playwright/test";
import path from "path";

export const AUTH_STATE_PATH = path.join(__dirname, ".auth-state.json");

setup("authenticate", async ({ page }) => {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL!);
  await page.getByLabel(/password/i).fill(process.env.E2E_TEST_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/", { timeout: 60000 });
  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: AUTH_STATE_PATH });
});
