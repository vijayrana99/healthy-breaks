# Add Three New Break Types Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Hand & Wrist Break, Mental Reset, and Deep Breathing break types to the Healthy Breaks extension while maintaining full backward compatibility with existing users.

**Architecture:** Add three new break type definitions to both background.js (BREAK_TYPES) and popup.js (BREAK_CONFIG + ICONS). The existing alarm and state management logic will automatically handle new break types. Storage migration will be handled gracefully by checking for missing break types on startup.

**Tech Stack:** Vanilla JavaScript, Chrome Extension Manifest V3, Chrome Storage API, Lucide SVG icons

---

## Task 1: Update BREAK_TYPES in background.js

**Files:**
- Modify: `src/background.js:1-26`

**Step 1: Add three new break type definitions**

Add after the `posture` break type (around line 25):

```javascript
const BREAK_TYPES = {
  eye: {
    name: 'Eye Break',
    icon: '👁️',
    defaultInterval: 20,
    description: '20-20-20 Rule: Every 20 mins, look 20ft away for 20s'
  },
  water: {
    name: 'Water Break',
    icon: '💧',
    defaultInterval: 60,
    description: 'Stay hydrated! Drink water every hour'
  },
  walk: {
    name: 'Walk Break',
    icon: '🚶',
    defaultInterval: 60,
    description: 'Walk and stretch every hour'
  },
  posture: {
    name: 'Posture Check',
    icon: '🧘',
    defaultInterval: 30,
    description: 'Check and correct your posture'
  },
  hand: {
    name: 'Hand & Wrist Break',
    icon: '✋',
    defaultInterval: 30,
    description: 'Shake out hands, stretch fingers, and gently stretch wrists to prevent RSI'
  },
  mental: {
    name: 'Mental Reset',
    icon: '🧠',
    defaultInterval: 90,
    description: '5 minutes of mental disengagement - stare out window, close eyes, meditate'
  },
  breathing: {
    name: 'Deep Breathing',
    icon: '🌬️',
    defaultInterval: 60,
    description: '60 seconds of deep diaphragmatic breathing to lower stress and increase oxygen'
  }
};
```

**Step 2: Verify the file syntax is correct**

Run: `node --check src/background.js`
Expected: No output (success) or specific syntax error if any

**Step 3: Commit**

```bash
git add src/background.js
git commit -m "feat: add three new break types to BREAK_TYPES

- Hand & Wrist Break (30 min) - RSI prevention
- Mental Reset (90 min) - cognitive break  
- Deep Breathing (60 min) - stress reduction"
```

---

## Task 2: Update BREAK_CONFIG and ICONS in popup.js

**Files:**
- Modify: `src/popup.js:1-26` (BREAK_CONFIG)
- Modify: `src/popup.js:28-36` (ICONS object)

**Step 1: Add three new break configs**

Replace the BREAK_CONFIG object (lines 1-26):

```javascript
const BREAK_CONFIG = {
  eye: {
    name: 'Eye Break',
    icon: 'eye',
    defaultInterval: 20,
    color: '#92400e' // amber-800
  },
  water: {
    name: 'Water Break',
    icon: 'droplets',
    defaultInterval: 60,
    color: '#3b82f6' // blue-500
  },
  walk: {
    name: 'Walk Break',
    icon: 'footprints',
    defaultInterval: 60,
    color: '#4b5563' // gray-600
  },
  posture: {
    name: 'Posture Check',
    icon: 'activity',
    defaultInterval: 30,
    color: '#8b5cf6' // violet-500
  },
  hand: {
    name: 'Hand & Wrist Break',
    icon: 'hand',
    defaultInterval: 30,
    color: '#f97316' // orange-500
  },
  mental: {
    name: 'Mental Reset',
    icon: 'brain',
    defaultInterval: 90,
    color: '#06b6d4' // cyan-500
  },
  breathing: {
    name: 'Deep Breathing',
    icon: 'wind',
    defaultInterval: 60,
    color: '#10b981' // emerald-500
  }
};
```

