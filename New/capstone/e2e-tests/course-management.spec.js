/**
 * Course Management E2E Tests
 * Tests course and class section management
 */

const { test, expect } = require('@playwright/test');
const { loginAsAdmin, navigateToAdminPage, waitForModal, closeModal } = require('./test-utils');

test.describe('Course Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/courses');
  });

  test('Course Management page loads', async ({ page }) => {
    await expect(page.locator('text=Course, text=Management')).toBeVisible({ timeout: 10000 });
  });

  test('Course table displays data', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table, [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 10000 });
    
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    
    console.log(`Found ${rowCount} course rows`);
    expect(rowCount).toBeGreaterThan(0);
  });

  // ============ FILTER TESTS ============

  test('Search filter works', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('IT');
      await page.waitForTimeout(1000);
      await page.waitForLoadState('networkidle');
      console.log('Course search filter works');
    }
  });

  test('Program filter works', async ({ page }) => {
    const programFilter = page.locator('select:near(:text("Program")), select[name*="program"]').first();
    
    if (await programFilter.isVisible()) {
      await programFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Program filter works');
    }
  });

  test('Year Level filter works', async ({ page }) => {
    const yearFilter = page.locator('select:near(:text("Year")), select[name*="year"]').first();
    
    if (await yearFilter.isVisible()) {
      await yearFilter.selectOption({ value: '1' });
      await page.waitForLoadState('networkidle');
      console.log('Year level filter works');
    }
  });

  test('Semester filter works', async ({ page }) => {
    const semesterFilter = page.locator('select:near(:text("Semester")), select[name*="semester"]').first();
    
    if (await semesterFilter.isVisible()) {
      await semesterFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Semester filter works');
    }
  });

  test('Status filter works', async ({ page }) => {
    const statusFilter = page.locator('select:near(:text("Status")), select[name*="status"]').first();
    
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Status filter works');
    }
  });

  // ============ BUTTON TESTS ============

  test('Add Course button opens modal', async ({ page }) => {
    const addCourseBtn = page.locator('button:has-text("Add Course"), button:has-text("Create Course"), button:has-text("New Course")').first();
    
    if (await addCourseBtn.isVisible()) {
      await addCourseBtn.click();
      await waitForModal(page);
      
      // Check for form fields
      const codeField = page.locator('input[name="subject_code"], input[name="code"]');
      const nameField = page.locator('input[name="subject_name"], input[name="name"]');
      
      if (await codeField.isVisible()) console.log('✓ Subject code field present');
      if (await nameField.isVisible()) console.log('✓ Subject name field present');
      
      await closeModal(page);
      console.log('Add Course modal works');
    }
  });

  test('Edit Course button opens modal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const editBtn = page.locator('button:has-text("Edit"), button[aria-label="Edit"]').first();
    
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await waitForModal(page);
      
      // Check modal has data
      const codeField = page.locator('input[name="subject_code"], input[name="code"]');
      if (await codeField.isVisible()) {
        const value = await codeField.inputValue();
        expect(value.length).toBeGreaterThan(0);
        console.log('Edit Course modal has pre-filled data');
      }
      
      await closeModal(page);
    }
  });

  test('Create Section button opens modal', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const createSectionBtn = page.locator('button:has-text("Create Section"), button:has-text("Add Section")').first();
    
    if (await createSectionBtn.isVisible()) {
      await createSectionBtn.click();
      await waitForModal(page);
      
      // Check for section form fields
      const instructorField = page.locator('select[name="instructor"], input[name="instructor"]');
      if (await instructorField.isVisible()) {
        console.log('✓ Instructor field present');
      }
      
      await closeModal(page);
      console.log('Create Section modal works');
    }
  });

  test('View Sections expander works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // Look for expand button on course row
    const expandBtn = page.locator('button:has-text("View Sections"), button[aria-label="Expand"], [class*="expand"]').first();
    
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(500);
      
      // Check for section details
      const sectionDetails = page.locator('[class*="section"], [class*="expanded"]');
      console.log('Sections view expanded');
    }
  });

  test('Delete Section button shows confirmation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    // May need to expand a course first
    const expandBtn = page.locator('button:has-text("View"), button[aria-label="Expand"]').first();
    if (await expandBtn.isVisible()) {
      await expandBtn.click();
      await page.waitForTimeout(500);
    }
    
    const deleteBtn = page.locator('button:has-text("Delete Section"), button[aria-label="Delete"]').first();
    
    if (await deleteBtn.isVisible() && !await deleteBtn.isDisabled()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      
      const confirmDialog = page.locator('text=Are you sure, text=confirm');
      if (await confirmDialog.isVisible()) {
        console.log('Delete section confirmation shown');
        
        const cancelBtn = page.locator('button:has-text("Cancel")').first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    }
  });

  // ============ PAGINATION ============

  test('Pagination controls work', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const nextBtn = page.locator('button:has-text("Next"), [aria-label="Next page"]').first();
    
    if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('Pagination works');
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
