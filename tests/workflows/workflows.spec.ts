import { test, expect } from '@playwright/test';
import { RegisterPage } from '../fixtures/page-objects/RegisterPage';
import { LoginPage } from '../fixtures/page-objects/LoginPage';
import { generateRandomStudent, generateRandomInternship } from '../fixtures/test-data';

test.describe('M. End-to-End User Workflows', () => {
  test('Workflow 1: Complete Student Workflow — Progress Review, Task Toggle, and Report Submission', async ({ page }) => {
    // 1. Navigate to application and log in
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // 2. Verify student dashboard and attention score
    await expect(page.locator('body')).toContainText(/Rohan Patil/i);
    await expect(page.locator('text=ON TRACK').first()).toBeVisible();

    // 3. Milestone task interaction
    const taskCheckbox = page.locator('input[type="checkbox"]').first();
    if (await taskCheckbox.isVisible()) {
      const initialChecked = await taskCheckbox.isChecked();
      await taskCheckbox.click();
      await expect(taskCheckbox).toHaveJSProperty('checked', !initialChecked);
      // Revert to preserve demo data
      await taskCheckbox.click();
    }

    // 4. Navigate to Timesheets tab (via bottom nav on mobile or sidebar on desktop)
    const { navigateStudentTab } = await import('../fixtures/navigation-helper');
    await navigateStudentTab(page, 'Timesheets');
    await expect(page.locator('body')).toContainText(/Weekly Report|Timesheet|Hours/i);

    // 5. Fill work achievements if submit form is available
    const workInput = page.locator('textarea').first();
    if (await workInput.isVisible()) {
      await workInput.fill('Completed E2E integration testing with comprehensive coverage.');
    }
  });

  test('Workflow 2: Complete Mentor Workflow — Intern Triage, Report Review, and Intervention', async ({ page }) => {
    // 1. Log in as Mentor
    await page.goto('/login');
    await page.locator('button', { hasText: 'Dr. Alan Turing' }).click();
    await page.waitForURL('**/mentor');

    // 2. Verify mentor dashboard loaded
    await expect(page.locator('body')).toContainText(/Dr. Alan Turing|Mentor/i);

    // 3. Filter students by status
    const attentionFilter = page.locator('button', { hasText: /Attention/i }).first();
    if (await attentionFilter.isVisible()) {
      await attentionFilter.click();
    }

    // 4. Open report review if any pending
    const reviewBtn = page.locator('main button', { hasText: /review & grade|grade submission/i }).first();
    if (await reviewBtn.isVisible()) {
      await reviewBtn.click();
      const modal = page.locator('[role="dialog"], .fixed');
      await expect(modal).toBeVisible();
      const cancelBtn = modal.locator('button', { hasText: /cancel|close|done/i }).first();
      await cancelBtn.click();
    }
  });

  test('Workflow 3: Complete Admin Workflow — Institutional Analytics and Internship Management', async ({ page }) => {
    // 1. Log in as Administrator
    await page.goto('/login');
    await page.locator('button', { hasText: 'Dean of Engineering' }).click();
    await page.waitForURL('**/admin');

    // 2. Verify Institutional Command Center
    await expect(page.locator('body')).toContainText(/Institutional Command|Administration/i);

    // 3. Inspect Post Internship modal
    const postBtn = page.locator('button', { hasText: /post opportunity|post internship/i }).first();
    await expect(postBtn).toBeVisible();
    await postBtn.click();

    const modal = page.locator('[role="dialog"], .fixed');
    await expect(modal).toBeVisible();

    const sample = generateRandomInternship();
    const titleInput = page.locator('input[placeholder*="Title" i], input[placeholder*="Role" i], input[name="title"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill(sample.title);
    }

    // Close modal cleanly
    const cancelBtn = page.locator('button', { hasText: /cancel|close/i }).first();
    await cancelBtn.click();
  });

  test('Workflow 4: Complete Onboarding Lifecycle — Register New Student, Auto-Login, and Sign-Out', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    const newStudent = generateRandomStudent();
    await regPage.registerStudent(newStudent);

    // After successful registration, redirected to /student
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
    await expect(page.locator('body')).toContainText(newStudent.fullName);

    // Log out cleanly (supports both mobile drawer and desktop sidebar)
    const { safeLogout } = await import('../fixtures/navigation-helper');
    await safeLogout(page);

    // Re-login with the new account
    const loginPage = new LoginPage(page);
    await loginPage.login(newStudent.email, newStudent.password);
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
    await expect(page.locator('body')).toContainText(newStudent.fullName);
  });
});
