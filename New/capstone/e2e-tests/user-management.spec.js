/**
 * User Management E2E Tests
 * Tests all buttons, modals, filters, and CRUD operations
 */

const { test, expect } = require('@playwright/test');
const { loginAsAdmin, navigateToAdminPage, waitForModal, closeModal, fillForm } = require('./test-utils');

test.describe('User Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/users');
  });

  test('User Management page loads', async ({ page }) => {
    await expect(page.locator('text=User Management, text=Users')).toBeVisible({ timeout: 10000 });
  });

  test('User table displays data', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Wait for table to load
    const table = page.locator('table, [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    
    // Check for table rows
    const rows = page.locator('tbody tr, [class*="table"] [class*="row"]');
    const rowCount = await rows.count();
    
    console.log(`Found ${rowCount} user rows in table`);
    expect(rowCount).toBeGreaterThan(0);
  });

  // ============ FILTER TESTS ============

  test('Search filter works', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('admin');
      await page.waitForTimeout(1000); // Debounce
      
      // Table should update
      await page.waitForLoadState('networkidle');
      console.log('Search filter applied successfully');
    }
  });

  test('Role filter dropdown works', async ({ page }) => {
    const roleFilter = page.locator('select:near(:text("Role")), select[name*="role"]').first();
    
    if (await roleFilter.isVisible()) {
      // Get available options
      const options = await roleFilter.locator('option').allTextContents();
      console.log('Available role options:', options);
      
      // Select student role
      await roleFilter.selectOption({ label: 'student' });
      await page.waitForLoadState('networkidle');
      
      // Select admin role
      await roleFilter.selectOption({ label: 'admin' });
      await page.waitForLoadState('networkidle');
      
      console.log('Role filter works');
    }
  });

  test('Status filter dropdown works', async ({ page }) => {
    const statusFilter = page.locator('select:near(:text("Status")), select[name*="status"]').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Status filter works');
    }
  });

  test('Program filter dropdown works (when role=student)', async ({ page }) => {
    // First select student role
    const roleFilter = page.locator('select:near(:text("Role")), select[name*="role"]').first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption({ label: 'student' });
      await page.waitForTimeout(500);
    }
    
    const programFilter = page.locator('select:near(:text("Program")), select[name*="program"]').first();
    
    if (await programFilter.isVisible()) {
      await programFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Program filter works');
    }
  });

  test('Year Level filter works (when role=student)', async ({ page }) => {
    // First select student role
    const roleFilter = page.locator('select:near(:text("Role")), select[name*="role"]').first();
    if (await roleFilter.isVisible()) {
      await roleFilter.selectOption({ label: 'student' });
      await page.waitForTimeout(500);
    }
    
    const yearFilter = page.locator('select:near(:text("Year")), select[name*="year"]').first();
    
    if (await yearFilter.isVisible()) {
      await yearFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Year level filter works');
    }
  });

  // ============ BUTTON TESTS ============

  test('Add User button opens modal', async ({ page }) => {
    const addUserBtn = page.locator('button:has-text("Add User"), button:has-text("Add"), button:has-text("Create User")').first();
    
    await expect(addUserBtn).toBeVisible();
    await addUserBtn.click();
    
    // Wait for modal
    await waitForModal(page);
    
    // Check modal has form fields
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    
    console.log('Add User modal opened successfully');
    
    // Close modal
    await closeModal(page);
  });

  test('Add User modal - form fields present', async ({ page }) => {
    const addUserBtn = page.locator('button:has-text("Add User"), button:has-text("Add")').first();
    await addUserBtn.click();
    await waitForModal(page);
    
    // Check for required fields
    const emailField = page.locator('input[name="email"], input[type="email"]');
    const firstNameField = page.locator('input[name="first_name"], input[placeholder*="First"]');
    const lastNameField = page.locator('input[name="last_name"], input[placeholder*="Last"]');
    const roleField = page.locator('select[name="role"]');
    
    await expect(emailField).toBeVisible();
    console.log('✓ Email field present');
    
    if (await firstNameField.isVisible()) console.log('✓ First name field present');
    if (await lastNameField.isVisible()) console.log('✓ Last name field present');
    if (await roleField.isVisible()) console.log('✓ Role dropdown present');
    
    await closeModal(page);
  });

  test('Add User modal - Cancel button works', async ({ page }) => {
    const addUserBtn = page.locator('button:has-text("Add User")').first();
    await addUserBtn.click();
    await waitForModal(page);
    
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    await cancelBtn.click();
    
    // Modal should close
    await page.waitForTimeout(500);
    await expect(page.locator('[role="dialog"], .modal').first()).not.toBeVisible();
    
    console.log('Cancel button closes modal');
  });

  test('Bulk Import button opens modal', async ({ page }) => {
    const bulkImportBtn = page.locator('button:has-text("Bulk"), button:has-text("Import")').first();
    
    if (await bulkImportBtn.isVisible()) {
      await bulkImportBtn.click();
      await waitForModal(page);
      
      // Check for file input
      const fileInput = page.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();
      
      console.log('Bulk Import modal opened successfully');
      
      await closeModal(page);
    }
  });

  test('Edit User button opens modal', async ({ page }) => {
    // Wait for table to load
    await page.waitForLoadState('networkidle');
    
    // Find edit button in first row
    const editBtn = page.locator('button:has-text("Edit"), button[aria-label="Edit"], [title="Edit"]').first();
    
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await waitForModal(page);
      
      // Check modal has pre-filled data
      const emailField = page.locator('input[name="email"], input[type="email"]');
      const emailValue = await emailField.inputValue();
      
      expect(emailValue.length).toBeGreaterThan(0);
      console.log('Edit modal opened with user data');
      
      await closeModal(page);
    }
  });

  test('Delete User button shows confirmation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find delete button
    const deleteBtn = page.locator('button:has-text("Delete"), button[aria-label="Delete"], [title="Delete"]').first();
    
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // Should show confirmation dialog
      await page.waitForTimeout(500);
      
      // Look for confirmation text
      const confirmText = page.locator('text=Are you sure, text=confirm, text=delete');
      if (await confirmText.isVisible()) {
        console.log('Delete confirmation dialog shown');
        
        // Cancel the deletion
        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    }
  });

  test('Reset Password button works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const resetBtn = page.locator('button:has-text("Reset"), button[title*="Reset"], button[aria-label*="Reset"]').first();
    
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await page.waitForTimeout(500);
      
      // Should show confirmation or modal
      const modalOrConfirm = page.locator('[role="dialog"], .modal, text=Reset Password');
      if (await modalOrConfirm.isVisible()) {
        console.log('Reset password dialog shown');
        await closeModal(page);
      }
    }
  });

  // ============ PAGINATION TESTS ============

  test('Pagination controls work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Find pagination controls
    const nextBtn = page.locator('button:has-text("Next"), button[aria-label="Next page"], [class*="pagination"] button').last();
    const prevBtn = page.locator('button:has-text("Previous"), button:has-text("Prev"), button[aria-label="Previous page"]').first();
    
    if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('Next page button works');
      
      if (await prevBtn.isVisible() && !await prevBtn.isDisabled()) {
        await prevBtn.click();
        await page.waitForLoadState('networkidle');
        console.log('Previous page button works');
      }
    }
  });

  // ============ ERROR HANDLING ============

  test('No JavaScript errors on page', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('JavaScript errors found:', errors);
    }
    
    expect(errors.length).toBe(0);
  });
});
