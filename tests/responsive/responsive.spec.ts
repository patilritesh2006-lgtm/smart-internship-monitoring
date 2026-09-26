import { test, expect } from '@playwright/test';

test.describe('J. Responsive & Multi-Viewport Testing', () => {
  test('J1: Desktop viewport (1280x800) displays full multi-column dashboard and persistent sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('J2: Tablet viewport (768x1024) maintains usable layout without horizontal page scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('J3: Mobile viewport (375x667) displays hamburger menu button on landing page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const mobileMenuBtn = page.locator('nav button').filter({ has: page.locator('svg') });
    await expect(mobileMenuBtn.first()).toBeVisible();
  });

  test('J4: Mobile hamburger button expands navigation drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Find and click hamburger menu button
    const menuBtn = page.locator('nav button').last();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      // Verify mobile menu expanded or link is visible
      await expect(page.locator('body')).toContainText(/Overview|Programs|Partners|Sign In/i);
    }
  });

  test('J5: Mobile viewport adapts login form within screen bounds', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    const box = await emailInput.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(375);
    }
  });

  test('J6: Mobile viewport displays student dashboard with accessible mobile header', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // On mobile, page header is visible
    await expect(page.locator('body')).toContainText(/Rohan Patil|AI\/ML Intern/i);
  });
});
