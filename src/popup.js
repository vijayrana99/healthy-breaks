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

let expandedBreakId = null;

document.addEventListener('DOMContentLoaded', async () => {
  await renderBreaksList();
  setupEventDelegation();
  setupMasterOverride();
  
  // Refresh breaks data every second
  setInterval(updateCountdowns, 1000);
});

async function getBreaksData() {
  const response = await chrome.runtime.sendMessage({ action: 'getBreaks' });
  return response.breaks;
}

async function renderBreaksList() {
  const breaksData = await getBreaksData();
  const container = document.getElementById('breaks-list');
  container.innerHTML = '';
  
  for (const [breakType, config] of Object.entries(BREAK_CONFIG)) {
    const data = breaksData[breakType];
    const breakCard = createBreakCard(breakType, config, data);
    container.appendChild(breakCard);
  }
}

function createBreakCard(breakType, config, data) {
  const div = document.createElement('div');
  const isExpanded = expandedBreakId === breakType;
  
  div.className = `bg-white rounded-2xl shadow-sm mb-4 transition-all duration-300 overflow-hidden break-card ${isExpanded ? 'expanded' : ''}`;
  div.dataset.break = breakType;
  
  div.innerHTML = `
    <!-- Card Header -->
    <div class="p-2 flex items-center justify-between">
      <div class="flex items-center space-x-4">
        <div class="p-2 bg-gray-50 rounded-lg" style="color: ${config.color}">
          ${ICONS[config.icon]}
        </div>
        <div class="flex flex-col">
          <h3 class="text-sm font-bold text-gray-900 expand-trigger cursor-pointer">${config.name}</h3>
          <span class="text-sm font-medium text-gray-500 countdown expand-trigger cursor-pointer" data-break="${breakType}">
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

    <!-- Expandable Config Panel -->
    <div id="config-${breakType}" class="config-panel ${isExpanded ? 'open' : ''}" onclick="event.stopPropagation()">
      <div class="px-5 pb-5 border-t border-gray-100">
        <div class="pt-5 space-y-4">
          <!-- Interval Input -->
          <div class="flex items-center justify-between">
            <label class="text-gray-600 font-medium text-sm">Interval (minutes)</label>
            <div class="flex items-center space-x-2">
              <input 
                type="number"
                class="interval-input w-16 h-10 border border-gray-200 rounded-lg text-center font-medium focus:outline-none focus:ring-2 focus:ring-green-500"
                value="${data.interval}"
                min="1"
                max="180"
                data-break="${breakType}"
              >
              <button 
                class="update-interval-btn bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors text-sm"
                data-break="${breakType}"
              >
                Update
              </button>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-3 gap-3">
            <button 
              class="reset-timer-btn py-2.5 px-2 border border-green-600 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors text-sm"
              data-break="${breakType}"
            >
              Reset
            </button>
            <button 
              class="snooze-btn py-2.5 px-2 border border-green-600 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors text-sm"
              data-break="${breakType}"
              data-minutes="5"
            >
              Snooze
            </button>
            <button 
              class="pause-btn py-2.5 px-2 border border-green-600 text-green-700 font-medium rounded-lg hover:bg-green-50 transition-colors text-sm"
              data-break="${breakType}"
            >
              ${data.status === 'paused' ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return div;
}

function getInitialStatusText(data) {
  if (!data.enabled) return 'Off';
  if (data.status === 'paused') return 'Paused';
  return 'Ready';
}

function setupEventDelegation() {
  const container = document.getElementById('breaks-list');
  
  container.addEventListener('click', async (e) => {
    const target = e.target;
    
    // Handle title/countdown click (toggle expand)
    if (target.closest('.expand-trigger')) {
      const card = target.closest('.break-card');
      if (card) {
        const breakType = card.dataset.break;
        toggleExpand(breakType);
      }
    }
    
    // Handle toggle checkbox
    if (target.classList.contains('break-toggle') || target.classList.contains('ios-toggle')) {
      const breakType = target.dataset.break;
      const enabled = target.checked;
      e.stopPropagation();
      await toggleBreak(breakType, enabled);
    }
    
    // Handle Update button
    if (target.classList.contains('update-interval-btn')) {
      const breakType = target.dataset.break;
      await updateInterval(breakType);
    }
    
    // Handle Reset button
    if (target.classList.contains('reset-timer-btn')) {
      const breakType = target.dataset.break;
      await resetTimer(breakType);
    }
    
    // Handle Snooze button
    if (target.classList.contains('snooze-btn')) {
      const breakType = target.dataset.break;
      const minutes = parseInt(target.dataset.minutes, 10);
      await snoozeBreak(breakType, minutes);
    }
    
    // Handle Pause button
    if (target.classList.contains('pause-btn')) {
      const breakType = target.dataset.break;
      await pauseBreak(breakType);
      await updateMasterPauseButton();
    }
  });
}

function toggleExpand(breakType) {
  expandedBreakId = expandedBreakId === breakType ? null : breakType;
  renderBreaksList();
}

async function toggleBreak(breakType, enabled) {
  await chrome.runtime.sendMessage({
    action: 'toggleBreak',
    breakType,
    enabled
  });
  await renderBreaksList();
  await updateMasterPauseButton();
}

async function updateInterval(breakType) {
  const input = document.querySelector(`.interval-input[data-break="${breakType}"]`);
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
  const breaksData = await getBreaksData();
  const breakData = breaksData[breakType];
  
  if (breakData.status === 'paused') {
    // Resume
    await chrome.runtime.sendMessage({
      action: 'resumeBreak',
      breakType
    });
  } else {
    // Pause
    await chrome.runtime.sendMessage({
      action: 'pauseBreak',
      breakType
    });
  }
  await renderBreaksList();
}

async function updateCountdowns() {
  const breaksData = await getBreaksData();
  const countdowns = document.querySelectorAll('.countdown');
  
  countdowns.forEach(el => {
    const breakType = el.dataset.break;
    const data = breaksData[breakType];
    
    if (!data.enabled) {
      el.textContent = 'Off';
      return;
    }
    
    if (data.status === 'paused') {
      // Show stored remaining time if available
      if (data.pausedRemainingMs && data.pausedRemainingMs > 0) {
        el.textContent = formatTimeWithUnit(data.pausedRemainingMs) + ' (Paused)';
      } else {
        el.textContent = 'Paused';
      }
      return;
    }
    
    if (data.status === 'snoozed' && data.snoozeUntil) {
      const remaining = data.snoozeUntil - Date.now();
      if (remaining > 0) {
        el.textContent = formatTimeWithUnit(remaining);
      } else {
        el.textContent = 'Due!';
      }
      return;
    }
    
    if (data.status === 'waiting') {
      el.textContent = 'Due!';
      return;
    }
    
    // Calculate remaining time from storage (exact) instead of alarm (rounded)
    // This ensures pause/resume shows exact time (e.g., 56:16 not 57:00)
    console.log(`[updateCountdowns] ${breakType}: enabled=${data.enabled}, status=${data.status}, lastTriggered=${data.lastTriggered}`);
    if (data.lastTriggered) {
      const intervalMs = data.interval * 60 * 1000;
      const remainingMs = (data.lastTriggered + intervalMs) - Date.now();
      console.log(`[updateCountdowns] ${breakType}: showing countdown, remainingMs=${remainingMs}`);
      if (remainingMs > 0) {
        el.textContent = formatTimeWithUnit(remainingMs);
      } else {
        el.textContent = 'Due!';
      }
    } else {
      console.log(`[updateCountdowns] ${breakType}: no lastTriggered, showing Ready`);
      el.textContent = 'Ready';
    }
  });
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeWithUnit(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} Minutes`;
}

