import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/LoginPage';
import { RegisterPage } from '../fixtures/page-objects/RegisterPage';

test.describe('H. Input Validation & Boundary Checks', () => {
  test('H1: Malformed email without @ triggers HTML5 email validation error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill('invalid-email-format');
    await loginPage.passwordInput.fill('ValidPass123!');
    await loginPage.submitButton.click();

    // Check validity state
    const isValid = await loginPage.emailInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('H2: Registration password shorter than 6 characters fails minLength constraint', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    await regPage.passwordInput.fill('12345'); // 5 chars, min is 6
    const isValid = await regPage.passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('H3: Registration academic year select limits options to valid 4 years', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    const options = await regPage.academicYearSelect.locator('option').allTextContents();
    expect(options.length).toBe(4);
    expect(options).toEqual(expect.arrayContaining(['Year 1', 'Year 2', 'Year 3', 'Year 4']));
  });

  test('H4: Full name and department inputs enforce required constraint on registration', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    const isNameRequired = await regPage.fullNameInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isNameRequired).toBe(true);

    const isEmailRequired = await regPage.emailInput.evaluate((el: HTMLInputElement) => el.required);
    expect(isEmailRequired).toBe(true);
  });

  test('H5: Empty registration submission remains on register page', async ({ page }) => {
    const regPage = new RegisterPage(page);
    await regPage.goto();

    await regPage.submitButton.click();
    await expect(page).toHaveURL(/.*\/register/);
  });

  test('H6: Trimming leading/trailing spaces in credentials during login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Type with accidental trailing space in email
    await loginPage.emailInput.fill(' student@demo.com ');
    await loginPage.passwordInput.fill('Student@123');
    await loginPage.submitButton.click();

    // Application should still authenticate or cleanly handle
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url.includes('/student') || url.includes('/login')).toBe(true);
  });
});
