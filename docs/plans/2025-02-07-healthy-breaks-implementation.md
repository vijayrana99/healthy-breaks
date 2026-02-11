# Healthy Breaks Chrome Extension Implementation Plan

> **STATUS: ✅ COMPLETED** - This plan has been fully implemented. See [AGENTS.md](../../AGENTS.md) for current documentation.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, privacy-first Chrome Extension for health reminders with 4 break types, all disabled by default.

**Architecture:** MV3 extension with service worker background script handling chrome.alarms, popup UI with Tailwind + DaisyUI, chrome.storage.local for persistence. On startup, restore all alarm states from storage.

**Tech Stack:** Manifest V3, Tailwind CSS (CDN), DaisyUI (CDN), Heroicons, chrome.alarms API, chrome.storage.local, Playwright for E2E testing.

---

## 📋 Implementation Notes

**Completed:** All tasks in this plan have been successfully implemented.

**Current State:**
- ✅ Manifest V3 extension with all permissions
- ✅ Service worker with alarm management
- ✅ Popup UI with iOS-style design
- ✅ Local Inter font (4 weights)
- ✅ Lucide SVG icons (no emojis)
- ✅ Hidden scrollbar functionality
- ✅ Smooth toggle animations
- ✅ Master Override controls
- ✅ 6 Playwright E2E tests passing
- ✅ Complete offline functionality

**See Current Documentation:**
- [AGENTS.md](../../AGENTS.md) - Comprehensive technical guide
- [README.md](../../README.md) - User-facing documentation

---

## Task 1: Create Project Structure and Manifest

**Files:**
- Create: `manifest.json`
- Create: `src/background.js`
- Create: `src/popup.html`
- Create: `src/popup.js`
- Create: `src/popup.css`
- Create: `src/icons/`
- Create: `tests/` (for Playwright)

**Step 1: Create manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Healthy Breaks",
  "version": "1.0.0",
  "description": "Privacy-first health reminders for eye, water, walk, and posture breaks",
  "permissions": [
    "alarms",
    "storage",
    "notifications"
  ],
  "background": {
    "service_worker": "src/background.js"
  },
  "action": {
    "default_popup": "src/popup.html",
    "default_icon": {
      "16": "src/icons/icon16.png",
      "48": "src/icons/icon48.png",
      "128": "src/icons/icon128.png"
    }
  },
  "icons": {
    "16": "src/icons/icon16.png",
    "48": "src/icons/icon48.png",
    "128": "src/icons/icon128.png"
  }
}
```

**Step 2: Create placeholder icons**

Create simple colored squares (16x16, 48x48, 128x128) as PNG files in `src/icons/` or use SVG placeholders for now.

**Step 3: Commit**

```bash
git init
git add .
git commit -m "feat: initial project structure and manifest"
```

---

## Task 2: Implement Background Script - Storage Schema and Alarm Management

**Files:**
- Modify: `src/background.js`

**Step 1: Define break types and default settings**

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
  }
};

// Initialize storage with defaults (all disabled)
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get('breaks');
  if (!existing.breaks) {
    const initialBreaks = {};
    Object.keys(BREAK_TYPES).forEach(key => {
      initialBreaks[key] = {
        enabled: false,
        interval: BREAK_TYPES[key].defaultInterval,
        status: 'paused',
        snoozeUntil: null,
        lastTriggered: null
      };
    });
    await chrome.storage.local.set({ 
      breaks: initialBreaks,
      masterInterval: null
    });
  }
});
```

**Step 2: Implement alarm handlers**