function setupMasterOverride() {
  const masterIntervalInput = document.getElementById('master-interval');
  const applyBtn = document.getElementById('apply-master');
  const resetAllBtn = document.getElementById('reset-all');
  const snoozeAllBtn = document.getElementById('snooze-all');
  const pauseAllBtn = document.getElementById('pause-all');

  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      const interval = parseInt(masterIntervalInput.value, 10);
      if (!interval || interval < 1 || interval > 180) {
        alert('Please enter a valid interval (1-180 minutes)');
        return;
      }
      
      await chrome.runtime.sendMessage({
        action: 'setMasterInterval',
        interval
      });
      
      // Clear the input after applying
      masterIntervalInput.value = '';
      await renderBreaksList();
      await updateMasterPauseButton();
    });
  }

  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'resetAll' });
      await renderBreaksList();
      await updateMasterPauseButton();
    });
  }

  if (snoozeAllBtn) {
    snoozeAllBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ action: 'snoozeAll', minutes: 5 });
      await renderBreaksList();
      await updateMasterPauseButton();
    });
  }

  if (pauseAllBtn) {
    pauseAllBtn.addEventListener('click', async () => {
      const breaksData = await getBreaksData();
      const hasActiveBreaks = Object.entries(breaksData).some(([type, data]) => {
        return data.enabled && data.status !== 'paused';
      });
      
      if (hasActiveBreaks) {
        await chrome.runtime.sendMessage({ action: 'pauseAll' });
      } else {
        await chrome.runtime.sendMessage({ action: 'resumeAll' });
      }
      await renderBreaksList();
      await updateMasterPauseButton();
    });
  }
  
  // Initial button state update
  updateMasterPauseButton();
}

async function updateMasterPauseButton() {
  const breaksData = await getBreaksData();
  const pauseAllBtn = document.getElementById('pause-all');
  
  if (!pauseAllBtn) return;
  
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
  } else {
    // Show Resume button
    pauseAllBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"/>
      </svg>
      <span>Resume</span>
    `;
  }
}
