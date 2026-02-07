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