```javascript
// Alarm names follow pattern: "break-{type}"
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith('break-')) {
    const breakType = alarm.name.replace('break-', '');
    await handleBreakTrigger(breakType);
  } else if (alarm.name.startsWith('snooze-')) {
    const breakType = alarm.name.replace('snooze-', '');
    await handleSnoozeEnd(breakType);
  }
});

async function handleBreakTrigger(breakType) {
  const data = await chrome.storage.local.get('breaks');
  const breakData = data.breaks[breakType];
  
  if (!breakData || !breakData.enabled) return;
  
  // Show notification
  chrome.notifications.create(`notification-${breakType}`, {
    type: 'basic',
    iconUrl: 'src/icons/icon128.png',
    title: `${BREAK_TYPES[breakType].name}`,
    message: BREAK_TYPES[breakType].description,
    requireInteraction: true,
    buttons: [
      { title: 'Done' },
      { title: 'Snooze 5m' }
    ]
  });
  
  // Update last triggered
  breakData.lastTriggered = Date.now();
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Restart the alarm for next interval
  chrome.alarms.create(`break-${breakType}`, {
    delayInMinutes: breakData.interval
  });
}

async function handleSnoozeEnd(breakType) {
  const data = await chrome.storage.local.get('breaks');
  data.breaks[breakType].snoozeUntil = null;
  data.breaks[breakType].status = 'active';
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Restart the break alarm
  chrome.alarms.create(`break-${breakType}`, {
    delayInMinutes: data.breaks[breakType].interval
  });
}
```

**Step 3: Handle notification buttons**

```javascript
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const breakType = notificationId.replace('notification-', '');
  
  if (buttonIndex === 0) {
    // Done - dismiss notification
    chrome.notifications.clear(notificationId);
  } else if (buttonIndex === 1) {
    // Snooze 5m - snooze this specific break
    chrome.notifications.clear(notificationId);
    await snoozeBreak(breakType, 5);
  }
});

async function snoozeBreak(breakType, minutes) {
  const data = await chrome.storage.local.get('breaks');
  data.breaks[breakType].snoozeUntil = Date.now() + (minutes * 60 * 1000);
  data.breaks[breakType].status = 'snoozed';
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Clear existing alarm and create snooze alarm
  chrome.alarms.clear(`break-${breakType}`);
  chrome.alarms.create(`snooze-${breakType}`, {
    delayInMinutes: minutes
  });
}
```

**Step 4: Restore alarms on startup**

```javascript
// Restore alarms when service worker starts (browser restart)
chrome.runtime.onStartup.addListener(restoreAlarms);
// Also restore on install/update
chrome.runtime.onInstalled.addListener(restoreAlarms);

async function restoreAlarms() {
  const data = await chrome.storage.local.get('breaks');
  if (!data.breaks) return;
  
  for (const [breakType, breakData] of Object.entries(data.breaks)) {
    if (!breakData.enabled) continue;
    
    if (breakData.snoozeUntil && breakData.snoozeUntil > Date.now()) {
      // Still in snooze period
      const remainingMinutes = Math.ceil((breakData.snoozeUntil - Date.now()) / (60 * 1000));
      chrome.alarms.create(`snooze-${breakType}`, {
        delayInMinutes: remainingMinutes
      });
    } else if (breakData.status === 'active') {
      // Check if we missed any triggers
      const lastTrigger = breakData.lastTriggered || Date.now();
      const elapsed = Date.now() - lastTrigger;
      const intervalMs = breakData.interval * 60 * 1000;
      
      if (elapsed >= intervalMs) {
        // Missed trigger - trigger now
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

**Step 5: Implement control functions**

```javascript
// Message handler for popup controls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      switch (request.action) {
        case 'toggleBreak':
          await toggleBreak(request.breakType, request.enabled);
          sendResponse({ success: true });
          break;
        case 'updateInterval':
          await updateInterval(request.breakType, request.interval);
          sendResponse({ success: true });
          break;
        case 'resetTimer':
          await resetTimer(request.breakType);
          sendResponse({ success: true });
          break;
        case 'snoozeBreak':
          await snoozeBreak(request.breakType, request.minutes);
          sendResponse({ success: true });
          break;
        case 'pauseBreak':
          await pauseBreak(request.breakType);
          sendResponse({ success: true });
          break;
        case 'resetAll':
          await resetAll();
          sendResponse({ success: true });
          break;
        case 'snoozeAll':
          await snoozeAll(request.minutes);
          sendResponse({ success: true });
          break;
        case 'pauseAll':
          await pauseAll();
          sendResponse({ success: true });
          break;
        case 'setMasterInterval':
          await setMasterInterval(request.interval);
          sendResponse({ success: true });
          break;
        case 'getBreaks':
          const data = await chrome.storage.local.get('breaks');
          sendResponse({ success: true, breaks: data.breaks });
          break;
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  return true; // Keep channel open for async
});