**Step 2: Add three new Lucide SVG icons**

Replace the ICONS object (after adding new icons, around line 53):

```javascript
// Lucide icon SVGs
const ICONS = {
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  droplets: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97"/></svg>`,
  footprints: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 13 3.8 13 8c0 1.25-.38 2.2-1 3.24-.64 1.08-.95 1.75-.95 2.6V16"/><path d="M20 16v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 2 11 3.8 11 8c0 1.25.38 2.2 1 3.24.64 1.08.95 1.75.95 2.6V16"/><path d="M16 20h6"/><path d="M2 20h6"/></svg>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
  hand: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  brain: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>`,
  wind: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></svg>`,
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
  chevronUp: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>`
};
```

**Step 3: Verify the file syntax**

Run: `node --check src/popup.js`
Expected: No output (success)

**Step 4: Commit**

```bash
git add src/popup.js
git commit -m "feat: add UI config and icons for three new break types

- Hand icon (orange) for Hand & Wrist Break
- Brain icon (cyan) for Mental Reset  
- Wind icon (emerald) for Deep Breathing
- Lucide SVG icons for consistent design"
```

---

## Task 3: Handle Storage Migration for Existing Users

**Files:**
- Modify: `src/background.js:28-48` (onInstalled listener)
- Modify: `src/background.js:166-204` (restoreAlarms function)

**Step 1: Update onInstalled listener to handle new break types**

Replace the onInstalled listener (lines 28-48):

```javascript
// Initialize storage with defaults (all disabled)
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get('breaks');
  const initialBreaks = existing.breaks || {};
  
  // Add any missing break types (handles updates for existing users)
  Object.keys(BREAK_TYPES).forEach(key => {
    if (!initialBreaks[key]) {
      initialBreaks[key] = {
        enabled: false,
        interval: BREAK_TYPES[key].defaultInterval,
        status: 'paused',
        snoozeUntil: null,
        lastTriggered: null,
        waitingSince: null
      };
    }
  });
  
  await chrome.storage.local.set({ 
    breaks: initialBreaks,
    masterInterval: null
  });
});
```

**Step 2: Update restoreAlarms to handle missing break types gracefully**

Replace the restoreAlarms function (lines 166-204):

```javascript
async function restoreAlarms() {
  const data = await chrome.storage.local.get('breaks');
  if (!data.breaks) return;
  
  for (const [breakType, breakData] of Object.entries(data.breaks)) {
    // Skip if break type no longer exists (defensive)
    if (!BREAK_TYPES[breakType]) continue;
    
    if (!breakData.enabled) continue;
    
    if (breakData.status === 'waiting') {
      // Still waiting for user action - notification should still be there
      // Re-show notification in case it was lost
      await handleBreakTrigger(breakType);
    } else if (breakData.status === 'snooze-pending' && breakData.snoozeUntil && breakData.snoozeUntil > Date.now()) {
      // Still in snooze period - resume countdown
      const remainingMinutes = Math.ceil((breakData.snoozeUntil - Date.now()) / (60 * 1000));
      chrome.alarms.create(`snooze-${breakType}`, {
        delayInMinutes: remainingMinutes
      });
    } else if (breakData.status === 'snooze-pending' && breakData.snoozeUntil && breakData.snoozeUntil <= Date.now()) {
      // Snooze expired while browser was closed - show notification
      await handleBreakTrigger(breakType);
    } else if (breakData.status === 'active') {
      // Check if we missed any triggers
      const lastTrigger = breakData.lastTriggered || Date.now();
      const elapsed = Date.now() - lastTrigger;
      const intervalMs = breakData.interval * 60 * 1000;
      
      if (elapsed >= intervalMs) {
        // Missed trigger - go to waiting state
        await handleBreakTrigger(breakType);
      } else {
        // Set alarm for remaining time
        const remainingMinutes = Math.ceil((intervalMs - elapsed) / (60 * 1000));
        chrome.alarms.create(`break-${breakType}`, {
          delayInMinutes: remainingMinutes
        });
      }
    }
  }
}
```

