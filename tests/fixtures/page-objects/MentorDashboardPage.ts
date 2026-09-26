import { type Page, type Locator, expect } from '@playwright/test';

export class MentorDashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly logoutButton: Locator;
  readonly searchInput: Locator;
  readonly filterButtons: Locator;
  readonly internCards: Locator;
  readonly reviewReportButtons: Locator;
  readonly feedbackTextarea: Locator;
  readonly scoreInput: Locator;
  readonly submitReviewButton: Locator;
  readonly recordInterventionButtons: Locator;
  readonly interventionNotesTextarea: Locator;
  readonly submitInterventionButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').first();
    this.logoutButton = page.locator('button', { hasText: /logout/i });
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.filterButtons = page.locator('button:has-text("All"), button:has-text("Attention"), button:has-text("On Track")');
    this.internCards = page.locator('.sims-card, [class*="rounded-2xl border"]');
    this.reviewReportButtons = page.locator('button', { hasText: /review report|grade report|review/i });
    this.feedbackTextarea = page.locator('textarea');
    this.scoreInput = page.locator('input[type="number"]');
    this.submitReviewButton = page.locator('button', { hasText: /submit review|confirm review|save feedback/i });
    this.recordInterventionButtons = page.locator('button', { hasText: /record intervention|log intervention|intervention/i });
    this.interventionNotesTextarea = page.locator('textarea[placeholder*="intervention" i], textarea');
    this.submitInterventionButton = page.locator('button', { hasText: /save intervention|log intervention|submit/i });
  }

  async goto() {
    await this.page.goto('/mentor');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async logout() {
    const { safeLogout } = await import('../navigation-helper');
    await safeLogout(this.page);
  }
}
