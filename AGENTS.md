# Agent Guide: Healthy Breaks Extension

> **For AI Agents:** This guide provides everything needed to understand, modify, and maintain the Healthy Breaks Chrome Extension.

## Quick Overview

**Healthy Breaks** is a privacy-first Chrome Extension that reminds users to take health breaks (Eye, Water, Walk, Posture). Built with Manifest V3, it uses the browser's alarm system to trigger notifications even when the popup is closed.

**Key Features:**
- iOS-style modern UI with smooth animations
- Completely offline (all assets bundled locally)
- Local Inter font (4 weights: 400, 500, 600, 700)
- Lucide SVG icons (no emojis)
- Hidden scrollbar with functional scrolling
- Master Controls for global break actions
- Production build system (~800KB package)

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
   - Shows configuration panels (expandable)

3. **Notifications**
   - System-level desktop alerts
   - Interactive buttons (Done, Snooze)
   - Require user interaction to dismiss

---

## Key Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| `manifest.json` | Extension config | Permissions, entry points, web_accessible_resources |
| `src/background.js` | Service worker | Alarm management, notifications, state persistence |
| `src/popup.html` | UI structure | HTML layout, Tailwind classes, inline styles |
| `src/popup.js` | UI logic | Event handling, countdown updates, command dispatch |
| `src/tailwind.min.css` | Bundled styles | Tailwind CSS (regenerate if UI changes) |
| `src/fonts/Inter-*.ttf` | Local font files | Inter font (4 weights for offline use) |
| `tests/healthy-breaks.spec.js` | E2E tests | Validation tests (6 tests) |

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
    posture: { /* same */ },
    hand: { /* same */ },
    mental: { /* same */ },
    breathing: { /* same */ }
  },
}
}
```

---

## Common Tasks

### 1. Regenerate Tailwind CSS

**When:** After modifying HTML classes or adding new UI components

```bash
npx tailwindcss -i ./src/input.css -o ./src/tailwind.min.css --minify
```

**Why:** Tailwind is bundled locally for CSP compliance and offline functionality. The CSS file contains only the classes used in the HTML/JS files.

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

### 5. Production Build

**Create minimal production package:**

```bash
./build.sh
```

**What it does:**
- Creates `dist/` folder with only essential files
- Excludes: node_modules/, tests/, docs/, config files
- Size: ~1.8MB (vs 43MB development)

**To package for Chrome Web Store:**
```bash
cd dist && zip -r ../healthy-breaks.zip .
```

**Production package includes:**
- manifest.json
- src/ (popup.html, popup.js, background.js, tailwind.min.css)
- src/icons/ (all sizes)
- src/fonts/ (Inter family)
- README.md

---

## Code Patterns

### Adding a New Break Type

1. **Update BREAK_TYPES in background.js:**
```javascript
newbreak: {
  name: 'New Break',
  icon: 'new-icon',
  defaultInterval: 45,
  description: 'Description of the break'
}
```

2. **Update BREAK_CONFIG in popup.js:**
```javascript
newbreak: {
  name: 'New Break',
  icon: 'activity',  // Lucide icon name
  defaultInterval: 45,
  color: '#f97316'  // Custom color (orange-500)
}
```

3. **Add Lucide icon to ICONS object:**
```javascript
const ICONS = {
  // ... existing icons
  activity: `<svg>...</svg>`,
  // ...
}
```

4. **Regenerate Tailwind CSS** to include new color classes

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
<div class="break-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer">
  <!-- Header: Icon + Title + Toggle -->
  <div class="break-header p-2 flex items-center justify-between">
    <div class="flex items-center space-x-4">
      <div class="p-2 bg-gray-50 rounded-lg" style="color: ${config.color}">
        ${ICONS[config.icon]}
      </div>
      <div class="flex flex-col">
        <h3 class="text-sm font-bold text-gray-900">${config.name}</h3>
        <span class="text-sm font-medium text-gray-500 countdown" data-break="${breakType}">
          ${getInitialStatusText(data)}
        </span>
      </div>
    </div>
    
    <div class="flex items-center space-x-3">
      ${isExpanded ? ICONS.chevronUp : ICONS.chevronDown}
      <input 
        type="checkbox" 
        class="ios-toggle break-toggle" 
        ${data.enabled ? 'checked' : ''}
        data-break="${breakType}"
      >
    </div>
  </div>
  
  <!-- Config Panel (expandable) -->
  <div id="config-${breakType}" class="config-panel">
    <div class="px-5 pb-5 border-t border-gray-100">
      <div class="pt-5 space-y-4">
        <!-- Interval input row -->
        <!-- Action buttons: Reset | Snooze | Pause -->
      </div>
    </div>
  </div>
</div>
```

### Master Override Section

```html
<div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
  <!-- Header -->
  <div class="p-4 border-b border-gray-100">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-bold text-gray-900">Master Override</h2>
        <p class="text-sm text-gray-500 font-medium mt-0.5">Set all intervals</p>
      </div>
      <div class="p-2 bg-gray-50 rounded-lg">
        <!-- Settings gear icon -->
      </div>
    </div>
  </div>

  <!-- Interval Input -->
  <div class="px-4" style="padding-top: 0px; padding-bottom: 0px;">
    <div class="flex items-center gap-3">
      <input 
        type="number" 
        id="master-interval" 
        placeholder="Minutes"
        style="padding-left: 10px;"
      >
      <button id="apply-master">Apply</button>
    </div>
  </div>

  <!-- Action Buttons -->
  <div class="p-4">
    <div class="grid grid-cols-3 gap-3">
      <button id="reset-all">Reset</button>
      <button id="snooze-all">Snooze</button>
      <button id="pause-all">Pause</button>
    </div>
  </div>
</div>
```

