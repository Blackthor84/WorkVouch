import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config for employee trust suite.
 * Requires: baseURL (default http://localhost:3000), E2E_TEST_SECRET for test-only APIs.
 * Optional: E2E_EMPLOYEE_EMAIL, E2E_EMPLOYEE_PASSWORD, E2E_EMPLOYER_EMAIL, E2E_EMPLOYER_PASSWORD for login.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "employee-trust",
      testMatch: /employee-trust\.e2e\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        env: {
          ...process.env,
          E2E_TEST_SECRET: process.env.E2E_TEST_SECRET ?? "e2e-test-secret-min-16-chars",
        },
      },
});
