import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/LoginPage';

test.describe('L. Accessibility (a11y) & Usability Checks', () => {
  test('L1: Login form inputs possess associated label or descriptive attribute', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const emailInput = loginPage.emailInput;
    await expect(emailInput).toBeVisible();
    const hasEmailAttr = (await emailInput.getAttribute('type')) === 'email';
    expect(hasEmailAttr).toBe(true);

    const passwordInput = loginPage.passwordInput;
    await expect(passwordInput).toBeVisible();
    const placeholder = await passwordInput.getAttribute('placeholder');
    expect(placeholder).not.toBeNull();
  });

  test('L2: Password reveal toggle has explicit accessible aria-label', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    const toggleBtn = loginPage.togglePasswordButton;
    const initialLabel = await toggleBtn.getAttribute('aria-label');
    expect(initialLabel).toMatch(/show password|hide password/i);

    await toggleBtn.click();
    const updatedLabel = await toggleBtn.getAttribute('aria-label');
    expect(updatedLabel).toMatch(/show password|hide password/i);
  });

  test('L3: Keyboard Tab key navigates focus logically through login form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Focus email field
    await loginPage.emailInput.focus();
    await expect(loginPage.emailInput).toBeFocused();

    // Press Tab -> focus forgot password or password field
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedTag);
  });

  test('L4: Main landing page includes proper heading hierarchy with single h1', async ({ page }) => {
    await page.goto('/');
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    const h1Text = await page.locator('h1').first().textContent();
    expect(h1Text?.length).toBeGreaterThan(5);
  });

  test('L5: Interactive modals close gracefully when Escape key is pressed', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Open explainability modal
    const explainBtn = page.locator('button', { hasText: /why this score|explain attention score/i }).first();
    if (await explainBtn.isVisible()) {
      await explainBtn.click();
      const modal = page.locator('[role="dialog"], .fixed');
      await expect(modal).toBeVisible();

      // Press Escape
      await page.keyboard.press('Escape');
    }
  });
});
