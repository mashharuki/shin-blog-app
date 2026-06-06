import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 *
 * Tests run against the Vite dev server on port 5173.
 * Authentication is mocked via page.route() + localStorage injection
 * so no real Cognito / DynamoDB backend is required.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm frontend dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      VITE_COGNITO_CLIENT_ID: "",
      VITE_COGNITO_USER_POOL_ID: "us-east-1_test",
      VITE_COGNITO_REGION: "us-east-1",
      VITE_API_BASE_URL: "http://localhost:3000",
    },
  },
});
