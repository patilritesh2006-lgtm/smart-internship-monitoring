import { type Page, type Locator, expect } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly studentRoleButton: Locator;
  readonly mentorRoleButton: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly departmentInput: Locator;
  readonly rollNumberInput: Locator;
  readonly academicYearSelect: Locator;
  readonly designationInput: Locator;
  readonly employeeIdInput: Locator;
  readonly submitButton: Locator;
  readonly errorBanner: Locator;
  readonly signInLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.studentRoleButton = page.getByRole('button', { name: 'Student', exact: true });
    this.mentorRoleButton = page.getByRole('button', { name: 'Faculty Mentor', exact: true });
    this.fullNameInput = page.locator('input[placeholder="Jane Doe"]');
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.departmentInput = page.locator('input[placeholder*="Computer Science"]');
    this.rollNumberInput = page.locator('input[placeholder*="CS-2024"]');
    this.academicYearSelect = page.locator('select');
    this.designationInput = page.locator('input[placeholder*="Associate Professor"]');
    this.employeeIdInput = page.locator('input[placeholder*="EMP-CS"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorBanner = page.locator('.bg-red-50');
    this.signInLink = page.getByRole('link', { name: /sign in here/i });
  }

  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async registerStudent(data: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    rollNumber: string;
    academicYear: number;
  }) {
    await this.studentRoleButton.click();
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.departmentInput.fill(data.department);
    await this.rollNumberInput.fill(data.rollNumber);
    await this.academicYearSelect.selectOption(String(data.academicYear));
    await this.submitButton.click();
  }

  async registerMentor(data: {
    fullName: string;
    email: string;
    password: string;
    department: string;
    designation: string;
    employeeId: string;
  }) {
    await this.mentorRoleButton.click();
    await this.fullNameInput.fill(data.fullName);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.departmentInput.fill(data.department);
    await this.designationInput.fill(data.designation);
    await this.employeeIdInput.fill(data.employeeId);
    await this.submitButton.click();
  }
}
