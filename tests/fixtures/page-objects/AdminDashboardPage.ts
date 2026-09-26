import { type Page, type Locator, expect } from '@playwright/test';

export class AdminDashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly postInternshipButton: Locator;
  readonly modalTitleInput: Locator;
  readonly modalCompanyInput: Locator;
  readonly modalDescriptionInput: Locator;
  readonly modalLocationInput: Locator;
  readonly modalStipendInput: Locator;
  readonly modalDurationInput: Locator;
  readonly modalSkillsInput: Locator;
  readonly modalSubmitButton: Locator;
  readonly modalCloseButton: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').first();
    this.postInternshipButton = page.locator('button', { hasText: /post internship|add internship/i }).first();
    this.modalTitleInput = page.locator('input[placeholder*="Title" i], input[placeholder*="Role" i], input[name="title"]').first();
    this.modalCompanyInput = page.locator('input[placeholder*="Company" i], input[name="company"]').first();
    this.modalDescriptionInput = page.locator('textarea').first();
    this.modalLocationInput = page.locator('input[placeholder*="Location" i]').first();
    this.modalStipendInput = page.locator('input[type="number"]').first();
    this.modalDurationInput = page.locator('input[type="number"]').nth(1);
    this.modalSkillsInput = page.locator('input[placeholder*="Skills" i], input[placeholder*="Python" i]').first();
    this.modalSubmitButton = page.locator('button', { hasText: /publish|create internship|submit posting/i }).first();
    this.modalCloseButton = page.locator('button[aria-label="Close modal"], button:has-text("Cancel")').first();
    this.logoutButton = page.locator('button', { hasText: /logout/i });
  }

  async goto() {
    await this.page.goto('/admin');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async logout() {
    const { safeLogout } = await import('../navigation-helper');
    await safeLogout(this.page);
  }
}
