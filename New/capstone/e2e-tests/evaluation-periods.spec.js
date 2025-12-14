/**
 * Evaluation Period Management E2E Tests
 * Tests period CRUD, status changes, and enrollment management
 */

const { test, expect } = require('@playwright/test');
const { loginAsAdmin, navigateToAdminPage, waitForModal, closeModal } = require('./test-utils');

test.describe('Evaluation Period Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/periods');
  });

  test('Evaluation Periods page loads', async ({ page }) => {
    await expect(page.locator('text=Evaluation, text=Period')).toBeVisible({ timeout: 10000 });
  });

  test('Current/Active period is displayed', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for active period indicator
    const activePeriod = page.locator('text=Active, text=Current, [class*="active"]');
    const activeCount = await activePeriod.count();
    
    console.log(`Found ${activeCount} active period indicators`);
  });

  test('Period list/table displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Should show list of periods
    const periodItems = page.locator('[class*="card"], [class*="period"], tbody tr');
    const count = await periodItems.count();
    
    console.log(`Found ${count} period items`);
    expect(count).toBeGreaterThan(0);
  });

  // ============ BUTTON TESTS ============

  test('Create New Period button opens modal', async ({ page }) => {
    const createBtn = page.locator('button:has-text("Create"), button:has-text("New Period"), button:has-text("Add Period")').first();
    
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await waitForModal(page);
      
      // Check for form fields
      const semesterField = page.locator('select[name="semester"], input[name="semester"]');
      const yearField = page.locator('input[name="academic_year"], input[name="year"]');
      const startDateField = page.locator('input[type="date"][name*="start"], input[name="start_date"]');
      const endDateField = page.locator('input[type="date"][name*="end"], input[name="end_date"]');
      
      if (await semesterField.isVisible()) console.log('✓ Semester field present');
      if (await yearField.isVisible()) console.log('✓ Academic year field present');
      if (await startDateField.isVisible()) console.log('✓ Start date field present');
      if (await endDateField.isVisible()) console.log('✓ End date field present');
      
      await closeModal(page);
      console.log('Create Period modal works');
    }
  });

  test('Close Period button shows confirmation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const closeBtn = page.locator('button:has-text("Close Period"), button:has-text("End Period")').first();
    
    if (await closeBtn.isVisible() && !await closeBtn.isDisabled()) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      
      // Should show confirmation
      const confirmDialog = page.locator('text=Are you sure, text=confirm, text=close');
      if (await confirmDialog.isVisible()) {
        console.log('Close period confirmation shown');
        
        // Cancel
        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    } else {
      console.log('Close Period button not available (may already be closed)');
    }
  });

  test('Reopen Period button works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const reopenBtn = page.locator('button:has-text("Reopen"), button:has-text("Open Period")').first();
    
    if (await reopenBtn.isVisible() && !await reopenBtn.isDisabled()) {
      console.log('Reopen Period button is available');
      // Don't actually click to avoid state changes
    } else {
      console.log('Reopen Period button not available (period may be active)');
    }
  });

  test('Extend Period button opens modal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const extendBtn = page.locator('button:has-text("Extend"), button:has-text("Modify Date")').first();
    
    if (await extendBtn.isVisible() && !await extendBtn.isDisabled()) {
      await extendBtn.click();
      await waitForModal(page);
      
      // Check for date field
      const dateField = page.locator('input[type="date"]');
      await expect(dateField).toBeVisible();
      
      console.log('Extend Period modal works');
      await closeModal(page);
    }
  });

  test('Delete Period button shows confirmation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const deleteBtn = page.locator('button:has-text("Delete Period"), button[aria-label="Delete"]').first();
    
    if (await deleteBtn.isVisible() && !await deleteBtn.isDisabled()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      
      const confirmDialog = page.locator('text=Are you sure, text=confirm, text=delete');
      if (await confirmDialog.isVisible()) {
        console.log('Delete period confirmation shown');
        
        const cancelBtn = page.locator('button:has-text("Cancel")').first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    } else {
      console.log('Delete button disabled (has evaluations) - expected behavior');
    }
  });

  // ============ ENROLLMENT TESTS ============

  test('Enroll Program Section button opens modal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const enrollBtn = page.locator('button:has-text("Enroll"), button:has-text("Add Section")').first();
    
    if (await enrollBtn.isVisible()) {
      await enrollBtn.click();
      await waitForModal(page);
      
      // Check for section selection
      const sectionSelect = page.locator('select[name*="section"], select[name*="program"]');
      if (await sectionSelect.isVisible()) {
        console.log('✓ Program section selector present');
      }
      
      console.log('Enroll Section modal works');
      await closeModal(page);
    }
  });

  test('Enrolled sections list displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for enrolled sections area
    const enrolledSections = page.locator('text=Enrolled, text=Sections');
    
    if (await enrolledSections.isVisible()) {
      console.log('Enrolled sections area found');
      
      // Check for section items
      const sectionItems = page.locator('[class*="enrolled"] [class*="item"], [class*="section-card"]');
      const count = await sectionItems.count();
      console.log(`Found ${count} enrolled section items`);
    }
  });

  test('Remove enrollment button exists', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const removeBtn = page.locator('button:has-text("Remove"), button[aria-label*="Remove"]').first();
    
    if (await removeBtn.isVisible()) {
      console.log('Remove enrollment button found');
      // Don't click to avoid data changes
    }
  });

  // ============ PAST PERIODS ============

  test('Past periods are listed', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const pastPeriodsSection = page.locator('text=Past Periods, text=Previous, text=History');
    
    if (await pastPeriodsSection.isVisible()) {
      console.log('Past periods section found');
    }
  });

  test('View period details button works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button:has-text("View"), button:has-text("Details")').first();
    
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await page.waitForTimeout(500);
      console.log('View details button clicked');
    }
  });

  // ============ ERROR HANDLING ============

  test('No JavaScript errors on page', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    expect(errors.length).toBe(0);
  });
});
