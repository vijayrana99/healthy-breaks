# Agent Guide: Healthy Breaks Extension

> **For AI Agents:** This guide provides everything needed to understand, modify, and maintain the Healthy Breaks Chrome Extension.

## Quick Overview

**Healthy Breaks** is a privacy-first Chrome Extension that reminds users to take health breaks (Eye, Water, Walk, Posture). Built with Manifest V3, it uses the browser's alarm system to trigger notifications even when the popup is closed.

---

## Architecture Overview

### State Machine

```
┌─────────┐    Enable     ┌─────────┐
│  paused │ ──────────────→│ active  │
│ (start) │←───────────────│         │
└─────────┘    Disable     └────┬────┘
                                │
                                │ Alarm fires
                                ▼
                          ┌──────────┐
                          │ waiting  │◄──────┐
                          │(notif    │       │
                          │ shown)   │       │
                          └────┬─────┘       │
                               │              │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐       ┌──────────┐        ┌──────────┐
    │   Done   │       │  Snooze  │        │  Close   │
    │  button  │       │  5m btn  │        │   notif  │
    └────┬─────┘       └────┬─────┘        └────┬─────┘
         │                  │                   │
         ▼                  ▼                   ▼
    ┌──────────┐       ┌──────────┐       ┌──────────┐
    │  active  │       │ snoozed  │       │  active  │
    │(reset to│       │(5m delay)│       │(reset)   │
    │ interval)│       └────┬─────┘       └──────────┘
    └──────────┘            │
                            │ snooze ends
                            ▼
                       ┌──────────┐
                       │ waiting  │
                       └──────────┘
```

### Data Flow

1. **Background Script (Service Worker)**
   - Manages `chrome.alarms` for timing
   - Handles notification creation
   - Persists state to `chrome.storage.local`
   - Recovers state on browser restart

2. **Popup UI**
   - Reads state from storage
   - Sends commands to background via `chrome.runtime.sendMessage`
   - Displays countdown timers
   - Shows configuration panels

3. **Notifications**
   - System-level desktop alerts
   - Interactive buttons (Done, Snooze)
   - Require user interaction to dismiss

---

## Key Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `manifest.json` | Extension config | Permissions, entry points |
| `src/background.js` | Service worker | Alarm management, notifications, state persistence |
| `src/popup.html` | UI structure | HTML layout, Tailwind classes |
| `src/popup.js` | UI logic | Event handling, countdown updates, command dispatch |
| `src/tailwind.min.css` | Bundled styles | Tailwind + DaisyUI (regenerate if UI changes) |
| `tests/healthy-breaks.spec.js` | E2E tests | Validation tests |

---

## Storage Schema

```javascript
{
  breaks: {
    eye: {
      enabled: boolean,        // Is this break active?
      interval: number,        // Minutes between breaks
      status: 'active' | 'paused' | 'snoozed' | 'waiting',
      snoozeUntil: timestamp,  // When snooze ends (null if not snoozed)
      lastTriggered: timestamp,// Last time notification fired
      waitingSince: timestamp  // When notification was shown (null if not waiting)
    },
    water: { /* same */ },
    walk: { /* same */ },
    posture: { /* same */ }
  },
  masterInterval: number | null  // Global override value
}
```

---

## Common Tasks

### 1. Regenerate Tailwind CSS

**When:** After modifying HTML classes or adding new UI components

```bash
npx tailwindcss -i ./src/input.css -o ./src/tailwind.min.css --minify
```

**Why:** Tailwind is bundled locally for CSP compliance. The CSS file contains only the classes used in the HTML/JS files.

### 2. Run Tests

```bash
npm test                    # Run all Playwright tests
npm run test:ui            # Run with UI mode for debugging
npm run test:debug         # Debug mode
```

### 3. Test Notifications Manually

1. Enable a break with 1-minute interval
2. Close the popup
3. Wait for timer
4. **Check:** Notification should appear with Done/Snooze buttons
5. **Verify:** Timer shows "Due!" and doesn't auto-restart
6. Click Done → Timer should reset to full interval
7. Click Snooze → Timer should show 5-minute countdown

### 4. Test Browser Restart Recovery