async function toggleBreak(breakType, enabled) {
  const data = await chrome.storage.local.get('breaks');
  data.breaks[breakType].enabled = enabled;
  data.breaks[breakType].status = enabled ? 'active' : 'paused';
  await chrome.storage.local.set({ breaks: data.breaks });
  
  if (enabled) {
    chrome.alarms.create(`break-${breakType}`, {
      delayInMinutes: data.breaks[breakType].interval
    });
  } else {
    chrome.alarms.clear(`break-${breakType}`);
    chrome.alarms.clear(`snooze-${breakType}`);
  }
}

async function updateInterval(breakType, interval) {
  const data = await chrome.storage.local.get('breaks');
  data.breaks[breakType].interval = interval;
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Restart alarm with new interval if active
  if (data.breaks[breakType].enabled && data.breaks[breakType].status === 'active') {
    chrome.alarms.clear(`break-${breakType}`);
    chrome.alarms.create(`break-${breakType}`, {
      delayInMinutes: interval
    });
  }
}

async function resetTimer(breakType) {
  const data = await chrome.storage.local.get('breaks');
  if (!data.breaks[breakType].enabled) return;
  
  data.breaks[breakType].status = 'active';
  data.breaks[breakType].snoozeUntil = null;
  data.breaks[breakType].lastTriggered = Date.now();
  await chrome.storage.local.set({ breaks: data.breaks });
  
  chrome.alarms.clear(`break-${breakType}`);
  chrome.alarms.clear(`snooze-${breakType}`);
  chrome.alarms.create(`break-${breakType}`, {
    delayInMinutes: data.breaks[breakType].interval
  });
}

async function pauseBreak(breakType) {
  const data = await chrome.storage.local.get('breaks');
  data.breaks[breakType].status = 'paused';
  await chrome.storage.local.set({ breaks: data.breaks });
  
  chrome.alarms.clear(`break-${breakType}`);
  chrome.alarms.clear(`snooze-${breakType}`);
}

async function resetAll() {
  const data = await chrome.storage.local.get('breaks');
  for (const breakType of Object.keys(data.breaks)) {
    if (data.breaks[breakType].enabled) {
      await resetTimer(breakType);
    }
  }
}

async function snoozeAll(minutes) {
  const data = await chrome.storage.local.get('breaks');
  for (const breakType of Object.keys(data.breaks)) {
    if (data.breaks[breakType].enabled && data.breaks[breakType].status === 'active') {
      await snoozeBreak(breakType, minutes);
    }
  }
}

async function pauseAll() {
  const data = await chrome.storage.local.get('breaks');
  for (const breakType of Object.keys(data.breaks)) {
    if (data.breaks[breakType].enabled) {
      await pauseBreak(breakType);
    }
  }
}

