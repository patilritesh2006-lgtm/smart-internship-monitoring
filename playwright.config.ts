import { defineConfig, devices } from '@playwright/test';

/**
 * Production-quality Playwright configuration for Smart Internship Management & Monitoring System.
 * Localhost ports:
 *  - Frontend (Next.js): http://localhost:3000
 *  - Backend (FastAPI):  http://127.0.0.1:8000
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run suites systematically to prevent database lock contention on SQLite
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker prevents SQLite file locks during simultaneous test writes
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
  webServer: [
    {
      command: '.\\venv\\Scripts\\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000',
      port: 8000,
      timeout: 60 * 1000,
      reuseExistingServer: true,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run start --prefix frontend',
      port: 3000,
      timeout: 60 * 1000,
      reuseExistingServer: true,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
