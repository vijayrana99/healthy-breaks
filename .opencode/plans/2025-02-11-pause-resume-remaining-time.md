# Fix Pause/Resume to Preserve Remaining Time

## Problem
When a break is paused and resumed, it currently restarts from the full interval instead of continuing from where it left off.

**Current behavior:**
- Timer at 16:50 → Pause → Resume → Timer resets to 20:00 ❌

**Desired behavior:**
- Timer at 16:50 → Pause → Resume → Timer continues from 16:50 ✅

## Solution
Store the remaining time when pausing, and use it when resuming. Time is "frozen" while paused - no time passes until user clicks resume.

## Implementation Plan

### Task 1: Update pauseBreak() to store remaining time
**File:** `src/background.js`

Modify the `pauseBreak()` function to:
1. Get the current alarm to calculate remaining time
2. Store remaining time in a new field `pausedRemainingMs`
3. Store pause timestamp `pausedAt` for reference

```javascript
async function pauseBreak(breakType) {
  const data = await chrome.storage.local.get('breaks');
  
  // Calculate remaining time before pausing
  const alarm = await chrome.alarms.get(`break-${breakType}`);
  let remainingMs = data.breaks[breakType].interval * 60 * 1000; // Default to full interval
  
  if (alarm && alarm.scheduledTime) {
    remainingMs = alarm.scheduledTime - Date.now();
  }
  
  data.breaks[breakType].status = 'paused';
  data.breaks[breakType].waitingSince = null;
  data.breaks[breakType].pausedRemainingMs = remainingMs; // Store remaining time
  data.breaks[breakType].pausedAt = Date.now(); // Store when paused
  await chrome.storage.local.set({ breaks: data.breaks });
  
  chrome.alarms.clear(`break-${breakType}`);
  chrome.alarms.clear(`snooze-${breakType}`);
}
```

### Task 2: Update resumeBreak() to use stored remaining time
**File:** `src/background.js`

Modify the `resumeBreak()` function to:
1. Check for `pausedRemainingMs` field
2. Use stored remaining time for the alarm (convert to minutes)
3. Clear the paused fields after resuming

```javascript
async function resumeBreak(breakType) {
  const data = await chrome.storage.local.get('breaks');
  if (!data.breaks[breakType].enabled || data.breaks[breakType].status !== 'paused') return;
  
  // Get stored remaining time or default to full interval
  const remainingMs = data.breaks[breakType].pausedRemainingMs || (data.breaks[breakType].interval * 60 * 1000);
  const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000))); // At least 1 minute
  
  data.breaks[breakType].status = 'active';
  data.breaks[breakType].lastTriggered = Date.now();
  data.breaks[breakType].pausedRemainingMs = null; // Clear stored time
  data.breaks[breakType].pausedAt = null; // Clear paused timestamp
  await chrome.storage.local.set({ breaks: data.breaks });
  
  chrome.alarms.create(`break-${breakType}`, {
    delayInMinutes: remainingMinutes
  });
}
```

### Task 3: Update restoreAlarms() to handle paused breaks with stored time
**File:** `src/background.js`

Modify the `restoreAlarms()` function to properly handle paused breaks when Chrome restarts:
- If break is paused, don't resume automatically
- Keep it paused until user explicitly clicks resume

No changes needed for this - the current logic already skips paused breaks during restore.

### Task 4: Update countdown display for paused breaks to show stored remaining time
**File:** `src/popup.js`

Modify the `updateCountdowns()` function to display the stored remaining time for paused breaks:

```javascript
if (data.status === 'paused') {
  // Show stored remaining time if available
  if (data.pausedRemainingMs && data.pausedRemainingMs > 0) {
    el.textContent = formatTimeWithUnit(data.pausedRemainingMs) + ' (Paused)';
  } else {
    el.textContent = 'Paused';
  }
  return;
}
```

### Task 5: Update onInstalled to add new fields to storage schema
**File:** `src/background.js`

Update the initialization logic to include the new fields (they'll be undefined for existing breaks, which is handled):

No explicit changes needed - JavaScript handles undefined gracefully.

### Task 6: Update individual break card pause button to show resume
**File:** `src/popup.js`

The individual break pause buttons already toggle between "Pause" and "Resume" text based on status. Need to verify they use the updated pauseBreak/resumeBreak functions properly.

Already implemented in previous commit - no changes needed.

### Task 7: Add resumeBreak message handler if not exists
**File:** `src/background.js`

Check if there's a `resumeBreak` message handler for individual breaks. If not, add it:

```javascript
case 'resumeBreak':
  await resumeBreak(request.breakType);
  sendResponse({ success: true });
  break;
```

### Task 8: Update popup.js pauseBreak to call resumeBreak when resuming
**File:** `src/popup.js`

Check if `pauseBreak()` function in popup.js properly toggles between pause and resume:

```javascript
async function pauseBreak(breakType) {
  const breaksData = await getBreaksData();
  const breakData = breaksData[breakType];
  
  if (breakData.status === 'paused') {
    // Resume
    await chrome.runtime.sendMessage({
      action: 'resumeBreak',
      breakType
    });
  } else {
    // Pause
    await chrome.runtime.sendMessage({
      action: 'pauseBreak',
      breakType
    });
  }
  await renderBreaksList();
  await updateMasterPauseButton();
}
```

### Task 9: Test all scenarios
1. **Individual break pause/resume:**
   - Enable a break with 20 min interval
   - Wait until 16:50 remaining
   - Click Pause → Status shows "Paused" with 16:50
   - Click Resume → Timer continues from 16:50

2. **Master Override pause/resume:**
   - Enable multiple breaks
   - Pause all via Master Override
   - Each break stores its remaining time
   - Resume all → Each continues from its paused time

3. **Browser restart while paused:**
   - Pause a break at 16:50
   - Close Chrome
   - Reopen Chrome
   - Break should still be paused at 16:50
   - Resume should continue from 16:50

4. **Edge cases:**
   - Pause at 0:30 (less than 1 minute) → Resume should set 1 minute minimum
   - Pause when alarm just fired (remaining = 0) → Resume should use full interval

## Files Modified
1. `src/background.js` - pauseBreak(), resumeBreak(), message handler
2. `src/popup.js` - updateCountdowns() display

## Backward Compatibility
✅ Existing paused breaks will work - they'll just resume from full interval (undefined remainingMs defaults to full interval)

## Data Schema Changes
Adding two new optional fields to break data:
- `pausedRemainingMs`: number (milliseconds remaining when paused)
- `pausedAt`: number (timestamp when paused, for reference)
