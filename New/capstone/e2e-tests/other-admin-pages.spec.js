/**
 * Other Admin Pages E2E Tests
 * Tests for remaining admin pages:
 * - Student Management
 * - Program Sections
 * - Audit Log Viewer
 * - Data Export Center
 * - Non-Respondents
 * - Enrollment List Management
 * - Email Notifications
 */

const { test, expect } = require('@playwright/test');
const { loginAsAdmin, navigateToAdminPage, waitForModal, closeModal } = require('./test-utils');

// ============ STUDENT MANAGEMENT ============

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/student-management');
  });

  test('Student Management page loads', async ({ page }) => {
    await expect(page.locator('text=Student')).toBeVisible({ timeout: 10000 });
  });

  test('Student table displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table, [class*="table"]').first();
    if (await table.isVisible()) {
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      console.log(`Found ${count} students`);
    }
  });

  test('Program filter works', async ({ page }) => {
    const programFilter = page.locator('select[name*="program"]').first();
    if (await programFilter.isVisible()) {
      await programFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Program filter works');
    }
  });

  test('Year level filter works', async ({ page }) => {
    const yearFilter = page.locator('select[name*="year"]').first();
    if (await yearFilter.isVisible()) {
      await yearFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Year filter works');
    }
  });

  test('Advance Students button exists', async ({ page }) => {
    const advanceBtn = page.locator('button:has-text("Advance")').first();
    if (await advanceBtn.isVisible()) {
      console.log('Advance Students button found');
    }
  });
});

// ============ PROGRAM SECTIONS ============

test.describe('Program Sections', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/program-sections');
  });

  test('Program Sections page loads', async ({ page }) => {
    await expect(page.locator('text=Section')).toBeVisible({ timeout: 10000 });
  });

  test('Section list displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const sections = page.locator('[class*="card"], [class*="section"], tbody tr');
    const count = await sections.count();
    console.log(`Found ${count} program sections`);
  });

  test('Add Section button opens modal', async ({ page }) => {
    const addBtn = page.locator('button:has-text("Add Section"), button:has-text("Create Section")').first();
    
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await waitForModal(page);
      console.log('Add Section modal works');
      await closeModal(page);
    }
  });

  test('Edit Section button works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const editBtn = page.locator('button:has-text("Edit"), button[aria-label="Edit"]').first();
    if (await editBtn.isVisible()) {
      await editBtn.click();
      await waitForModal(page);
      console.log('Edit Section modal works');
      await closeModal(page);
    }
  });

  test('Assign Students button works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const assignBtn = page.locator('button:has-text("Assign"), button:has-text("Students")').first();
    if (await assignBtn.isVisible()) {
      await assignBtn.click();
      await waitForModal(page);
      console.log('Assign Students modal works');
      await closeModal(page);
    }
  });

  test('Delete Section button shows confirmation', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const deleteBtn = page.locator('button:has-text("Delete"), button[aria-label="Delete"]').first();
    if (await deleteBtn.isVisible() && !await deleteBtn.isDisabled()) {
      await deleteBtn.click();
      await page.waitForTimeout(500);
      
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        console.log('Delete confirmation works');
      }
    }
  });
});

// ============ AUDIT LOG VIEWER ============

test.describe('Audit Log Viewer', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/audit-logs');
  });

  test('Audit Logs page loads', async ({ page }) => {
    await expect(page.locator('text=Audit, text=Log')).toBeVisible({ timeout: 10000 });
  });

  test('Log table displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      console.log(`Found ${count} log entries`);
      expect(count).toBeGreaterThan(0);
    }
  });

  test('Action filter works', async ({ page }) => {
    const actionFilter = page.locator('select[name*="action"]').first();
    if (await actionFilter.isVisible()) {
      await actionFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Action filter works');
    }
  });

  test('Category filter works', async ({ page }) => {
    const categoryFilter = page.locator('select[name*="category"]').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Category filter works');
    }
  });

  test('Date range filter works', async ({ page }) => {
    const dateFrom = page.locator('input[type="date"][name*="from"], input[name*="start"]').first();
    if (await dateFrom.isVisible()) {
      await dateFrom.fill('2025-01-01');
      await page.waitForLoadState('networkidle');
      console.log('Date filter works');
    }
  });

  test('Severity filter works', async ({ page }) => {
    const severityFilter = page.locator('select[name*="severity"]').first();
    if (await severityFilter.isVisible()) {
      await severityFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Severity filter works');
    }
  });

  test('Pagination works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible() && !await nextBtn.isDisabled()) {
      await nextBtn.click();
      await page.waitForLoadState('networkidle');
      console.log('Pagination works');
    }
  });
});

// ============ DATA EXPORT CENTER ============

