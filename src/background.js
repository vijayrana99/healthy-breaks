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
  
  // Set waiting state - timer will NOT auto-restart
  breakData.status = 'waiting';
  breakData.waitingSince = Date.now();
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Show notification with error handling
  try {
    const notificationId = `notification-${breakType}-${Date.now()}`;
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('src/icons/icon128.png'),
      title: `${BREAK_TYPES[breakType].name}`,
      message: BREAK_TYPES[breakType].description,
      requireInteraction: true,
      priority: 2,
      buttons: [
        { title: 'Done' },
        { title: 'Snooze 5m' }
      ]
    }, (createdId) => {
      if (chrome.runtime.lastError) {
        console.error('Notification error:', chrome.runtime.lastError);
      } else {
        console.log(`Notification created for ${breakType}: ${createdId}`);
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

async function handleSnoozeEnd(breakType) {
  const data = await chrome.storage.local.get('breaks');
  const breakData = data.breaks[breakType];
  
  if (!breakData || !breakData.enabled) return;
  
  // Set waiting state - show notification again
  breakData.status = 'waiting';
  breakData.waitingSince = Date.now();
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Show notification again - loop continues until user clicks Done
  await handleBreakTrigger(breakType);
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  // Extract break type from notification ID (format: notification-{breakType}-{timestamp})
  const match = notificationId.match(/notification-(\w+)-\d+/);
  if (!match) return;
  
  const breakType = match[1];
  
  if (buttonIndex === 0) {
    // Done - dismiss notification and reset timer
    chrome.notifications.clear(notificationId);
    await resetTimer(breakType);
  } else if (buttonIndex === 1) {
    // Snooze 5m - snooze this specific break
    chrome.notifications.clear(notificationId);
    await snoozeBreak(breakType, 5);
  }
});

// Handle notification close (user dismissed it without clicking buttons)
chrome.notifications.onClosed.addListener(async (notificationId, byUser) => {
  // Extract break type from notification ID (format: notification-{breakType}-{timestamp})
  const match = notificationId.match(/notification-(\w+)-\d+/);
  if (!match) return;
  
  const breakType = match[1];
  const data = await chrome.storage.local.get('breaks');
  
  // If closed by user and still in waiting state, reset the timer
  if (byUser && data.breaks[breakType].status === 'waiting') {
    await resetTimer(breakType);
  }
});

async function snoozeBreak(breakType, minutes) {
  const data = await chrome.storage.local.get('breaks');
  data.breaks[breakType].snoozeUntil = Date.now() + (minutes * 60 * 1000);
  data.breaks[breakType].status = 'snoozed';
  data.breaks[breakType].waitingSince = null;
  await chrome.storage.local.set({ breaks: data.breaks });
  
  // Clear existing alarm and create snooze alarm
  chrome.alarms.clear(`break-${breakType}`);
  chrome.alarms.create(`snooze-${breakType}`, {
    delayInMinutes: minutes
  });
}

// Restore alarms when service worker starts (browser restart)
chrome.runtime.onStartup.addListener(restoreAlarms);
// Also restore on install/update
chrome.runtime.onInstalled.addListener(restoreAlarms);

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
    } else if (breakData.status === 'snoozed' && breakData.snoozeUntil && breakData.snoozeUntil > Date.now()) {
      // Still in snooze period - resume countdown
      const remainingMinutes = Math.ceil((breakData.snoozeUntil - Date.now()) / (60 * 1000));
      chrome.alarms.create(`snooze-${breakType}`, {
        delayInMinutes: remainingMinutes
      });
    } else if (breakData.status === 'snoozed' && breakData.snoozeUntil && breakData.snoozeUntil <= Date.now()) {
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
        case 'resumeBreak':
          await resumeBreak(request.breakType);
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
        case 'resumeAll':
          await resumeAll();
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
  data.breaks[breakType].waitingSince = null;
  await chrome.storage.local.set({ breaks: data.breaks });
  
  if (enabled) {
    data.breaks[breakType].lastTriggered = Date.now();
    await chrome.storage.local.set({ breaks: data.breaks });
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
  data.breaks[breakType].waitingSince = null;
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
  
  // Calculate remaining time before pausing
  // Use lastTriggered + interval (same as popup display) instead of alarm.scheduledTime
  // This ensures consistency - alarm.scheduledTime can diverge due to minute rounding
  let remainingMs = data.breaks[breakType].interval * 60 * 1000; // Default to full interval
  
  if (data.breaks[breakType].lastTriggered) {
    const intervalMs = data.breaks[breakType].interval * 60 * 1000;
    remainingMs = Math.max(0, (data.breaks[breakType].lastTriggered + intervalMs) - Date.now());
  }
  
  data.breaks[breakType].status = 'paused';
  data.breaks[breakType].waitingSince = null;
  data.breaks[breakType].pausedRemainingMs = remainingMs; // Store remaining time
  data.breaks[breakType].pausedAt = Date.now(); // Store when paused
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

async function resumeBreak(breakType) {
  const data = await chrome.storage.local.get('breaks');
  if (!data.breaks[breakType].enabled || data.breaks[breakType].status !== 'paused') return;
  
  // Hard pause: resume from exact paused point, completely frozen (ignore elapsed pause time)
  const pausedRemainingMs = data.breaks[breakType].pausedRemainingMs;
  const intervalMs = data.breaks[breakType].interval * 60 * 1000;
  const remainingMs = (typeof pausedRemainingMs === 'number' && pausedRemainingMs > 0)
    ? pausedRemainingMs
    : intervalMs;

  // Alarm requires whole minutes - round up
  const alarmMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

  // Calculate elapsed time as if timer was running continuously
  const elapsedMs = intervalMs - remainingMs;

  data.breaks[breakType].status = 'active';
  data.breaks[breakType].lastTriggered = Date.now() - elapsedMs;
  data.breaks[breakType].pausedRemainingMs = null; // Clear stored time
  data.breaks[breakType].pausedAt = null; // Clear paused timestamp
  await chrome.storage.local.set({ breaks: data.breaks });

  chrome.alarms.create(`break-${breakType}`, {
    delayInMinutes: alarmMinutes
  });
}

async function resumeAll() {
  const data = await chrome.storage.local.get('breaks');
  for (const breakType of Object.keys(data.breaks)) {
    if (data.breaks[breakType].enabled && data.breaks[breakType].status === 'paused') {
      await resumeBreak(breakType);
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