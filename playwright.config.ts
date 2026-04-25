import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";
config({ path: ".env.local" });

const hasAuth = !!process.env.E2E_TEST_EMAIL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    // Auth setup runs once before any authenticated tests
    ...(hasAuth
      ? [
          {
            name: "setup",
            testMatch: /setup\/auth\.setup\.ts/,
            use: { ...devices["Desktop Chrome"] },
          },
        ]
      : []),

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(hasAuth
          ? { storageState: "e2e/setup/.auth-state.json" }
          : {}),
      },
      dependencies: hasAuth ? ["setup"] : [],
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 14"],
        ...(hasAuth
          ? { storageState: "e2e/setup/.auth-state.json" }
          : {}),
      },
      dependencies: hasAuth ? ["setup"] : [],
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
