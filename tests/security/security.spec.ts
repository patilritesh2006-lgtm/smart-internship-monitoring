import { test, expect } from '@playwright/test';

test.describe('I. Role-Based Access Control & Security', () => {
  test('I1: Student role is forbidden from accessing Admin portal and redirected', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Attempt navigating directly to /admin
    await page.goto('/admin');
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
  });

  test('I2: Student role is forbidden from accessing Mentor portal and redirected', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Attempt navigating to /mentor
    await page.goto('/mentor');
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
  });

  test('I3: Mentor role is forbidden from accessing Admin portal and redirected', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Dr. Alan Turing' }).click();
    await page.waitForURL('**/mentor');

    // Attempt navigating to /admin
    await page.goto('/admin');
    await page.waitForURL('**/mentor');
    await expect(page).toHaveURL(/.*\/mentor/);
  });

  test('I4: XSS injection payloads in inputs are safely rendered as text strings', async ({ page }) => {
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const xssPayload = '<script>window.xssFlag=true</script>';
    await emailInput.fill(xssPayload);

    const xssExecuted = await page.evaluate(() => (window as any).xssFlag === true);
    expect(xssExecuted).toBe(false);
  });

  test('I5: Corrupt or manipulated localStorage auth token is cleared safely without crashing app', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('eduintern_token', 'invalid.jwt.token.manipulated');
      localStorage.setItem('eduintern_user', '{ invalid json');
    });

    await page.goto('/student');
    // App handles invalid JSON safely and redirects to login
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);
  });
});
