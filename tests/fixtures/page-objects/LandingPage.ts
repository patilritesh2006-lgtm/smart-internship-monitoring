import { type Page, type Locator, expect } from '@playwright/test';

export class LandingPage {
  readonly page: Page;
  readonly logo: Locator;
  readonly signInLink: Locator;
  readonly getStartedButton: Locator;
  readonly heroHeading: Locator;
  readonly mobileMenuButton: Locator;
  readonly overviewNavLink: Locator;
  readonly programsNavLink: Locator;
  readonly partnersNavLink: Locator;
  readonly intelligenceNavLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('nav a[href="/"]').first();
    this.signInLink = page.getByRole('link', { name: 'Sign In', exact: true });
    this.getStartedButton = page.getByRole('link', { name: 'Get Started' });
    this.heroHeading = page.locator('h1').first();
    this.mobileMenuButton = page.getByLabel(/toggle menu/i);
    this.overviewNavLink = page.getByRole('link', { name: 'Overview', exact: true });
    this.programsNavLink = page.getByRole('link', { name: 'Programs', exact: true });
    this.partnersNavLink = page.getByRole('link', { name: 'Partners', exact: true });
    this.intelligenceNavLink = page.getByRole('link', { name: 'Intelligence', exact: true });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickSignIn() {
    await this.signInLink.click();
    await this.page.waitForURL('**/login');
  }

  async clickGetStarted() {
    await this.getStartedButton.click();
    await this.page.waitForURL('**/login');
  }
}
