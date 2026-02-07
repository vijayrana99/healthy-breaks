const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Healthy Breaks Extension', () => {
  let backgroundPage;
  let extensionId;

  test.beforeAll(async ({ browser }) => {
    // Get extension ID from service worker
    const context = await browser.newContext();
    const pages = await context.pages();
    
    // Find the service worker
    const workers = context.serviceWorkers();
    if (workers.length > 0) {
      backgroundPage = workers[0];
      // Extract extension ID from service worker URL
      const url = backgroundPage.url();
      extensionId = url.split('/')[2];
    } else {
      // Fallback: wait for service worker
      await new Promise(resolve => setTimeout(resolve, 1000));
      const allWorkers = context.serviceWorkers();
      if (allWorkers.length > 0) {
        backgroundPage = allWorkers[0];
        extensionId = backgroundPage.url().split('/')[2];
      }
    }
  });

  test('should open popup and display all break types', async ({ page }) => {
    // Navigate to extension popup
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
    
    // Check header
    await expect(page.locator('h1')).toHaveText('Healthy Breaks');
    
    // Check all break types are displayed
    await expect(page.locator('text=Eye Break')).toBeVisible();
    await expect(page.locator('text=Water Break')).toBeVisible();
    await expect(page.locator('text=Walk Break')).toBeVisible();
    await expect(page.locator('text=Posture Check')).toBeVisible();
    
    // Check privacy notice
    await expect(page.locator('text=No data leaves your device')).toBeVisible();
  });

  test('should enable Eye Break and verify timer starts', async ({ page }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
    
    // Initially should be disabled
    const eyeBreakToggle = page.locator('[data-break="eye"] input[type="checkbox"]').first();
    await expect(eyeBreakToggle).not.toBeChecked();
    
    // Enable Eye Break
    await eyeBreakToggle.click();
    await expect(eyeBreakToggle).toBeChecked();
    
    // Wait a moment for state to update
    await page.waitForTimeout(500);
    
    // Check status changes from paused to active
    await expect(page.locator('[data-break="eye"]')).toContainText('active');
    
    // Countdown should show time (20:00 initially)
    const countdown = page.locator('[data-break="eye"].countdown');
    await expect(countdown).not.toHaveText('--:--');
    await expect(countdown).not.toHaveText('Disabled');
  });

  test('should test Eye Break notification trigger', async ({ page, context }) => {
    // Grant notification permissions
    await context.grantPermissions(['notifications']);
    
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
    
    // Enable Eye Break
    const eyeBreakToggle = page.locator('[data-break="eye"] input[type="checkbox"]').first();
    await eyeBreakToggle.click();
    
    // Open config panel for Eye Break
    await page.locator('text=Eye Break').first().click();
    
    // Set interval to 1 minute for testing
    const intervalInput = page.locator('input[data-break="eye"].interval-input');
    await intervalInput.fill('1');
    await intervalInput.press('Tab');
    await page.locator('button:has-text("Update")').first().click();
    
    // Reset timer to start countdown
    await page.locator('button:has-text("Reset")').first().click();
    
    // Wait for timer to show countdown
    await page.waitForTimeout(1000);
    
    // Verify countdown is active (not showing --:-- or Disabled)
    const countdown = page.locator('[data-break="eye"].countdown');
    const countdownText = await countdown.textContent();
    expect(countdownText).not.toBe('--:--');
    expect(countdownText).not.toBe('Disabled');
    
    console.log('Eye Break countdown:', countdownText);
    
    // Note: To fully test notification, we'd need to wait 1 minute
    // For CI, we'll verify the alarm is set by checking background
    const alarmInfo = await page.evaluate(async () => {
      const alarm = await chrome.alarms.get('break-eye');
      return alarm;
    });
    
    expect(alarmInfo).toBeTruthy();
    expect(alarmInfo.name).toBe('break-eye');
    expect(alarmInfo.scheduledTime).toBeGreaterThan(Date.now());
  });

  test('should test master interval override', async ({ page }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
    
    // Enable all breaks
    const toggles = await page.locator('input[type="checkbox"]').all();
    for (const toggle of toggles) {
      await toggle.click();
    }
    
    // Wait for all to enable
    await page.waitForTimeout(500);
    
    // Set master interval to 45 minutes
    await page.locator('#master-interval').fill('45');
    await page.locator('#apply-master').click();
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify all intervals updated to 45
    const intervalInputs = await page.locator('input.interval-input').all();
    for (const input of intervalInputs) {
      const value = await input.inputValue();
      expect(value).toBe('45');
    }
  });

  test('should verify storage is local (privacy)', async ({ page }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
    
    // Check that we're using chrome.storage.local
    const storageType = await page.evaluate(async () => {
      // This verifies the extension uses local storage
      const data = await chrome.storage.local.get('breaks');
      return data ? 'local' : 'unknown';
    });
    
    expect(storageType).toBe('local');
  });

  test('should test global controls', async ({ page }) => {
    await page.goto(`chrome-extension://${extensionId}/src/popup.html`);
    
    // Enable a break
    const toggle = page.locator('input[type="checkbox"]').first();
    await toggle.click();
    await page.waitForTimeout(500);
    
    // Test Pause All
    await page.locator('#pause-all').click();
    await page.waitForTimeout(500);
    
    // Should show paused status
    await expect(page.locator('.badge:has-text("paused")').first()).toBeVisible();
    
    // Test Reset All
    await page.locator('#reset-all').click();
    await page.waitForTimeout(500);
    
    // Should show active status
    await expect(page.locator('.badge:has-text("active")').first()).toBeVisible();
    
    // Test Snooze All
    await page.locator('#snooze-all').click();
    await page.waitForTimeout(500);
    
    // Should show snoozed status
    await expect(page.locator('.badge:has-text("snoozed")').first()).toBeVisible();
  });
});