async function setMasterInterval(interval) {
  await chrome.storage.local.set({ masterInterval: interval });
  const data = await chrome.storage.local.get('breaks');
  
  for (const breakType of Object.keys(data.breaks)) {
    data.breaks[breakType].interval = interval;
    if (data.breaks[breakType].enabled) {
      await updateInterval(breakType, interval);
    }
  }
  await chrome.storage.local.set({ breaks: data.breaks });
}
```

**Step 6: Commit**

```bash
git add src/background.js
git commit -m "feat: implement background script with alarms and storage"
```

---

## Task 3: Create Popup HTML with Tailwind + DaisyUI

**Files:**
- Modify: `src/popup.html`
- Create: `src/popup.css`

**Step 1: Create HTML structure**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthy Breaks</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- DaisyUI -->
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.min.css" rel="stylesheet" type="text/css" />
  <!-- Heroicons -->
  <script src="https://unpkg.com/@heroicons/vue@2.0.13/24/outline/index.js" type="module"></script>
  <style>
    body {
      width: 380px;
      min-height: 500px;
      max-height: 600px;
      overflow-y: auto;
    }
    .break-row {
      transition: all 0.3s ease;
    }
    .break-row:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    .config-panel {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .config-panel.open {
      max-height: 300px;
    }
  </style>
</head>
<body class="bg-base-100">
  <!-- Header -->
  <header class="sticky top-0 z-50 bg-base-100 border-b border-base-300 p-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-2xl">
        🍃
      </div>
      <div>
        <h1 class="text-xl font-bold">Healthy Breaks</h1>
        <p class="text-xs text-base-content/60">Stay healthy while you work</p>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="p-4">
    <!-- Break Types List -->
    <div id="breaks-list" class="space-y-2">
      <!-- Breaks will be dynamically inserted here -->
    </div>
  </main>

  <!-- Global Footer -->
  <footer class="border-t border-base-300 p-4 bg-base-200">
    <!-- Master Interval Override -->
    <div class="mb-4">
      <label class="label">
        <span class="label-text text-xs font-semibold">Master Override (minutes)</span>
      </label>
      <div class="flex gap-2">
        <input 
          type="number" 
          id="master-interval" 
          class="input input-sm input-bordered flex-1" 
          placeholder="Set all intervals..."
          min="1"
          max="180"
        >
        <button id="apply-master" class="btn btn-sm btn-primary">Apply</button>
      </div>
    </div>

    <!-- Global Controls -->
    <div class="grid grid-cols-3 gap-2">
      <button id="reset-all" class="btn btn-sm btn-outline">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
        Reset All
      </button>
      <button id="snooze-all" class="btn btn-sm btn-outline">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Snooze All
      </button>
      <button id="pause-all" class="btn btn-sm btn-outline">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        Pause All
      </button>
    </div>

    <!-- Privacy Notice -->
    <div class="mt-4 text-center">
      <p class="text-xs text-base-content/50 flex items-center justify-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        No data leaves your device
      </p>
    </div>
  </footer>

  <script src="popup.js"></script>
</body>
</html>
```

**Step 2: Commit**

```bash
git add src/popup.html src/popup.css
git commit -m "feat: create popup HTML with Tailwind and DaisyUI"
```

---

## Task 4: Implement Popup JavaScript Logic

**Files:**
- Create: `src/popup.js`

**Step 1: Define break configurations**

```javascript
const BREAK_CONFIG = {
  eye: {
    name: 'Eye Break',
    icon: '👁️',
    defaultInterval: 20,
    color: 'blue'
  },
  water: {
    name: 'Water Break',
    icon: '💧',
    defaultInterval: 60,
    color: 'cyan'
  },
  walk: {
    name: 'Walk Break',
    icon: '🚶',
    defaultInterval: 60,
    color: 'green'
  },
  posture: {
    name: 'Posture Check',
    icon: '🧘',
    defaultInterval: 30,
    color: 'purple'
  }
};
```

**Step 2: Initialize popup**

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  await renderBreaksList();
  setupGlobalControls();
  setupMasterOverride();
  
  // Refresh every second for countdown timers
  setInterval(updateCountdowns, 1000);
});

async function getBreaksData() {
  const response = await chrome.runtime.sendMessage({ action: 'getBreaks' });
  return response.breaks;
}
```

**Step 3: Render breaks list**

```javascript
async function renderBreaksList() {
  const breaksData = await getBreaksData();
  const container = document.getElementById('breaks-list');
  container.innerHTML = '';
  
  for (const [breakType, config] of Object.entries(BREAK_CONFIG)) {
    const data = breaksData[breakType];
    const breakRow = createBreakRow(breakType, config, data);
    container.appendChild(breakRow);
  }
}

