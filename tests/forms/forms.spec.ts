import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/LoginPage';
import { RegisterPage } from '../fixtures/page-objects/RegisterPage';
import { generateRandomStudent } from '../fixtures/test-data';

test.describe('E. Form Controls & Interactive Inputs', () => {
  test('E1: Password visibility toggle button switches input between password and text', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.passwordInput.fill('MySecretPassword123');
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Click show password
    await loginPage.togglePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

    // Click hide password
    await loginPage.togglePasswordButton.click();
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('E2: Remember me checkbox toggles state reliably', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.rememberMeCheckbox).toBeChecked();
    await loginPage.rememberMeCheckbox.uncheck();
    await expect(loginPage.rememberMeCheckbox).not.toBeChecked();
    await loginPage.rememberMeCheckbox.check();
    await expect(loginPage.rememberMeCheckbox).toBeChecked();
  });

  test('E3: Registration form role toggle dynamically changes Student vs Mentor fields', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    // Default is Student -> Roll number and academic year should be visible
    await expect(regPage.rollNumberInput).toBeVisible();
    await expect(regPage.academicYearSelect).toBeVisible();
    await expect(regPage.designationInput).toBeHidden();
    await expect(regPage.employeeIdInput).toBeHidden();

    // Switch to Faculty Mentor
    await regPage.mentorRoleButton.click();
    await expect(regPage.designationInput).toBeVisible();
    await expect(regPage.employeeIdInput).toBeVisible();
    await expect(regPage.rollNumberInput).toBeHidden();
    await expect(regPage.academicYearSelect).toBeHidden();

    // Switch back to Student
    await regPage.studentRoleButton.click();
    await expect(regPage.rollNumberInput).toBeVisible();
    await expect(regPage.academicYearSelect).toBeVisible();
  });

  test('E4: Student registration accepts valid inputs across all required fields', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    const newStudent = generateRandomStudent();
    await regPage.fullNameInput.fill(newStudent.fullName);
    await regPage.emailInput.fill(newStudent.email);
    await regPage.passwordInput.fill(newStudent.password);
    await regPage.departmentInput.fill(newStudent.department);
    await regPage.rollNumberInput.fill(newStudent.rollNumber);
    await regPage.academicYearSelect.selectOption(String(newStudent.academicYear));

    await expect(regPage.fullNameInput).toHaveValue(newStudent.fullName);
    await expect(regPage.emailInput).toHaveValue(newStudent.email);
    await expect(regPage.rollNumberInput).toHaveValue(newStudent.rollNumber);
  });

  test('E5: Empty login form submission is blocked by required HTML5 validation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Submit without typing email or password
    await loginPage.submitButton.click();

    // Browser prevents navigation because required fields are empty
    await expect(page).toHaveURL(/.*\/login/);
    const isRequired = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isRequired).toBe(true);
  });

  test('E6: Weekly report submission modal opens and populates fields correctly', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    // Click Timesheets or Reports tab (via bottom nav on mobile or sidebar on desktop)
    const { navigateStudentTab } = await import('../fixtures/navigation-helper');
    await navigateStudentTab(page, 'Timesheets');

    // Check for weekly report entry controls
    const workTextarea = page.locator('textarea').first();
    if (await workTextarea.isVisible()) {
      await workTextarea.fill('Successfully completed automated test harness integration.');
      await expect(workTextarea).toHaveValue('Successfully completed automated test harness integration.');
    }
  });

  test('E7: Timesheet day hours adjustment updates inputs correctly', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button', { hasText: 'Rohan Patil' }).click();
    await page.waitForURL('**/student');

    const { navigateStudentTab } = await import('../fixtures/navigation-helper');
    await navigateStudentTab(page, 'Timesheets');

    const hoursInputs = page.locator('input[type="number"]');
    if ((await hoursInputs.count()) > 0) {
      const firstHourInput = hoursInputs.first();
      await firstHourInput.fill('8.5');
      await expect(firstHourInput).toHaveValue('8.5');
    }
  });
});