### Design System

**Font:** Inter (weights: 400, 500, 600, 700)
- Self-hosted in `src/fonts/` directory
- Loaded via @font-face declarations in popup.html

**Colors:**
- Background: `#f2f2f7` (iOS system gray)
- Card background: `#FFFFFF` (white)
- Brand green: `#22C55E`
- Text primary: `text-gray-900`
- Text secondary: `text-gray-500`
- Border: `border-gray-100` / `border-gray-200`
- Break type colors:
  - Eye: `#92400e` (amber-800)
  - Water: `#3b82f6` (blue-500)
  - Walk: `#4b5563` (gray-600)
  - Posture: `#8b5cf6` (violet-500)
  - Hand & Wrist: `#f97316` (orange-500)
  - Mental Reset: `#06b6d4` (cyan-500)
  - Deep Breathing: `#10b981` (emerald-500)

**Card Styling:**
- White background with subtle shadow
- Rounded corners (`rounded-2xl`)
- 16px padding (varies by section)
- 1px light gray border

### Custom iOS Toggle Switch

```css
.ios-toggle {
  appearance: none;
  width: 56px;
  height: 32px;
  background-color: #d1d5db;
  border-radius: 32px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.35s cubic-bezier(0.4, 0.0, 0.2, 1);
}
.ios-toggle::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 28px;
  height: 28px;
  background-color: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: transform 0.35s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.35s ease;
}
.ios-toggle:checked {
  background-color: #22C55E;
}
.ios-toggle:checked::after {
  transform: translateX(24px);
}
.ios-toggle:active::after {
  transform: scale(0.95);
}
```

### Hidden Scrollbar

```css
body {
  overflow-y: auto;
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* IE and Edge */
}
body::-webkit-scrollbar {
  display: none;                /* Chrome, Safari, Opera */
}
```

---

## Lucide Icons

The extension uses inline SVG icons from Lucide:

```javascript
const ICONS = {
  eye: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"...>`,
  droplets: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"...>`,
  footprints: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"...>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"...>`,
  chevronDown: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"...>`,
  chevronUp: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"...>`
};
```

**Benefits:**
- No external dependencies
- Works offline
- CSP compliant
- Consistent sizing

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

### Font Not Loading

If Inter font doesn't load:
1. Check file paths in @font-face declarations
2. Verify fonts are in `src/fonts/` directory
3. Check `web_accessible_resources` in manifest.json
4. Try hard-refreshing the extension

### Scrollbar Still Visible

If scrollbar appears:
1. Verify CSS is in popup.html `<style>` block
2. Check browser compatibility
3. Ensure no conflicting overflow styles

---

## Testing Checklist

Before committing changes, verify:

- [ ] All 10 Playwright tests pass (`npm test`)
- [ ] Can enable/disable breaks
- [ ] Timer counts down correctly
- [ ] Notification appears when timer reaches 0
- [ ] "Due!" status shows in popup while waiting
- [ ] Done button resets timer
- [ ] Snooze button delays 5 minutes
- [ ] Closing notification resets timer
- [ ] Browser restart restores alarms
- [ ] No CSP errors in console
- [ ] Works offline (no external requests)
- [ ] Scrollbar is hidden but scrolling works
- [ ] Toggle animation is smooth
- [ ] Inter font loads correctly

---

## Key Design Decisions

1. **CSP Compliance:** All CSS/JS bundled locally, no CDN
2. **Privacy First:** No external servers, all data in `chrome.storage.local`
3. **Offline First:** Local fonts, local Tailwind, inline SVG icons
4. **Action-Required:** Timer doesn't auto-restart; requires user interaction
5. **Waiting State:** Distinct state when notification is shown but not acted upon
6. **iOS Design:** Modern, clean aesthetic with smooth animations
7. **Custom Toggle:** Pure CSS iOS-style switch with spring physics
8. **Inter Font:** Professional typography, self-hosted
9. **Hidden Scrollbar:** Clean look while maintaining functionality
10. **Local Assets:** No external dependencies for complete offline functionality

---

## File Tree

```
healthy-breaks/
├── manifest.json              # MV3 manifest with web_accessible_resources
├── src/
│   ├── background.js          # Service worker (alarms, notifications)
│   ├── popup.html            # UI structure with inline styles
│   ├── popup.js              # UI logic and event handling
│   ├── input.css             # Tailwind source
│   ├── tailwind.min.css      # Bundled CSS (regenerate on change)
│   ├── fonts/                # Local Inter font files
│   │   ├── Inter-Regular.ttf
│   │   ├── Inter-Medium.ttf
│   │   ├── Inter-SemiBold.ttf
│   │   └── Inter-Bold.ttf
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── tests/
│   └── healthy-breaks.spec.js # E2E tests (10 tests)
├── build.sh                  # Production build script
├── .gitignore                # Excludes dev files
├── dist/                     # Production build output
├── docs/
│   └── plans/
│       └── 2025-02-07-healthy-breaks-implementation.md (COMPLETED)
├── tailwind.config.js        # Tailwind config with Inter font
├── package.json
├── playwright.config.js
├── README.md                 # User documentation
└── AGENTS.md                 # This file
```

---

## Questions?

If you're an AI agent working on this codebase and something isn't clear:
1. Check the implementation plan in `docs/plans/` (archived)
2. Review the commit history (`git log --oneline`)
3. Check for error messages in the Service Worker console
4. Run tests to see what's failing
5. Refer to the Troubleshooting section above

**Remember:** This extension handles user health data, so maintain privacy-first principles and test thoroughly before changes.
