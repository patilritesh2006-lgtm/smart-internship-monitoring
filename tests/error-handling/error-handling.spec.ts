import { test, expect } from '@playwright/test';
import { RegisterPage } from '../fixtures/page-objects/RegisterPage';
import { DEMO_USERS } from '../fixtures/test-data';

test.describe('K. Error Handling & Fault Tolerance', () => {
  test('K1: 404 page renders helpful status and link back to home', async ({ page }) => {
    await page.goto('/some-missing-url-path-404');
    await expect(page.locator('body')).toContainText(/404|not found|return|home/i);
    const returnLink = page.locator('a[href="/"]');
    if (await returnLink.isVisible()) {
      await returnLink.click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test('K2: Backend API returns standard 404 JSON for unknown endpoint', async ({ request }) => {
    const res = await request.get('http://127.0.0.1:8000/api/unknown-endpoint');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body).toHaveProperty('detail');
  });

  test('K3: Backend API returns 422 Unprocessable Entity for invalid request schema', async ({ request }) => {
    // Missing required email field in login payload
    const res = await request.post('http://127.0.0.1:8000/api/auth/login', {
      data: { invalid_field: 'no_email' },
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.detail).toBeDefined();
  });

  test('K4: Registering an account with an already existing email displays clear error alert', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    // Attempt to register with already seeded student email
    await regPage.registerStudent({
      fullName: 'Duplicate Student',
      email: DEMO_USERS.student.email,
      password: 'SamplePassword123',
      department: 'Computer Science',
      rollNumber: 'CS-999',
      academicYear: 3,
    });

    await expect(regPage.errorBanner).toBeVisible();
    await expect(regPage.errorBanner).toContainText(/already registered|exists|registered/i);
  });

  test('K5: Frontend handles network failure gracefully without crashing', async ({ page }) => {
    await page.goto('/login');
    // Abort API requests to simulate server unreachable
    await page.route('**/api/auth/login', (route) => route.abort());

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[placeholder="••••••••••••"]');
    const submitBtn = page.locator('button[type="submit"]');

    await emailInput.fill(DEMO_USERS.student.email);
    await passwordInput.fill(DEMO_USERS.student.password);
    await submitBtn.click();

    // Should display error without unhandled page crash
    const errorAlert = page.locator('.bg-rose-50, .text-rose-700, [role="alert"]');
    await expect(errorAlert.first()).toBeVisible();
  });
});