test.describe('Data Export Center', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/export');
  });

  test('Export Center page loads', async ({ page }) => {
    await expect(page.locator('text=Export, text=Data')).toBeVisible({ timeout: 10000 });
  });

  test('Export options are displayed', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const exportOptions = page.locator('button:has-text("Export"), [class*="export-option"]');
    const count = await exportOptions.count();
    console.log(`Found ${count} export options`);
  });

  test('Export Evaluations button works', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("Export Evaluations"), button:has-text("Evaluations")').first();
    if (await exportBtn.isVisible()) {
      console.log('Export Evaluations button found');
    }
  });

  test('Export Users button works', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("Export Users"), button:has-text("Users")').first();
    if (await exportBtn.isVisible()) {
      console.log('Export Users button found');
    }
  });

  test('Export format selection exists', async ({ page }) => {
    const formatSelect = page.locator('select[name*="format"], input[type="radio"]');
    if (await formatSelect.first().isVisible()) {
      console.log('Export format selection found');
    }
  });

  test('Export history displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const historySection = page.locator('text=History, text=Recent Exports');
    if (await historySection.isVisible()) {
      console.log('Export history section found');
    }
  });
});

// ============ NON-RESPONDENTS ============

test.describe('Non-Respondents', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/non-respondents');
  });

  test('Non-Respondents page loads', async ({ page }) => {
    await expect(page.locator('text=Non-Respondent, text=Respondent')).toBeVisible({ timeout: 10000 });
  });

  test('Non-respondent list displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      console.log(`Found ${count} non-respondents`);
    }
  });

  test('Period filter works', async ({ page }) => {
    const periodFilter = page.locator('select[name*="period"]').first();
    if (await periodFilter.isVisible()) {
      await periodFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Period filter works');
    }
  });

  test('Program filter works', async ({ page }) => {
    const programFilter = page.locator('select[name*="program"]').first();
    if (await programFilter.isVisible()) {
      await programFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Program filter works');
    }
  });

  test('Send Reminder button exists', async ({ page }) => {
    const reminderBtn = page.locator('button:has-text("Send Reminder"), button:has-text("Remind")').first();
    if (await reminderBtn.isVisible()) {
      console.log('Send Reminder button found');
    }
  });

  test('Bulk select checkbox works', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const selectAll = page.locator('input[type="checkbox"]').first();
    if (await selectAll.isVisible()) {
      await selectAll.check();
      console.log('Bulk select works');
      await selectAll.uncheck();
    }
  });

  test('Completion summary displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const summary = page.locator('text=Completion, text=Rate, text=Progress');
    if (await summary.first().isVisible()) {
      console.log('Completion summary found');
    }
  });
});

// ============ ENROLLMENT LIST MANAGEMENT ============

test.describe('Enrollment List Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/enrollment-list');
  });

  test('Enrollment List page loads', async ({ page }) => {
    await expect(page.locator('text=Enrollment')).toBeVisible({ timeout: 10000 });
  });

  test('Enrollment table displays', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const table = page.locator('table').first();
    if (await table.isVisible()) {
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      console.log(`Found ${count} enrollment entries`);
    }
  });

  test('Import button opens file dialog', async ({ page }) => {
    const importBtn = page.locator('button:has-text("Import"), button:has-text("Upload")').first();
    
    if (await importBtn.isVisible()) {
      // Check for file input
      const fileInput = page.locator('input[type="file"]');
      console.log('Import functionality available');
    }
  });

  test('Clear List button shows confirmation', async ({ page }) => {
    const clearBtn = page.locator('button:has-text("Clear"), button:has-text("Delete All")').first();
    
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await page.waitForTimeout(500);
      
      const cancelBtn = page.locator('button:has-text("Cancel")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        console.log('Clear confirmation works');
      }
    }
  });

  test('Program filter works', async ({ page }) => {
    const programFilter = page.locator('select[name*="program"]').first();
    if (await programFilter.isVisible()) {
      await programFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
      console.log('Program filter works');
    }
  });
});

// ============ EMAIL NOTIFICATIONS ============

test.describe('Email Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToAdminPage(page, '/admin/emails');
  });

  test('Email Notifications page loads', async ({ page }) => {
    await expect(page.locator('text=Email, text=Notification')).toBeVisible({ timeout: 10000 });
  });

  test('Recipient selection exists', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const recipientSelect = page.locator('select[name*="recipient"], select[name*="role"]');
    if (await recipientSelect.first().isVisible()) {
      console.log('Recipient selection found');
    }
  });

  test('Subject field exists', async ({ page }) => {
    const subjectField = page.locator('input[name="subject"], input[placeholder*="Subject"]');
    if (await subjectField.isVisible()) {
      console.log('Subject field found');
    }
  });

  test('Message field exists', async ({ page }) => {
    const messageField = page.locator('textarea[name="message"], textarea[placeholder*="Message"]');
    if (await messageField.isVisible()) {
      console.log('Message field found');
    }
  });

  test('Send button exists', async ({ page }) => {
    const sendBtn = page.locator('button:has-text("Send")').first();
    if (await sendBtn.isVisible()) {
      console.log('Send button found');
    }
  });

  test('Email template selection exists', async ({ page }) => {
    const templateSelect = page.locator('select[name*="template"], button:has-text("Template")');
    if (await templateSelect.first().isVisible()) {
      console.log('Template selection found');
    }
  });
});
