import { test, expect } from '@playwright/test';
import { LoginPage } from '../fixtures/page-objects/LoginPage';
import { DEMO_USERS, INVALID_USER } from '../fixtures/test-data';

test.describe('B. Authentication & Session Management', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('B1: Student can log in with valid credentials and redirects to /student', async ({ page }) => {
    await loginPage.login(DEMO_USERS.student.email, DEMO_USERS.student.password);
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
    await expect(page.locator('body')).toContainText(/Rohan Patil|Internship/i);
  });

  test('B2: Faculty Mentor can log in with valid credentials and redirects to /mentor', async ({ page }) => {
    await loginPage.login(DEMO_USERS.mentor.email, DEMO_USERS.mentor.password);
    await page.waitForURL('**/mentor');
    await expect(page).toHaveURL(/.*\/mentor/);
    await expect(page.locator('body')).toContainText(/Dr. Alan Turing|Mentor|Interns/i);
  });

  test('B3: Academic Dean can log in with valid credentials and redirects to /admin', async ({ page }) => {
    await loginPage.login(DEMO_USERS.admin.email, DEMO_USERS.admin.password);
    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('body')).toContainText(/Institutional Command|Administration|Dean/i);
  });

  test('B4: 1-Click Instant Access persona button logs in Student immediately', async ({ page }) => {
    await loginPage.quickLoginAs('student');
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
  });

  test('B5: 1-Click Instant Access persona button logs in Mentor immediately', async ({ page }) => {
    await loginPage.quickLoginAs('mentor');
    await page.waitForURL('**/mentor');
    await expect(page).toHaveURL(/.*\/mentor/);
  });

  test('B6: Login with incorrect password displays error banner', async ({ page }) => {
    await loginPage.login(DEMO_USERS.student.email, 'WrongPassword123');
    await expect(loginPage.errorBanner).toBeVisible();
    await expect(loginPage.errorBanner).toContainText(/failed|incorrect|invalid/i);
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('B7: Login with non-existent email displays error banner', async ({ page }) => {
    await loginPage.login(INVALID_USER.email, INVALID_USER.password);
    await expect(loginPage.errorBanner).toBeVisible();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('B8: Authenticated session persists across browser page reload', async ({ page }) => {
    await loginPage.quickLoginAs('student');
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);

    // Reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Should remain on /student without redirecting to /login
    await expect(page).toHaveURL(/.*\/student/);
    await expect(page.locator('body')).toContainText(/Rohan Patil|Internship/i);
  });

  test('B9: User logout clears session and redirects to /login', async ({ page }) => {
    await loginPage.quickLoginAs('student');
    await page.waitForURL('**/student');

    // Safely logout supporting both mobile drawer and desktop sidebar
    const { safeLogout } = await import('../fixtures/navigation-helper');
    await safeLogout(page);

    // Verify localStorage auth tokens are cleared
    const token = await page.evaluate(() => localStorage.getItem('eduintern_token'));
    expect(token).toBeNull();
  });
});
