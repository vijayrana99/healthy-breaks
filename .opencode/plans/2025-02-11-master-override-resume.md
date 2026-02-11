# Fix Master Override Pause/Resume Toggle

## Problem
The Master Override "Pause" button pauses all running timers but doesn't provide a way to resume them. The button should toggle between "Pause" and "Resume" states.

## Solution
Implement a toggle mechanism where:
1. If any enabled break is active (not paused), show "Pause" button
2. If all enabled breaks are paused, show "Resume" button  
3. Clicking "Pause" pauses all active breaks
4. Clicking "Resume" resumes all paused breaks
5. The button icon changes between pause (two bars) and play (triangle) icons

## Implementation Plan

### Task 1: Add resumeAll function to background.js
**File:** `src/background.js`

Add a new `resumeAll()` function that resumes all paused breaks:
```javascript
async function resumeAll() {
  const data = await chrome.storage.local.get('breaks');
  for (const breakType of Object.keys(data.breaks)) {
    if (data.breaks[breakType].enabled && data.breaks[breakType].status === 'paused') {
      await resumeBreak(breakType);
    }
  }
}
```

Also add `resumeBreak()` helper if not exists (or reuse existing logic).

### Task 2: Add resumeAll message handler
**File:** `src/background.js`

Add case in the message handler switch statement:
```javascript
case 'resumeAll':
  await resumeAll();
  sendResponse({ success: true });
  break;
```

### Task 3: Update Master Override UI to support toggle
**File:** `src/popup.js`

Modify `setupMasterOverride()` function to:
1. Check the current state of all breaks
2. Update button text and icon based on state
3. Toggle between pauseAll and resumeAll actions

Add a new function to update the Master Override Pause button:
```javascript
async function updateMasterPauseButton() {
  const breaksData = await getBreaksData();
  const pauseAllBtn = document.getElementById('pause-all');
  
  // Check if any enabled break is active (not paused)
  const hasActiveBreaks = Object.entries(breaksData).some(([type, data]) => {
    return data.enabled && data.status !== 'paused';
  });
  
  if (hasActiveBreaks) {
    // Show Pause button
    pauseAllBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="6" y="4" width="4" height="16"/>
        <rect x="14" y="4" width="4" height="16"/>
      </svg>
      <span>Pause</span>
    `;
    pauseAllBtn.onclick = async () => {
      await chrome.runtime.sendMessage({ action: 'pauseAll' });
      await renderBreaksList();
      await updateMasterPauseButton();
    };
  } else {
    // Show Resume button
    pauseAllBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>Resume</span>
    `;
    pauseAllBtn.onclick = async () => {
      await chrome.runtime.sendMessage({ action: 'resumeAll' });
      await renderBreaksList();
      await updateMasterPauseButton();
    };
  }
}
```

### Task 4: Call updateMasterPauseButton on popup load and after state changes
**File:** `src/popup.js`

Call `updateMasterPauseButton()` in:
1. `DOMContentLoaded` event
2. After any action that changes break state (Reset All, Snooze All, etc.)

### Task 5: Update individual break pause buttons to sync Master Override
**File:** `src/popup.js`

When an individual break is paused/resumed, call `updateMasterPauseButton()` to sync the Master Override button state.

### Task 6: Test the implementation
- Test pausing all breaks via Master Override
- Verify button changes to "Resume" with play icon
- Test resuming all breaks
- Verify button changes back to "Pause" with pause icon
- Test mixing individual pause/resume with Master Override

## Files Modified
1. `src/background.js` - Add resumeAll function and message handler
2. `src/popup.js` - Add toggle logic and state management

## Backward Compatibility
✅ Existing functionality remains unchanged - only adds new resume capability

## Edge Cases Handled
- No enabled breaks (button state handled gracefully)
- Mix of paused and active breaks (shows Pause)
- All breaks paused (shows Resume)
