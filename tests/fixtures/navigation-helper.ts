import { type Page, expect } from '@playwright/test';

/**
 * Checks if the screen width is mobile/tablet where the desktop sidebar is hidden.
 */
export async function isMobileViewport(page: Page): Promise<boolean> {
  return await page.evaluate(() => window.innerWidth < 1024);
}

/**
 * Opens the mobile slide-in navigation drawer if on a mobile/tablet viewport.
 */
export async function openMobileMenuIfNeeded(page: Page) {
  const isMobile = await isMobileViewport(page);
  if (!isMobile) return;

  const drawer = page.locator('.sims-sidebar.drawer-open');
  if (await drawer.isVisible()) {
    return;
  }

  const menuBtn = page.getByRole('button', { name: /open navigation menu/i });
  await menuBtn.waitFor({ state: 'visible', timeout: 10000 });
  await menuBtn.click();
  await drawer.waitFor({ state: 'visible', timeout: 8000 });
}

/**
 * Navigates to a student portal tab via mobile bottom nav or desktop sidebar.
 */
export async function navigateStudentTab(
  page: Page,
  tab: 'Dashboard' | 'Applications' | 'Timesheets' | 'Evaluations' | 'Messages'
) {
  const isMobile = await isMobileViewport(page);

  if (isMobile) {
    const tabPattern = {
      Dashboard: /home/i,
      Applications: /applications/i,
      Timesheets: /timesheet/i,
      Evaluations: /evaluations/i,
      Messages: /profile|messages/i,
    }[tab];

    // Check if bottom nav is rendered
    const bottomNav = page.locator('nav.bottom-nav');
    const hasBottomNav = await bottomNav.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);

    if (hasBottomNav) {
      const bottomNavBtn = bottomNav.locator('button', { hasText: tabPattern }).first();
      if (await bottomNavBtn.count() > 0) {
        await bottomNavBtn.click();
        return;
      }
    }

    // Otherwise open drawer and click sidebar item
    await openMobileMenuIfNeeded(page);
    const drawerItem = page.locator('.sims-sidebar.drawer-open').locator('button', { hasText: new RegExp(tab, 'i') }).first();
    await drawerItem.waitFor({ state: 'visible', timeout: 8000 });
    await drawerItem.click();
    return;
  }

  // Desktop sidebar navigation
  const sidebarItem = page.locator('aside button', { hasText: new RegExp(tab, 'i') }).first();
  await sidebarItem.waitFor({ state: 'visible', timeout: 8000 });
  await sidebarItem.click();
}

/**
 * Safely logs out on both mobile (drawer) and desktop (sidebar) viewports.
 */
export async function safeLogout(page: Page) {
  const isMobile = await isMobileViewport(page);
  if (isMobile) {
    await openMobileMenuIfNeeded(page);
    const logoutBtn = page.locator('.sims-sidebar.drawer-open').locator('button', { hasText: /logout/i }).first();
    await logoutBtn.waitFor({ state: 'visible', timeout: 8000 });
    await logoutBtn.click();
  } else {
    const logoutBtn = page.locator('aside').locator('button', { hasText: /logout/i }).first();
    await logoutBtn.waitFor({ state: 'visible', timeout: 8000 });
    await logoutBtn.click();
  }
  await page.waitForURL('**/login', { timeout: 10000 });
  await expect(page).toHaveURL(/.*\/login/);
}
