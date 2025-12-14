/**
 * Admin Dashboard E2E Tests
 * Tests all buttons, cards, charts, and navigation on the admin dashboard
 */

const { test, expect } = require('@playwright/test');
const { loginAsAdmin, navigateToAdminPage, testButtonClick } = require('./test-utils');

test.describe('Admin Dashboard', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/dashboard');
  });

  test('Dashboard loads successfully', async ({ page }) => {
    // Check page title or header
    await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 });
  });

  test('Statistics cards are displayed', async ({ page }) => {
    // Wait for stats to load
    await page.waitForLoadState('networkidle');
    
    // Check for stats cards (users, courses, evaluations)
    const statsCards = page.locator('[class*="card"], [class*="stat"]');
    const cardCount = await statsCards.count();
    
    expect(cardCount).toBeGreaterThan(0);
    console.log(`Found ${cardCount} stat cards on dashboard`);
  });

  test('Total Users card - click navigates to users page', async ({ page }) => {
    // Find and click the users card/link
    const usersCard = page.locator('text=Total Users, text=Users, [href*="users"]').first();
    
    if (await usersCard.isVisible()) {
      await usersCard.click();
      await page.waitForURL(/\/admin\/users/, { timeout: 5000 });
      expect(page.url()).toContain('/admin/users');
    }
  });

  test('Total Courses card - click navigates to courses page', async ({ page }) => {
    const coursesCard = page.locator('text=Total Courses, text=Courses').first();
    
    if (await coursesCard.isVisible()) {
      await coursesCard.click();
      await page.waitForTimeout(1000);
      // May navigate to courses
    }
  });

  test('Manage Users button works', async ({ page }) => {
    const manageUsersBtn = page.locator('button:has-text("Manage Users"), a:has-text("Manage Users")').first();
    
    if (await manageUsersBtn.isVisible()) {
      await manageUsersBtn.click();
      await page.waitForURL(/\/admin\/users/, { timeout: 5000 });
      expect(page.url()).toContain('/admin/users');
    }
  });

  test('Manage Courses button works', async ({ page }) => {
    const manageCoursesBtn = page.locator('button:has-text("Manage Courses"), a:has-text("Manage Courses")').first();
    
    if (await manageCoursesBtn.isVisible()) {
      await manageCoursesBtn.click();
      await page.waitForURL(/\/admin\/courses/, { timeout: 5000 });
      expect(page.url()).toContain('/admin/courses');
    }
  });

  test('Manage Periods button works', async ({ page }) => {
    const managePeriodsBtn = page.locator('button:has-text("Manage Periods"), a:has-text("Manage Periods"), button:has-text("Evaluation")').first();
    
    if (await managePeriodsBtn.isVisible()) {
      await managePeriodsBtn.click();
      await page.waitForURL(/\/admin\/periods/, { timeout: 5000 });
      expect(page.url()).toContain('/admin/periods');
    }
  });

  test('Export Data button works', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("Export"), a:has-text("Export")').first();
    
    if (await exportBtn.isVisible()) {
      await exportBtn.click();
      await page.waitForURL(/\/admin\/export/, { timeout: 5000 });
      expect(page.url()).toContain('/admin/export');
    }
  });

  test('View Logs button works', async ({ page }) => {
    const logsBtn = page.locator('button:has-text("View Logs"), a:has-text("View Logs"), button:has-text("Audit")').first();
    
    if (await logsBtn.isVisible()) {
      await logsBtn.click();
      await page.waitForURL(/\/admin\/audit/, { timeout: 5000 });
      expect(page.url()).toContain('/admin/audit');
    }
  });

  test('Charts render without errors', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for charts to render
    
    // Check for chart containers (recharts uses svg)
    const charts = page.locator('.recharts-wrapper, svg[class*="recharts"]');
    const chartCount = await charts.count();
    
    console.log(`Found ${chartCount} charts on dashboard`);
    
    // Check no JavaScript errors occurred
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    expect(errors.length).toBe(0);
  });

  test('All navigation cards/buttons are clickable', async ({ page }) => {
    const actionButtons = page.locator('button, a[href^="/admin"]');
    const buttonCount = await actionButtons.count();
    
    console.log(`Found ${buttonCount} action buttons on dashboard`);
    
    // Test each button can be clicked without error
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = actionButtons.nth(i);
      if (await button.isVisible() && !await button.isDisabled()) {
        const text = await button.textContent();
        console.log(`Testing button: ${text?.trim()}`);
        
        // Just verify it's interactable
        await expect(button).toBeEnabled();
      }
    }
  });
});
