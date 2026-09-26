import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly togglePasswordButton: Locator;
  readonly rememberMeCheckbox: Locator;
  readonly forgotPasswordButton: Locator;
  readonly registerLink: Locator;
  readonly errorBanner: Locator;
  readonly infoBanner: Locator;
  readonly studentPersonaCard: Locator;
  readonly mentorPersonaCard: Locator;
  readonly adminPersonaCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[placeholder="••••••••••••"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.togglePasswordButton = page.locator('button[aria-label*="password"]');
    this.rememberMeCheckbox = page.locator('input[type="checkbox"]');
    this.forgotPasswordButton = page.getByRole('button', { name: /forgot password/i });
    this.registerLink = page.getByRole('link', { name: /register here/i });
    this.errorBanner = page.locator('div.rounded-2xl.bg-rose-50');
    this.infoBanner = page.locator('.bg-blue-50');
    this.studentPersonaCard = page.locator('button', { hasText: 'Rohan Patil' });
    this.mentorPersonaCard = page.locator('button', { hasText: 'Dr. Alan Turing' });
    this.adminPersonaCard = page.locator('button', { hasText: 'Dean of Engineering' });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }

  async quickLoginAs(persona: 'student' | 'mentor' | 'admin') {
    if (persona === 'student') await this.studentPersonaCard.click();
    else if (persona === 'mentor') await this.mentorPersonaCard.click();
    else if (persona === 'admin') await this.adminPersonaCard.click();
  }
}
