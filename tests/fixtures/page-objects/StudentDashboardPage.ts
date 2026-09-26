import { type Page, type Locator, expect } from '@playwright/test';

export class StudentDashboardPage {
  readonly page: Page;
  readonly studentNameHeader: Locator;
  readonly logoutButton: Locator;
  readonly dashboardTab: Locator;
  readonly applicationsTab: Locator;
  readonly timesheetsTab: Locator;
  readonly evaluationsTab: Locator;
  readonly messagesTab: Locator;
  readonly attentionBadge: Locator;
  readonly milestoneTasksCheckboxes: Locator;
  readonly submitReportButton: Locator;
  readonly explainScoreButton: Locator;
  readonly modalCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.studentNameHeader = page.locator('header, .font-black').first();
    this.logoutButton = page.locator('button', { hasText: /logout/i });
    this.dashboardTab = page.locator('button', { hasText: 'Dashboard' }).first();
    this.applicationsTab = page.locator('button', { hasText: 'Applications' }).first();
    this.timesheetsTab = page.locator('button', { hasText: 'Timesheets' }).first();
    this.evaluationsTab = page.locator('button', { hasText: 'Evaluations' }).first();
    this.messagesTab = page.locator('button', { hasText: 'Messages' }).first();
    this.attentionBadge = page.locator('[class*="border-emerald"], [class*="border-amber"], [class*="border-rose"]').first();
    this.milestoneTasksCheckboxes = page.locator('input[type="checkbox"]');
    this.submitReportButton = page.locator('button', { hasText: /submit weekly report|submit report/i }).first();
    this.explainScoreButton = page.locator('button', { hasText: /explain|why this score/i }).first();
    this.modalCloseButton = page.locator('button[aria-label="Close modal"], button:has-text("Close")').first();
  }

  async goto() {
    await this.page.goto('/student');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectTab(tabName: 'Dashboard' | 'Applications' | 'Timesheets' | 'Evaluations' | 'Messages') {
    const { navigateStudentTab } = await import('../navigation-helper');
    await navigateStudentTab(this.page, tabName);
  }

  async logout() {
    const { safeLogout } = await import('../navigation-helper');
    await safeLogout(this.page);
  }
}
