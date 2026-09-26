import { test, expect } from '@playwright/test';

test.describe('C. Navigation & Route Protection', () => {
  test('C1: Unauthenticated access to /student redirects to /login', async ({ page }) => {
    // Clear any residual session
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/student');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('C2: Unauthenticated access to /mentor redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/mentor');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('C3: Unauthenticated access to /admin redirects to /login', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.clear());

    await page.goto('/admin');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('C4: Landing page section navigation anchors function without page crash', async ({ page }) => {
    await page.goto('/');
    const overviewLink = page.getByRole('link', { name: 'Overview', exact: true });
    if (await overviewLink.isVisible()) {
      await overviewLink.click();
      expect(page.url()).toContain('#overview');
    }
  });

  test('C5: Navigation between Login and Register works back and forth', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /register here/i }).click();
    await page.waitForURL('**/register');
    await expect(page).toHaveURL(/.*\/register/);

    await page.getByRole('link', { name: /sign in here/i }).click();
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('C6: Browser back and forward history functions smoothly', async ({ page }) => {
    await page.goto('/');
    await page.goto('/login');
    await expect(page).toHaveURL(/.*\/login/);

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    await page.goForward();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('C7: Accessing non-existent route renders 404 page gracefully', async ({ page }) => {
    const response = await page.goto('/non-existent-sample-route-999');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toBeVisible();
  });
});