**Step 3: Verify the updated file**

Run: `node --check src/background.js`
Expected: No syntax errors

**Step 4: Commit**

```bash
git add src/background.js
git commit -m "feat: handle storage migration for new break types

- onInstalled now adds missing break types for existing users
- restoreAlarms skips unknown break types defensively
- Maintains backward compatibility with existing user data"
```

---

## Task 4: Regenerate Tailwind CSS for New Colors

**Files:**
- Modify: `src/tailwind.min.css` (regenerated)

**Step 1: Regenerate Tailwind CSS**

The new break types use colors that may not be in the current Tailwind build:
- orange-500 (#f97316)
- cyan-500 (#06b6d4)
- emerald-500 (#10b981)

Run: `npx tailwindcss -i ./src/input.css -o ./src/tailwind.min.css --minify`
Expected: Successfully compiled CSS file

**Step 2: Verify the CSS file was updated**

Run: `ls -la src/tailwind.min.css`
Expected: Recent timestamp and file size > 0

**Step 3: Commit**

```bash
git add src/tailwind.min.css
git commit -m "chore: regenerate Tailwind CSS for new break type colors

Includes orange-500, cyan-500, and emerald-500 for new break types"
```

---

## Task 5: Update Manifest Description

**Files:**
- Modify: `manifest.json:4`

**Step 1: Update the description**

Change line 4 from:
```json
"description": "Privacy-first health reminders for eye, water, walk, and posture breaks",
```

To:
```json
"description": "Privacy-first health reminders for eye, water, walk, posture, hand, mental, and breathing breaks",
```

**Step 2: Commit**

```bash
git add manifest.json
git commit -m "docs: update manifest description to include new break types"
```

---

## Task 6: Run Tests to Verify Everything Works

**Files:**
- Read: `tests/healthy-breaks.spec.js` (to understand test structure)

**Step 1: Run the Playwright tests**

Run: `npm test`
Expected: All 6 tests should pass

**Step 2: If tests fail, check what broke**

Common issues:
- Missing break type in test expectations
- UI selectors changed
- Storage migration issues

**Step 3: Commit if tests pass**

```bash
git commit -m "test: verify all existing tests pass with new break types"
```

---

## Task 7: Manual Testing Checklist

Before considering complete, manually verify:

1. **Fresh Install Test:**
   - Load extension in Chrome
   - Open popup
   - Verify all 7 break types appear (eye, water, walk, posture, hand, mental, breathing)
   - Verify each has correct icon and color

2. **Enable/Disable Test:**
   - Enable Hand & Wrist Break with 1-minute interval
   - Close popup, wait for notification
   - Verify notification shows correct title and description
   - Click Done, verify timer resets

3. **Update Test (Existing Users):**
   - Simulate old storage: Clear extension storage, set only 4 original breaks
   - Reload extension
   - Verify new breaks appear (disabled by default)
   - Verify original breaks retain their settings

4. **Visual Test:**
   - Check all icons render correctly
   - Check colors look good
   - Verify layout works with 7 breaks (scrollable if needed)

---

## Summary of Changes

**Files Modified:**
1. `src/background.js` - Added 3 break types, updated migration logic
2. `src/popup.js` - Added 3 break configs and 3 Lucide icons
3. `src/tailwind.min.css` - Regenerated for new colors
4. `manifest.json` - Updated description

**Break Types Added:**
| Type | Interval | Color | Icon |
|------|----------|-------|------|
| Hand & Wrist | 30 min | Orange | Hand |
| Mental Reset | 90 min | Cyan | Brain |
| Deep Breathing | 60 min | Emerald | Wind |

**Backward Compatibility:** ✅ Existing users will get new break types on next update (disabled by default)

---

## Verification Commands

```bash
# Check syntax
node --check src/background.js
node --check src/popup.js

# Run tests
npm test

# Check git status
git log --oneline -10
git status
```
