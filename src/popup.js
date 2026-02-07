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
  div.className = 'break-card card bg-base-100 shadow-md border border-base-200 overflow-hidden';
  div.dataset.break = breakType;
  
  // Toggle styling based on enabled state
  const toggleChecked = data.enabled ? 'checked' : '';
  
  div.innerHTML = `
    <div class="card-body p-3">
      <!-- Header Section with Icon, Title, and Toggle -->
      <div class="break-header flex items-center justify-between cursor-pointer" data-action="toggle-config" data-break="${breakType}">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-${config.color}/10 flex items-center justify-center text-xl">
            ${config.icon}
          </div>
          <div>
            <h3 class="font-semibold text-sm">${config.name}</h3>
            <p class="text-xs text-base-content/60 countdown font-medium" data-break="${breakType}">--:--</p>
          </div>
        </div>
        <label class="switch" for="checkbox-${breakType}">
          <input 
            type="checkbox" 
            id="checkbox-${breakType}"
            class="break-toggle" 
            ${toggleChecked}
            data-break="${breakType}"
          >
          <div class="slider round"></div>
        </label>
      </div>
      
      <!-- Config Panel -->
      <div id="config-${breakType}" class="config-panel bg-base-200/50 p-3 rounded-b-xl -mx-3 mt-2">
        <div class="space-y-2">
          <!-- Interval Input Row -->
          <div class="flex gap-2 items-end">
            <div class="flex-1">
              <label class="label py-0 mb-1">
                <span class="label-text text-xs">Interval (minutes)</span>
              </label>
              <input 
                type="number" 
                class="input input-sm input-bordered bg-white w-full interval-input" 
                value="${data.interval}"
                min="1"
                max="180"
                data-break="${breakType}"
              >
            </div>
            <button class="btn btn-sm btn-primary update-interval-btn" data-break="${breakType}">Update</button>
          </div>
          
          <!-- Action Grid -->
          <div class="grid grid-cols-3 gap-2 mt-2">
            <button class="btn btn-xs btn-outline bg-white reset-timer-btn" data-break="${breakType}">
              Reset
            </button>
            <button class="btn btn-xs btn-outline bg-white snooze-btn" data-break="${breakType}" data-minutes="5">
              Snooze
            </button>
            <button class="btn btn-xs btn-outline bg-white pause-btn" data-break="${breakType}">
              Pause
            </button>
          </div>
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
      el.textContent = 'Off';
      return;
    }
    
    if (data.status === 'paused') {
      el.textContent = 'Paused';
      return;
    }
    
    if (data.status === 'snoozed' && data.snoozeUntil) {
      const remaining = data.snoozeUntil - Date.now();
      if (remaining > 0) {
        el.textContent = `Snoozed`;
      } else {
        el.textContent = 'Resuming...';
      }
      return;
    }
    
    if (data.status === 'waiting') {
      el.textContent = 'Due!';
      el.classList.add('text-error');
      return;
    }
    
    // Get alarm info for active breaks
    chrome.alarms.get(`break-${breakType}`, alarm => {
      if (alarm && alarm.scheduledTime) {
        const remaining = alarm.scheduledTime - Date.now();
        if (remaining > 0) {
          el.textContent = formatTime(remaining);
          el.classList.remove('text-error');
        } else {
          el.textContent = 'Due!';
          el.classList.add('text-error');
        }
      } else {
        el.textContent = 'Ready';
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