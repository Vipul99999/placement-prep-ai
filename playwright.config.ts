import { defineConfig, devices } from "playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  workers: 1,
  expect: {
    timeout: 10_000
  },
  use: {
    baseURL: "http://127.0.0.1:3010",
    trace: "retain-on-failure"
  },
  webServer: {
    command:
      "\"C:\\Users\\vipul\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe\" .\\node_modules\\next\\dist\\bin\\next dev --hostname 127.0.0.1 --port 3010",
    url: "http://127.0.0.1:3010",
    reuseExistingServer: false,
    env: {
      E2E_BYPASS_AUTH: "1",
      NEXTAUTH_SECRET: "test-secret",
      NEXTAUTH_URL: "http://127.0.0.1:3010"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
