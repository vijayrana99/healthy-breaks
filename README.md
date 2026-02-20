# Healthy Breaks

A privacy-first Chrome extension for health reminders with a modern iOS-style design. All data stays on your device - works completely offline.

## Features

- **Eye Break**: 20-20-20 Rule (every 20 mins, look 20ft away for 20s)
- **Water Break**: Stay hydrated with hourly reminders
- **Walk Break**: Walk and stretch every hour
- **Posture Check**: Maintain good posture with 30-minute checks
- **Hand & Wrist Break**: Prevent RSI with regular hand exercises
- **Mental Reset**: Take mindful breaks for mental clarity
- **Deep Breathing**: Practice breathing exercises for relaxation

## Design Highlights

- **iOS-Style UI**: Modern, clean interface with smooth animations
- **Smooth Toggle Switches**: Custom CSS toggles with spring animation
- **Hidden Scrollbar**: Clean look while maintaining scroll functionality
- **Local Inter Font**: Professional typography, no external dependencies
- **Lucide Icons**: Beautiful SVG icons for all break types
- **Master Controls**: Control all breaks at once (Reset All, Snooze All, and Pause All)

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

1. Click the extension icon in the Chrome toolbar
2. Enable the breaks you want by toggling the iOS-style switches
3. Click on a break card to expand and configure:
   - Set custom interval (in minutes)
   - Reset, snooze, or pause individual breaks
4. Use Master Controls at the bottom for global actions:
   - Reset All: Restart all enabled breaks
   - Snooze All: Pause all breaks for 5 minutes
   - Pause All: Pause or resume all breaks

## Privacy

🔒 **No data leaves your device**. All settings are stored locally using Chrome's `storage.local` API. No analytics, no tracking, no external servers.

🌐 **Works Offline**: All assets (fonts, CSS, icons) are bundled locally. No CDN dependencies.

## Development

### Prerequisites

- Node.js 16+
- Chrome browser

### Setup

```bash
npm install
```

### Testing

Run E2E tests with Playwright:

```bash
npm test              # Run all tests
npm run test:ui       # Run with UI mode
npm run test:debug    # Debug mode
```

### File Structure

```
├── manifest.json              # Extension manifest (MV3)
├── src/
│   ├── background.js          # Service worker with alarm logic
│   ├── popup.html             # Extension popup UI (iOS-style)
│   ├── popup.js               # Popup logic and state management
│   ├── input.css              # Tailwind source styles
│   ├── tailwind.min.css       # Bundled CSS (local, CSP-compliant)
│   ├── fonts/                 # Local Inter font files
│   │   ├── Inter-Regular.ttf
│   │   ├── Inter-Medium.ttf
│   │   ├── Inter-SemiBold.ttf
│   │   └── Inter-Bold.ttf
│   └── icons/                 # Extension icons
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── tests/
│   └── healthy-breaks.spec.js # E2E validation tests (10 tests)
├── docs/
│   └── plans/
│       └── 2025-02-07-healthy-breaks-implementation.md
├── AGENTS.md                  # Comprehensive AI agent guide
├── build.sh                   # Production build script
├── .gitignore                 # Excludes dev files from production
├── tailwind.config.js         # Tailwind configuration
├── package.json
├── playwright.config.js
└── README.md                  # This file
```

### Regenerate Tailwind CSS

After modifying HTML classes or adding new UI components:

```bash
npx tailwindcss -i ./src/input.css -o ./src/tailwind.min.css --minify
```

**Why local Tailwind?** The CSS file is bundled locally for Content Security Policy (CSP) compliance and offline functionality.

### Production Build

Create a minimal production package (excludes dev dependencies):

```bash
# Build production files
./build.sh

# Create distribution zip
cd dist && zip -r ../healthy-breaks.zip .
```

**Size:** Production package is ~800KB (vs 43MB with dev dependencies)

**Includes:**
- `manifest.json`
- `src/` (HTML, JS, CSS, fonts, icons)
- `README.md`

## Technical Stack

- **Manifest V3**: Chrome Extension with modern API
- **Tailwind CSS**: Utility-first CSS framework (bundled locally)
- **Inter Font**: Professional typography (self-hosted, 4 weights)
- **Lucide Icons**: Beautiful SVG icons (inlined)
- **Chrome APIs**: alarms, storage, notifications
- **Playwright**: End-to-end testing framework

### Design System

**Colours:**
- Background: `#f2f2f7` (iOS system gray)
- Card Background: `#FFFFFF` (white)
- Brand Green: `#22C55E`
- Eye Break: `#92400e` (amber-800)
- Water Break: `#3b82f6` (blue-500)
- Walk Break: `#4b5563` (gray-600)
- Posture Check: `#8b5cf6` (violet-500)
- Hand & Wrist: `#f97316` (orange-500)
- Mental Reset: `#06b6d4` (cyan-500)
- Deep Breathing: `#10b981` (emerald-500)

**Typography:**
- Font: Inter (400, 500, 600, 700)
- Break Card Title: 14px (text-sm)
- Header Title: 18px (text-lg)
- Body Text: 14-16px

**Animations:**
- Toggle Switch: 0.35s cubic-bezier spring animation
- Card Expand: 0.3s ease height transition
- Hover Effects: 0.2s ease transitions

## Browser Support

- Chrome 88+
- Edge 88+
- Any Chromium-based browser supporting Manifest V3

## License

MIT License

## Acknowledgments

- Inter font by Rasmus Andersson
- Lucide icons by the Lucide team
- Tailwind CSS by Adam Wathan and team
