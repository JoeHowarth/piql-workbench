import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "workbench-demo",
      testMatch: ["workbench.spec.ts", "a11y.spec.ts"],
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:5173",
      },
    },
    {
      name: "piql-demo",
      testMatch: ["piql.spec.ts", "chart.spec.ts", "a11y.spec.ts"],
      use: {
        browserName: "chromium",
        baseURL: "http://localhost:5174",
      },
    },
  ],
  webServer: [
    {
      command: "bun run --cwd apps/workbench-demo dev",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "bun run --cwd apps/piql-demo dev -- --port 5174",
      url: "http://localhost:5174",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
