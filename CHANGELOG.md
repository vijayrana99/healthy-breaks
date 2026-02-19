# Changelog

All notable changes to the Healthy Breaks Chrome Extension will be documented in this file.

## [1.0.1] - 2025-02-19

### Fixed
- **Snooze button race condition**: Fixed issue where clicking "Snooze 5m" on notifications would incorrectly reset the timer instead of snoozing for 5 minutes. The problem was a race condition between `onButtonClicked` and `onClosed` event listeners.

### Changed
- **Clickable caret icons**: Chevron icons in break cards are now clickable and toggle the settings panel, just like clicking the break title.

### Notes
- The Settings gear icon in Chrome notifications is automatically added by Chrome and cannot be hidden by extensions

## [1.0.0] - 2025-02-07

### Added
- Initial release of Healthy Breaks Chrome Extension
- Privacy-first health reminders with iOS-style design
- 7 break types: Eye Break, Water Break, Walk Break, Posture Check, Hand & Wrist Break, Mental Reset, Deep Breathing
- Master Controls for global actions (Reset All, Snooze All, Pause All)
- Chrome alarms and notifications system
- Pause/Resume functionality with exact time preservation
- Snooze functionality (5 minutes)
- Local Inter font (no external dependencies)
- 10 Playwright E2E tests
