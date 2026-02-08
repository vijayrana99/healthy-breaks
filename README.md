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

```bash
npm install
npm test
```

### File Structure

```
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
```

## Technical Stack

- Manifest V3 (Chrome Extension)
- Tailwind CSS with Inter font
- Chrome APIs: alarms, storage, notifications
- Playwright (E2E testing)

## License

MIT