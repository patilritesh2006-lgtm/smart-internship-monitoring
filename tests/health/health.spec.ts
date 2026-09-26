import { test, expect } from '@playwright/test';

test.describe('A. Application Startup & Health Checks', () => {
  test('A1: Backend health check endpoint reports online status and healthy database', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:8000/health');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('connected');
    expect(body.intelligence_engine).toBe('online');
  });

  test('A2: Frontend home page responds with HTTP 200 and loads successfully', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(/EduIntern|Smart Internship|SIMMS/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('A3: No fatal unhandled JavaScript console errors occur during initial load', async ({ page }) => {
    const errorLogs: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore expected network warnings or favicon 404
        if (!text.includes('favicon') && !text.includes('404')) {
          errorLogs.push(text);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    expect(errorLogs).toEqual([]);
  });

  test('A4: Main navigation bar renders branding logo and primary call-to-actions', async ({ page }) => {
    await page.goto('/');
    const logo = page.locator('nav').first();
    await expect(logo).toBeVisible();

    // On mobile screens (<640px), "Sign in" is in the hamburger menu while "Get Started" is directly visible
    const signInLink = page.getByRole('link', { name: /sign in/i });
    if (!(await signInLink.first().isVisible())) {
      const menuBtn = page.getByRole('button', { name: /toggle navigation menu|menu/i });
      if (await menuBtn.isVisible()) {
        await menuBtn.click();
      }
    }
    await expect(signInLink.first()).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });

  test('A5: Essential SEO and meta elements are present in the HTML document', async ({ page }) => {
    await page.goto('/');
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toHaveAttribute('content', /width=device-width/i);
    const htmlTag = page.locator('html');
    await expect(htmlTag).toBeVisible();
  });
});
