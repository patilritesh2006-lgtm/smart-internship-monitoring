import { test as base, expect, type Page } from '@playwright/test';
import { DEMO_USERS } from './test-data';

export type AuthFixtures = {
  studentPage: Page;
  mentorPage: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  studentPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(DEMO_USERS.student.email);
    await page.locator('input[placeholder="••••••••••••"]').fill(DEMO_USERS.student.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/student');
    await expect(page).toHaveURL(/.*\/student/);
    await use(page);
  },
  mentorPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(DEMO_USERS.mentor.email);
    await page.locator('input[placeholder="••••••••••••"]').fill(DEMO_USERS.mentor.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/mentor');
    await expect(page).toHaveURL(/.*\/mentor/);
    await use(page);
  },
  adminPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(DEMO_USERS.admin.email);
    await page.locator('input[placeholder="••••••••••••"]').fill(DEMO_USERS.admin.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin');
    await expect(page).toHaveURL(/.*\/admin/);
    await use(page);
  },
});

export { expect };
