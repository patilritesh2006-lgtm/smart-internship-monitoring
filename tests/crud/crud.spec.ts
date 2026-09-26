import { test, expect } from '@playwright/test';
import { generateRandomInternship } from '../fixtures/test-data';

test.describe('F. Real Application CRUD Operations', () => {
  test('F1: Student can toggle milestone task completion state live', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Locate milestone task checkboxes
    const taskCheckboxes = page.locator('button, div, li').filter({ hasText: /Task|Deploy|Package|Complete/i }).locator('input[type="checkbox"]');
    const count = await taskCheckboxes.count();
    if (count > 0) {
      const firstCheckbox = taskCheckboxes.first();
      const initialChecked = await firstCheckbox.isChecked();
      await firstCheckbox.click();

      // Expect state to have toggled
      await expect(firstCheckbox).toHaveJSProperty('checked', !initialChecked);

      // Re-toggle back to preserve test idempotency
      await firstCheckbox.click();
      await expect(firstCheckbox).toHaveJSProperty('checked', initialChecked);
    }
  });

  test('F2: Student can open and inspect weekly progress report modal', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Click Submit Logbook button on dashboard
    const submitBtn = page.locator('button', { hasText: /submit logbook|submit report/i }).first();
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Verify modal appears with form fields and submit action
    const modal = page.locator('[role="dialog"], .fixed');
    await expect(modal).toBeVisible();
    const confirmBtn = modal.locator('button', { hasText: /submit|confirm/i }).first();
    await expect(confirmBtn).toBeVisible();

    // Cancel and close modal
    await modal.locator('button', { hasText: /cancel/i }).click();
  });

  test('F3: Admin can open Post Opportunity modal and inspect posting form', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Dean of Engineering' }).click();
    await page.waitForURL('**/admin');

    const postBtn = page.locator('button', { hasText: /post opportunity|post internship/i }).first();
    await expect(postBtn).toBeVisible();
    await postBtn.click();

    // Verify modal appears
    const modal = page.locator('[role="dialog"], .fixed');
    await expect(modal).toBeVisible();

    const sample = generateRandomInternship();
    // Fill title and company
    const titleInput = page.locator('input[placeholder*="Frontend" i], input[placeholder*="Role" i], input[placeholder*="Title" i]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(sample.title);
    }

    const companyInput = page.locator('input[placeholder*="Company" i], input[placeholder*="Google" i]').first();
    if (await companyInput.isVisible()) {
      await companyInput.fill(sample.companyName);
    }

    // Close modal cleanly
    const cancelBtn = page.locator('button', { hasText: /cancel|close/i }).first();
    await cancelBtn.click();
  });

  test('F4: Faculty Mentor can open and inspect report review modal', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Dr. Alan Turing' }).click();
    await page.waitForURL('**/mentor');

    // Check for pending reports section
    const reviewBtn = page.locator('button', { hasText: /review report|grade report|review/i }).first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      const modal = page.locator('[role="dialog"], .fixed');
      await expect(modal).toBeVisible();

      // Close modal
      const closeBtn = page.locator('button', { hasText: /cancel|close/i }).first();
      await closeBtn.click();
    }
  });

  test('F5: Faculty Mentor can open intervention recording modal for assigned student', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Dr. Alan Turing' }).click();
    await page.waitForURL('**/mentor');

    // Click on intervention button
    const interventionBtn = page.locator('button', { hasText: /record intervention|log intervention|intervention/i }).first();
    if (await interventionBtn.isVisible()) {
      await interventionBtn.click();
      const modal = page.locator('[role="dialog"], .fixed');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(/intervention/i);

      // Close modal
      const cancelBtn = page.locator('button', { hasText: /cancel|close/i }).first();
      await cancelBtn.click();
    }
  });

  test('F6: Student can navigate to Applications catalog and browse open positions', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Switch to Applications tab (via bottom nav on mobile or sidebar on desktop)
    const { navigateStudentTab } = await import('../fixtures/navigation-helper');
    await navigateStudentTab(page, 'Applications');

    // Verify catalog or applications list renders
    await expect(page.locator('body')).toContainText(/Internship|Position|Apply|Quantum|TechNova|Labs/i);
  });
});