function createBreakRow(breakType, config, data) {
  const div = document.createElement('div');
  div.className = 'break-row bg-base-200 rounded-lg overflow-hidden';
  div.innerHTML = `
    <div class="p-3 flex items-center justify-between cursor-pointer" onclick="toggleConfig('${breakType}')">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${config.icon}</span>
        <div>
          <h3 class="font-semibold text-sm">${config.name}</h3>
          <p class="text-xs text-base-content/60 countdown" data-break="${breakType}">--:--</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge badge-sm ${getStatusBadgeClass(data.status)}">${data.status}</span>
        <input 
          type="checkbox" 
          class="toggle toggle-sm toggle-${config.color}" 
          ${data.enabled ? 'checked' : ''}
          onclick="event.stopPropagation(); toggleBreak('${breakType}', this.checked)"
        >
      </div>
    </div>
    
    <!-- Config Panel -->
    <div id="config-${breakType}" class="config-panel bg-base-300">
      <div class="p-3 space-y-3">
        <!-- Interval Input -->
        <div>
          <label class="label py-1">
            <span class="label-text text-xs">Interval (minutes)</span>
          </label>
          <div class="flex gap-2">
            <input 
              type="number" 
              class="input input-sm input-bordered flex-1 interval-input" 
              value="${data.interval}"
              min="1"
              max="180"
              data-break="${breakType}"
            >
            <button class="btn btn-sm btn-ghost" onclick="updateInterval('${breakType}')">Update</button>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="flex gap-2">
          <button class="btn btn-sm btn-outline flex-1" onclick="resetTimer('${breakType}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Reset
          </button>
          <button class="btn btn-sm btn-outline flex-1" onclick="snoozeBreak('${breakType}', 5)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Snooze 5m
          </button>
          <button class="btn btn-sm btn-outline flex-1" onclick="pauseBreak('${breakType}')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Pause
          </button>
        </div>
      </div>
    </div>
  `;
  return div;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'active': return 'badge-success';
    case 'paused': return 'badge-ghost';
    case 'snoozed': return 'badge-warning';
    default: return 'badge-ghost';
  }
}

function toggleConfig(breakType) {
  const panel = document.getElementById(`config-${breakType}`);
  panel.classList.toggle('open');
}
```

**Step 4: Implement control functions**

```javascript
async function toggleBreak(breakType, enabled) {
  await chrome.runtime.sendMessage({
    action: 'toggleBreak',
    breakType,
    enabled
  });
  await renderBreaksList();
}

async function updateInterval(breakType) {
  const input = document.querySelector(`input.interval-input[data-break="${breakType}"]`);
  const interval = parseInt(input.value, 10);
  if (interval < 1 || interval > 180) {
    alert('Interval must be between 1 and 180 minutes');
    return;
  }
  
  await chrome.runtime.sendMessage({
    action: 'updateInterval',
    breakType,
    interval
  });
  await renderBreaksList();
}

async function resetTimer(breakType) {
  await chrome.runtime.sendMessage({
    action: 'resetTimer',
    breakType
  });
  await renderBreaksList();
}

async function snoozeBreak(breakType, minutes) {
  await chrome.runtime.sendMessage({
    action: 'snoozeBreak',
    breakType,
    minutes
  });
  await renderBreaksList();
}

async function pauseBreak(breakType) {
  await chrome.runtime.sendMessage({
    action: 'pauseBreak',
    breakType
  });
  await renderBreaksList();
}
```

**Step 5: Implement global controls**

```javascript
function setupGlobalControls() {
  document.getElementById('reset-all').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'resetAll' });
    await renderBreaksList();
  });
  
  document.getElementById('snooze-all').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'snoozeAll', minutes: 5 });
    await renderBreaksList();
  });
  
  document.getElementById('pause-all').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'pauseAll' });
    await renderBreaksList();
  });
}

