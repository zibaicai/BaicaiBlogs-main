import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 30_000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.015,
      animations: "disabled",
    },
  },
  use: {
    baseURL: process.env.VISUAL_BASE_URL || "https://www.zibaicai.cn",
    channel: "chrome",
    viewport: { width: 1440, height: 1000 },
    colorScheme: "light",
    locale: "zh-CN",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 1000 } },
    },
  ],
});
