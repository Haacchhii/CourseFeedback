/**
 * Test Utilities and Helper Functions
 * Shared across all E2E tests
 */

const { expect } = require('@playwright/test');

// Admin credentials - matches the system admin account
const ADMIN_CREDENTIALS = {
  email: 'admin@lpubatangas.edu.ph',
  password: 'changeme123'
};

/**
 * Login as admin user
 */
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Fill login form - the email field accepts the placeholder text
  const emailInput = page.locator('input[placeholder*="lpubatangas.edu.ph"]').first();
  await emailInput.fill(ADMIN_CREDENTIALS.email);
  
  // Password field
  const passwordInput = page.locator('input[placeholder*="password"]').first();
  await passwordInput.fill(ADMIN_CREDENTIALS.password);
  
  // Click login button - looks for "Sign In to Dashboard" text
  await page.click('button:has-text("Sign In to Dashboard")');
  
  // Wait for navigation to admin area
  await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
  
  return page;
}

/**
 * Navigate to admin page
 */
async function navigateToAdminPage(page, path) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  return page;
}

/**
 * Wait for modal to open
 */
async function waitForModal(page, timeout = 5000) {
  await page.waitForSelector('[role="dialog"], .modal, [class*="modal"]', { timeout });
}

/**
 * Close modal
 */
async function closeModal(page) {
  // Try different close methods
  const closeButton = page.locator('button:has-text("Cancel"), button:has-text("Close"), [aria-label="Close"]').first();
  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Press Escape
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(500);
}

/**
 * Check for error toast/alert
 */
async function checkNoErrors(page) {
  const errorIndicators = await page.locator('.error, .toast-error, [class*="error"]').count();
  return errorIndicators === 0;
}

/**
 * Get all buttons on the page
 */
async function getAllButtons(page) {
  return page.locator('button').all();
}

/**
 * Get all clickable elements
 */
async function getClickableElements(page) {
  return page.locator('button, a[href], [role="button"], [onclick]').all();
}

/**
 * Test button is clickable and doesn't error
 */
async function testButtonClick(page, buttonLocator, options = {}) {
  const { expectModal = false, expectNavigation = false } = options;
  
  const button = page.locator(buttonLocator).first();
  
  if (!await button.isVisible()) {
    return { success: false, reason: 'Button not visible' };
  }
  
  if (await button.isDisabled()) {
    return { success: true, reason: 'Button is disabled (expected behavior)' };
  }
  
  const currentUrl = page.url();
  
  try {
    await button.click();
    await page.waitForTimeout(500);
    
    if (expectModal) {
      await waitForModal(page, 3000);
      await closeModal(page);
    }
    
    if (expectNavigation) {
      await page.waitForURL((url) => url.toString() !== currentUrl, { timeout: 5000 });
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, reason: error.message };
  }
}

/**
 * Fill form with test data
 */
async function fillForm(page, formData) {
  for (const [selector, value] of Object.entries(formData)) {
    const field = page.locator(selector).first();
    if (await field.isVisible()) {
      const tagName = await field.evaluate(el => el.tagName.toLowerCase());
      
      if (tagName === 'select') {
        await field.selectOption(value);
      } else if (tagName === 'input') {
        const type = await field.getAttribute('type');
        if (type === 'checkbox') {
          if (value) await field.check();
          else await field.uncheck();
        } else {
          await field.fill(value);
        }
      } else {
        await field.fill(value);
      }
    }
  }
}

module.exports = {
  ADMIN_CREDENTIALS,
  loginAsAdmin,
  navigateToAdminPage,
  waitForModal,
  closeModal,
  checkNoErrors,
  getAllButtons,
  getClickableElements,
  testButtonClick,
  fillForm
};
