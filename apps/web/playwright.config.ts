import { defineConfig } from "@playwright/test";

const port = 3101;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const channel = process.env.PLAYWRIGHT_CHANNEL;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "line",
  timeout: 30_000,
  expect: { timeout: 7_500 },
  use: {
    baseURL: externalBaseUrl ?? `http://127.0.0.1:${port}`,
    channel,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalBaseUrl
    ? undefined
    : {
        command: `corepack pnpm run build && corepack pnpm exec next start -p ${port}`,
        url: `http://127.0.0.1:${port}/ecosystem`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 800 } } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
  ],
});