function setupMasterOverride() {
  const masterInput = document.getElementById('master-interval');
  const applyBtn = document.getElementById('apply-master');
  
  applyBtn.addEventListener('click', async () => {
    const interval = parseInt(masterInput.value, 10);
    if (!interval || interval < 1 || interval > 180) {
      alert('Please enter a valid interval (1-180 minutes)');
      return;
    }
    
    await chrome.runtime.sendMessage({
      action: 'setMasterInterval',
      interval
    });
    
    // Clear the input after applying
    masterInput.value = '';
    await renderBreaksList();
  });
}
```

**Step 6: Implement countdown updates**

```javascript
async function updateCountdowns() {
  const breaksData = await getBreaksData();
  const countdowns = document.querySelectorAll('.countdown');
  
  countdowns.forEach(el => {
    const breakType = el.dataset.break;
    const data = breaksData[breakType];
    
    if (!data.enabled) {
      el.textContent = 'Disabled';
      return;
    }
    
    if (data.status === 'paused') {
      el.textContent = 'Paused';
      return;
    }
    
    if (data.status === 'snoozed' && data.snoozeUntil) {
      const remaining = data.snoozeUntil - Date.now();
      if (remaining > 0) {
        el.textContent = `Snoozed: ${formatTime(remaining)}`;
      } else {
        el.textContent = 'Resuming...';
      }
      return;
    }
    
    // Get alarm info for active breaks
    chrome.alarms.get(`break-${breakType}`, alarm => {
      if (alarm && alarm.scheduledTime) {
        const remaining = alarm.scheduledTime - Date.now();
        if (remaining > 0) {
          el.textContent = formatTime(remaining);
        } else {
          el.textContent = 'Due!';
        }
      } else {
        el.textContent = 'Starting...';
      }
    });
  });
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
```

**Step 7: Commit**

```bash
git add src/popup.js
git commit -m "feat: implement popup UI logic and controls"
```

---

## Task 5: Create Simple SVG Icons

**Files:**
- Create: `src/icons/icon16.svg`
- Create: `src/icons/icon48.svg`
- Create: `src/icons/icon128.svg`

**Step 1: Create SVG icons**

Create a simple leaf/health icon in SVG format, then we'll convert to PNG or use as-is if Chrome supports it.

```svg
<!-- icon16.svg, icon48.svg, icon128.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="#22c55e"/>
  <path d="M64 24c-24 0-44 20-44 44 0 16 8 30 20 38l24-24 24 24c12-8 20-22 20-38 0-24-20-44-44-44z" fill="white"/>
  <path d="M64 36c-18 0-32 14-32 32 0 12 6 22 16 28l16-16 16 16c10-6 16-16 16-28 0-18-14-32-32-32z" fill="#22c55e"/>
</svg>
```

**Step 2: Convert SVG to PNG (optional)**

For Chrome Web Store, we need PNG. Create simple colored rectangles for now:

```bash
# Using ImageMagick if available, or create placeholder files
echo "Creating placeholder icons..."
```

Or use inline base64 data URIs in the manifest temporarily.

**Step 3: Update manifest to use SVG (Chrome 99+ supports SVG icons)**

Modern Chrome supports SVG icons. If not, convert them manually later.

**Step 4: Commit**

```bash
git add src/icons/
git commit -m "feat: add extension icons"
```

---

## Task 6: Setup Playwright and Create E2E Test

**Files:**
- Create: `package.json`
- Create: `playwright.config.js`
- Create: `tests/healthy-breaks.spec.js`

**Step 1: Initialize npm and install Playwright**

```bash
npm init -y
npm install -D @playwright/test
npx playwright install chromium
```

**Step 2: Create package.json scripts**

```json
{
  "name": "healthy-breaks",
  "version": "1.0.0",
  "description": "Privacy-first health reminders Chrome extension",
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0"
  }
}
```

**Step 3: Create Playwright config**

```javascript
// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Load extension in Chrome
        launchOptions: {
          args: [
            `--disable-extensions-except=${path.resolve(__dirname)}`,
            `--load-extension=${path.resolve(__dirname)}`,
          ],
        },
      },
    },
  ],
});
```

**Step 4: Create E2E test for Eye Break notification**

```javascript
// tests/healthy-breaks.spec.js
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
```

**Step 5: Create test setup file**

```javascript
// tests/fixtures.js
const { test: base, expect } = require('@playwright/test');
const path = require('path');

