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

document.addEventListener('DOMContentLoaded', async () => {
  await renderBreaksList();
  setupGlobalControls();
  setupMasterOverride();
  setupEventDelegation();
  
  // Refresh every second for countdown timers
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
    const breakRow = createBreakRow(breakType, config, data);
    container.appendChild(breakRow);
  }
}

function createBreakRow(breakType, config, data) {
  const div = document.createElement('div');
  div.className = 'break-row bg-base-200 rounded-lg overflow-hidden mb-2';
  div.dataset.break = breakType;
  div.innerHTML = `
    <div class="break-header p-3 flex items-center justify-between cursor-pointer" data-action="toggle-config" data-break="${breakType}">
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
          class="toggle toggle-sm toggle-${config.color} break-toggle" 
          ${data.enabled ? 'checked' : ''}
          data-break="${breakType}"
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
            <button class="btn btn-sm btn-ghost update-interval-btn" data-break="${breakType}">Update</button>
          </div>
        </div>
        
        <!-- Controls -->
        <div class="flex gap-2">
          <button class="btn btn-sm btn-outline flex-1 reset-timer-btn" data-break="${breakType}">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            Reset
          </button>
          <button class="btn btn-sm btn-outline flex-1 snooze-btn" data-break="${breakType}" data-minutes="5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Snooze 5m
          </button>
          <button class="btn btn-sm btn-outline flex-1 pause-btn" data-break="${breakType}">
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

// Event Delegation Setup
function setupEventDelegation() {
  const container = document.getElementById('breaks-list');
  
  container.addEventListener('click', async (e) => {
    const target = e.target;
    
    // Handle break header click (toggle config)
    if (target.closest('.break-header')) {
      const header = target.closest('.break-header');
      const breakType = header.dataset.break;
      toggleConfig(breakType);
    }
    
    // Handle toggle checkbox
    if (target.classList.contains('break-toggle')) {
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
    }
  });
}

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