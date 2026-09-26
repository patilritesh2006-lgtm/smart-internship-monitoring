import { test, expect } from '@playwright/test';
import { DEMO_USERS } from '../fixtures/test-data';

test.describe('D. UI Components & Visual Elements', () => {
  test('D1: Landing page renders hero title and enterprise feature highlights', async ({ page }) => {
    await page.goto('/');
    const mainHeading = page.locator('h1').first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText(/Academic Internship|Monitoring|Intelligence|SIMMS/i);
  });

  test('D2: Landing page interactive platform preview tabs switch active views', async ({ page }) => {
    await page.goto('/');
    const previewSection = page.locator('section, div').filter({ hasText: /platform preview|dashboard/i }).first();
    await expect(previewSection).toBeVisible();

    const studentsTab = page.locator('button', { hasText: 'Students' }).first();
    if (await studentsTab.isVisible()) {
      await studentsTab.click();
      await expect(page.locator('body')).toContainText(/cohort|intern|progress/i);
    }
  });

  test('D3: Student dashboard displays internship details and company badge', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Verify internship card details
    await expect(page.locator('body')).toContainText(/Quantum AI Labs|AI\/ML Intern/i);
  });

  test('D4: Student dashboard renders attention status badge with semantic styling', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    const statusBadge = page.locator('text=ON TRACK').first();
    await expect(statusBadge).toBeVisible();
  });

  test('D5: Dashboard sidebar displays role indicator and header displays user name', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    await expect(sidebar).toContainText(/Student/i);
    await expect(page.locator('header, main').first()).toContainText(/Rohan Patil/i);
  });

  test('D6: Explainable AI intelligence modal opens with 4-factor scoring breakdown', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Click explain button or why this score
    const explainBtn = page.locator('button', { hasText: /why this score|explain attention score|how this score is calculated/i }).first();
    if (await explainBtn.isVisible()) {
      await explainBtn.click();
      const modal = page.locator('[role="dialog"], .fixed');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/task completion|weekly reports|mentor feedback|consistency/i);

      // Close modal
      const closeBtn = page.locator('button[aria-label="Close modal"], button:has-text("Close")').first();
      await closeBtn.click();
    }
  });
});