1. Enable a break with short interval
2. Let timer run (but don't click notification)
3. Close Chrome completely
4. Reopen Chrome
5. **Verify:** Extension should restore alarm and re-show notification

---

## Code Patterns

### Adding a New Break Type

1. **Update BREAK_TYPES in background.js:**
```javascript
newbreak: {
  name: 'New Break',
  icon: '🆕',
  defaultInterval: 45,
  description: 'Description of the break'
}
```

2. **Update BREAK_CONFIG in popup.js:**
```javascript
newbreak: {
  name: 'New Break',
  icon: '🆕',
  defaultInterval: 45,
  color: 'orange'  // Tailwind color name
}
```

3. **Regenerate Tailwind CSS** to include new color classes

### Modifying Notification Behavior

Edit `handleBreakTrigger()` in `src/background.js`:

```javascript
async function handleBreakTrigger(breakType) {
  // Set waiting state
  breakData.status = 'waiting';
  breakData.waitingSince = Date.now();
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Create notification
  chrome.notifications.create(`notification-${breakType}-${Date.now()}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('src/icons/icon128.png'),
    title: `${BREAK_TYPES[breakType].name}`,
    message: BREAK_TYPES[breakType].description,
    requireInteraction: true,  // Stays until user acts
    priority: 2,               // High priority
    buttons: [
      { title: 'Done' },
      { title: 'Snooze 5m' }
    ]
  });
}
```

### Handling Notification Actions

Edit listeners in `src/background.js`:

```javascript
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  const match = notificationId.match(/notification-(\w+)-\d+/);
  if (!match) return;
  const breakType = match[1];
  
  if (buttonIndex === 0) {
    // Done button
    chrome.notifications.clear(notificationId);
    await resetTimer(breakType);
  } else if (buttonIndex === 1) {
    // Snooze button
    chrome.notifications.clear(notificationId);
    await snoozeBreak(breakType, 5);
  }
});
```

---

## UI Components

### Break Card Structure

```html
<div class="break-card card bg-base-100 shadow-md border border-base-200 overflow-hidden">
  <div class="card-body p-3">
    <!-- Header: Icon + Title + Toggle -->
    <div class="break-header flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-full bg-{color}/10">
          {icon}
        </div>
        <div>
          <h3 class="font-semibold text-sm">{name}</h3>
          <p class="countdown">{time}</p>
        </div>
      </div>
      <label class="switch">
        <input type="checkbox" class="break-toggle">
        <div class="slider round"></div>
      </label>
    </div>
    
    <!-- Config Panel (expandable) -->
    <div class="config-panel">
      <div class="bg-base-200/50 p-3 rounded-b-xl">
        <!-- Interval input + Update button -->
        <!-- Action grid: Reset | Snooze | Pause -->
      </div>
    </div>
  </div>
</div>
```

### Custom Toggle Switch

The toggle uses pure CSS (no JavaScript):

```css
.switch {
  display: inline-block;
  height: 24px;
  position: relative;
  width: 44px;
}
.switch input { display: none; }
.slider {
  background-color: #ccc;    /* Gray when OFF */
  transition: .3s;
  border-radius: 24px;
}
input:checked + .slider {
  background-color: #66bb6a; /* Green when ON */
}
```

---

## Troubleshooting

### Notification Not Showing

1. Check Chrome notification permissions:
   - Chrome Settings → Privacy → Notifications
   - Ensure "Healthy Breaks" is allowed

2. Check extension permissions in `manifest.json`:
   ```json
   "permissions": ["alarms", "storage", "notifications"]
   ```

3. Check console for errors:
   - Extension page → Service Worker → Console
   - Look for "Notification error" messages

### Timer Shows "Ready" Instead of Countdown

This means the alarm hasn't been created. Check:
- Is the break enabled?
- Check `chrome.alarms.getAll()` in Service Worker console
- Verify `lastTriggered` is set in storage

### Changes Not Reflecting

1. **After HTML/CSS changes:** Regenerate Tailwind CSS
   ```bash
   npx tailwindcss -i ./src/input.css -o ./src/tailwind.min.css --minify
   ```

2. **After JS changes:** Reload extension in Chrome
   - chrome://extensions/ → Healthy Breaks → Reload icon

3. **Clear storage** if state is corrupted:
   - Service Worker console: `chrome.storage.local.clear()`

---

## Testing Checklist

Before committing changes, verify:

- [ ] All 6 Playwright tests pass (`npm test`)
- [ ] Can enable/disable breaks
- [ ] Timer counts down correctly
- [ ] Notification appears when timer reaches 0
- [ ] "Due!" status shows in popup while waiting
- [ ] Done button resets timer
- [ ] Snooze button delays 5 minutes
- [ ] Closing notification resets timer
- [ ] Browser restart restores alarms
- [ ] No CSP errors in console

---

## Key Design Decisions

1. **CSP Compliance:** All CSS/JS bundled locally, no CDN
2. **Privacy First:** No external servers, all data in `chrome.storage.local`
3. **Action-Required:** Timer doesn't auto-restart; requires user interaction
4. **Waiting State:** Distinct state when notification is shown but not acted upon
5. **2-Column Grid:** Symmetrical layout for 4 break types
6. **Custom Toggle:** Pure CSS switch for visual consistency

---

## File Tree

```
healthy-breaks/
├── manifest.json              # MV3 manifest
├── src/
│   ├── background.js          # Service worker (alarms, notifications)
│   ├── popup.html            # UI structure
│   ├── popup.js              # UI logic
│   ├── input.css             # Tailwind source
│   ├── tailwind.min.css      # Bundled CSS (regenerate on change)
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── tests/
│   └── healthy-breaks.spec.js # E2E tests
├── docs/
│   └── plans/
│       └── 2025-02-07-healthy-breaks-implementation.md
├── tailwind.config.js        # Tailwind config with DaisyUI
├── package.json
├── playwright.config.js
├── README.md                 # User documentation
└── AGENTS.md                 # This file
```

---

## Questions?

If you're an AI agent working on this codebase and something isn't clear:
1. Check the implementation plan in `docs/plans/`
2. Review the commit history (`git log --oneline`)
3. Check for error messages in the Service Worker console
4. Run tests to see what's failing

**Remember:** This extension handles user health data, so maintain privacy-first principles and test thoroughly before changes.