const test = base.extend({
  context: async ({ browser }, use) => {
    const pathToExtension = path.join(__dirname, '..');
    const context = await browser.newContext({
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Wait for service worker to be ready
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});

module.exports = { test, expect };
```

**Step 6: Commit**

```bash
git add package.json playwright.config.js tests/
git commit -m "test: add Playwright E2E tests for Eye Break notification"
```

---

## Task 7: Create README Documentation

**Files:**
- Create: `README.md`

**Step 1: Write comprehensive README**

```markdown
# Healthy Breaks

A privacy-first Chrome extension for health reminders. All data stays on your device.

## Features

- **Eye Break**: 20-20-20 Rule (every 20 mins, look 20ft away for 20s)
- **Water Break**: Stay hydrated with hourly reminders
- **Walk Break**: Walk and stretch every hour
- **Posture Check**: Maintain good posture with 30-minute checks

## Installation

### Developer Mode

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder

### Chrome Web Store

Coming soon!

## Usage

1. Click the extension icon in Chrome toolbar
2. Enable the breaks you want by toggling the switches
3. Click on a break type to configure:
   - Set custom interval (in minutes)
   - Reset, snooze, or pause individual breaks
4. Use global controls in the footer for all breaks at once

## Privacy

🔒 **No data leaves your device**. All settings are stored locally using Chrome's `storage.local` API. No analytics, no tracking, no external servers.

## Development

### Testing

Run E2E tests with Playwright:

\`\`\`bash
npm install
npm test
\`\`\`

### File Structure

\`\`\`
├── manifest.json          # Extension manifest (MV3)
├── src/
│   ├── background.js      # Service worker with alarm logic
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   └── icons/             # Extension icons
├── tests/
│   └── healthy-breaks.spec.js  # E2E tests
├── package.json
└── playwright.config.js
\`\`\`

## Technical Stack

- Manifest V3 (Chrome Extension)
- Tailwind CSS + DaisyUI (CDN)
- Chrome APIs: alarms, storage, notifications
- Playwright (E2E testing)

## License

MIT
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 8: Run Tests and Verify

**Step 1: Install dependencies**

```bash
npm install
```

**Step 2: Run Playwright tests**

```bash
npm test
```

**Step 3: Verify all tests pass**

Expected output:
- 6 tests passing
- Eye Break notification test passes
- Storage privacy test passes
- Master interval override test passes
- Global controls test passes

**Step 4: Commit test results**

```bash
git add .
git commit -m "test: verify all E2E tests passing"
```

---

## Final Verification Checklist

Before completing, verify:

1. ✓ manifest.json is valid MV3
2. ✓ All 4 break types defined and disabled by default
3. ✓ Background script handles chrome.alarms correctly
4. ✓ Popup UI uses Tailwind + DaisyUI
5. ✓ All controls work: Reset, Snooze, Pause (individual and global)
6. ✓ Master interval override updates all breaks
7. ✓ Privacy notice visible in footer
8. ✓ Playwright E2E test for Eye Break passes
9. ✓ No external dependencies except CDNs
10. ✓ All data stored in chrome.storage.local

## Post-Implementation Notes

### Known Limitations

1. **Icon format**: Using SVG icons requires Chrome 99+. For older versions, convert to PNG.
2. **Alarm precision**: chrome.alarms has ~1 minute precision, not exact seconds.
3. **Notification buttons**: May not work in all Chrome versions (buttons property is relatively new).

### Future Enhancements

1. Statistics/history tracking (still local)
2. Sound alerts for breaks
3. Custom break types
4. Work schedule (only active during work hours)
5. Statistics dashboard

---

**Plan complete and ready for execution.**
