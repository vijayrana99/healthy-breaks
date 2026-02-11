const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test.describe('Healthy Breaks Extension - Validation', () => {
  test('should validate manifest.json structure', async () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifestContent = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    
    // Validate manifest version
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe('Healthy Breaks');
    expect(manifest.version).toBe('1.0.0');
    
    // Validate permissions
    expect(manifest.permissions).toContain('alarms');
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('notifications');
    
    // Validate background script
    expect(manifest.background.service_worker).toBe('src/background.js');
    
    // Validate popup
    expect(manifest.action.default_popup).toBe('src/popup.html');
    
    console.log('✓ Manifest validation passed');
  });

  test('should validate background.js exists and contains required functions', async () => {
    const backgroundPath = path.join(__dirname, '..', 'src', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    // Check for required components
    expect(backgroundContent).toContain('BREAK_TYPES');
    expect(backgroundContent).toContain('chrome.alarms.onAlarm.addListener');
    expect(backgroundContent).toContain('chrome.runtime.onMessage.addListener');
    expect(backgroundContent).toContain('chrome.storage.local');
    expect(backgroundContent).toContain('handleBreakTrigger');
    expect(backgroundContent).toContain('toggleBreak');
    expect(backgroundContent).toContain('snoozeBreak');
    expect(backgroundContent).toContain('resetAll');
    expect(backgroundContent).toContain('setMasterInterval');
    
    console.log('✓ Background script validation passed');
  });

  test('should validate popup.html structure', async () => {
    const popupPath = path.join(__dirname, '..', 'src', 'popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    // Check for required elements
    expect(popupContent).toContain('id="breaks-list"');
    
    // Check for iOS design elements
    expect(popupContent).toContain('background-color: #f2f2f7'); // iOS background color
    expect(popupContent).toContain('ios-toggle');
    
    // Check for local Inter font
    expect(popupContent).toContain("fonts/Inter-Regular.ttf");
    expect(popupContent).toContain("fonts/Inter-Bold.ttf");
    
    // Check for styling libraries (local files for CSP compliance)
    expect(popupContent).toContain('tailwind.min.css');
    
    // Check for Master Controls elements (removed interval input and apply button)
    expect(popupContent).toContain('id="reset-all"');
    expect(popupContent).toContain('id="snooze-all"');
    expect(popupContent).toContain('id="pause-all"');
    expect(popupContent).toContain('Master Controls');
    
    console.log('✓ Popup HTML validation passed');
  });

  test('should validate popup.js logic', async () => {
    const popupJsPath = path.join(__dirname, '..', 'src', 'popup.js');
    const popupJsContent = fs.readFileSync(popupJsPath, 'utf8');
    
    // Check for required functions
    expect(popupJsContent).toContain('BREAK_CONFIG');
    expect(popupJsContent).toContain('getBreaksData');
    expect(popupJsContent).toContain('renderBreaksList');
    expect(popupJsContent).toContain('toggleBreak');
    expect(popupJsContent).toContain('updateInterval');
    expect(popupJsContent).toContain('resetTimer');
    expect(popupJsContent).toContain('snoozeBreak');
    expect(popupJsContent).toContain('pauseBreak');
    expect(popupJsContent).toContain('updateCountdowns');
    
    // Check for iOS design elements
    expect(popupJsContent).toContain('ICONS');
    expect(popupJsContent).toContain('ios-toggle');
    expect(popupJsContent).toContain('expandedBreakId');
    expect(popupJsContent).toContain('toggleExpand');
    
    // Check for Master Controls (removed setMasterInterval)
    expect(popupJsContent).toContain('setupMasterOverride');
    expect(popupJsContent).toContain('resetAll');
    expect(popupJsContent).toContain('snoozeAll');
    expect(popupJsContent).toContain('pauseAll');
    
    // Check for compact card styling
    expect(popupJsContent).toContain('p-2 flex items-center');
    expect(popupJsContent).toContain('text-sm font-bold text-gray-900');
    
    // Check for all 4 break types
    expect(popupJsContent).toContain('eye');
    expect(popupJsContent).toContain('water');
    expect(popupJsContent).toContain('walk');
    expect(popupJsContent).toContain('posture');
    
    console.log('✓ Popup JavaScript validation passed');
  });

  test('should validate break configurations', async () => {
    const backgroundPath = path.join(__dirname, '..', 'src', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    // Validate default intervals
    expect(backgroundContent).toContain('Eye Break');
    expect(backgroundContent).toContain('Water Break');
    expect(backgroundContent).toContain('Walk Break');
    expect(backgroundContent).toContain('Posture Check');
    
    // Check default intervals
    expect(backgroundContent).toContain('defaultInterval: 20'); // Eye
    expect(backgroundContent).toContain('defaultInterval: 60'); // Water & Walk
    expect(backgroundContent).toContain('defaultInterval: 30'); // Posture
    
    // Check that all breaks start disabled
    expect(backgroundContent).toContain("enabled: false");
    
    console.log('✓ Break configuration validation passed');
  });

  test('should validate Eye Break alarm functionality', async () => {
    const backgroundPath = path.join(__dirname, '..', 'src', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    // Check Eye Break specific implementation (uses template literals like `break-${breakType}`)
    expect(backgroundContent).toContain('break-');
    expect(backgroundContent).toContain('notification-');
    expect(backgroundContent).toContain('chrome.notifications.create');
    expect(backgroundContent).toContain('handleBreakTrigger');
    expect(backgroundContent).toContain('chrome.alarms.create');
    
    // Check alarm restoration on startup
    expect(backgroundContent).toContain('chrome.runtime.onStartup');
    expect(backgroundContent).toContain('restoreAlarms');
    
    console.log('✓ Eye Break alarm validation passed');
  });

  test('should calculate remaining time from lastTriggered not alarm', async () => {
    const popupPath = path.join(__dirname, '..', 'src', 'popup.js');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    // Verify popup calculates remaining time from lastTriggered (exact) not alarm (rounded)
    expect(popupContent).toContain('data.lastTriggered');
    expect(popupContent).toContain('intervalMs = data.interval * 60 * 1000');
    expect(popupContent).toContain('data.lastTriggered + intervalMs');
    expect(popupContent).toContain('Calculate remaining time from storage (exact) instead of alarm (rounded)');
    
    // Verify it does NOT use alarm.scheduledTime for active breaks anymore
    const activeBreakSection = popupContent.substring(
      popupContent.indexOf('// Calculate remaining time from storage'),
      popupContent.indexOf('} else {', popupContent.indexOf('// Calculate remaining time from storage')) + 20
    );
    expect(activeBreakSection).toContain('lastTriggered');
    expect(activeBreakSection).not.toContain('alarm.scheduledTime');
    
    console.log('✓ lastTriggered calculation validation passed');
  });

  test('should validate pause functionality stores exact remaining time', async () => {
    const backgroundPath = path.join(__dirname, '..', 'src', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    // Verify pauseBreak stores exact remaining milliseconds
    expect(backgroundContent).toContain('pausedRemainingMs = remainingMs');
    expect(backgroundContent).toContain('pausedAt = Date.now()');
    
    // Verify pauseBreak uses lastTriggered for consistency with popup display
    expect(backgroundContent).toContain('lastTriggered + intervalMs');
    expect(backgroundContent).toContain('Use lastTriggered + interval (same as popup display)');
    
    console.log('✓ Pause exact time storage validation passed');
  });

  test('should validate resume functionality restores exact time', async () => {
    const backgroundPath = path.join(__dirname, '..', 'src', 'background.js');
    const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
    
    // Verify resumeBreak uses pausedRemainingMs for hard pause
    expect(backgroundContent).toContain('pausedRemainingMs');
    expect(backgroundContent).toContain('const remainingMs = (typeof pausedRemainingMs === \'number\' && pausedRemainingMs > 0)');
    
    // Verify resumeBreak sets lastTriggered correctly for exact time display
    expect(backgroundContent).toContain('Date.now() - elapsedMs');
    
    console.log('✓ Resume exact time restoration validation passed');
  });

  test('should validate formatTimeWithUnit uses Math.floor for accuracy', async () => {
    const popupPath = path.join(__dirname, '..', 'src', 'popup.js');
    const popupContent = fs.readFileSync(popupPath, 'utf8');
    
    // Verify formatTimeWithUnit uses Math.floor (not Math.ceil) for precise display
    const formatFunction = popupContent.substring(
      popupContent.indexOf('function formatTimeWithUnit(ms)'),
      popupContent.indexOf('}', popupContent.indexOf('function formatTimeWithUnit(ms)')) + 1
    );
    expect(formatFunction).toContain('Math.floor(ms / 1000)');
    
    console.log('✓ formatTimeWithUnit accuracy validation passed');
  });
});