import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/mobile-browser",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: "node scripts/serve-mobile.mjs",
    url: "http://127.0.0.1:4173/auth/signin/",
    reuseExistingServer: false,
  },
});
