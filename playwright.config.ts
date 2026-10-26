import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    viewport: { width: 1366, height: 768 },
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH,
      args: ["--no-sandbox"],
    },
  },
  webServer: [
    {
      command: "npm run dev",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run server",
      url: "http://127.0.0.1:8787/health",
      reuseExistingServer: !process.env.CI,
    },
  ],
  reporter: [
    ["list"],
    ["json", { outputFile: "docs/design/wardogs-v1/e2e-results.json" }],
  ],
});
