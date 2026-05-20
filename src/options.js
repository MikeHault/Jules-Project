document.addEventListener('DOMContentLoaded', () => {
  const passwordSection = document.getElementById('password-section');
  const settingsSection = document.getElementById('settings-section');
  const passwordInput = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const passwordError = document.getElementById('password-error');

  const dailyLimitInput = document.getElementById('daily-limit');
  const whitelistInput = document.getElementById('whitelist-input');
  const addBtn = document.getElementById('add-btn');
  const whitelistContainer = document.getElementById('whitelist-container');
  const enabledCheckbox = document.getElementById('enabled-checkbox');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  const status = document.getElementById('status');
  const currentUsageSpan = document.getElementById('current-usage');
  const limitDisplaySpan = document.getElementById('limit-display');

  const newPasswordInput = document.getElementById('new-password');
  const changePwBtn = document.getElementById('change-pw-btn');

  let currentWhitelist = [];

  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  unlockBtn.addEventListener('click', async () => {
    const enteredPw = passwordInput.value;
    const enteredHash = await hashPassword(enteredPw);

    chrome.storage.sync.get(['passwordHash'], (data) => {
      if (data.passwordHash === enteredHash) {
        passwordSection.classList.add('hidden');
        settingsSection.classList.remove('hidden');
        loadSettings();
      } else {
        passwordError.textContent = 'Incorrect password.';
      }
    });
  });

  function loadSettings() {
    chrome.storage.sync.get(['whitelist', 'enabled', 'dailyLimit', 'todayUsage'], (syncData) => {
      chrome.storage.local.get(['todayUsage'], (localData) => {
        currentWhitelist = syncData.whitelist || [];
        enabledCheckbox.checked = syncData.enabled !== false;
        dailyLimitInput.value = syncData.dailyLimit || 60;
        limitDisplaySpan.textContent = syncData.dailyLimit || 60;

        const usage = localData.todayUsage || syncData.todayUsage || 0;
        currentUsageSpan.textContent = Math.round(usage);

        renderWhitelist();
      });
    });
  }

  function renderWhitelist() {
    whitelistContainer.innerHTML = '';
    currentWhitelist.forEach((item, index) => {
      const div = document.createElement('div');
      div.className = 'whitelist-item';
      div.innerHTML = `
        <span>${item}</span>
        <button class="remove-btn" data-index="${index}">Remove</button>
      `;
      whitelistContainer.appendChild(div);
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = e.target.getAttribute('data-index');
        currentWhitelist.splice(index, 1);
        renderWhitelist();
      });
    });
  }

  addBtn.addEventListener('click', () => {
    const val = whitelistInput.value.trim();
    if (val && !currentWhitelist.includes(val)) {
      currentWhitelist.push(val);
      whitelistInput.value = '';
      renderWhitelist();
    }
  });

  saveSettingsBtn.addEventListener('click', () => {
    const limit = parseInt(dailyLimitInput.value);
    chrome.storage.sync.set({
      whitelist: currentWhitelist,
      enabled: enabledCheckbox.checked,
      dailyLimit: limit
    }, () => {
      limitDisplaySpan.textContent = limit;
      status.textContent = 'All settings saved and synced.';
      setTimeout(() => { status.textContent = ''; }, 2000);
    });
  });

  changePwBtn.addEventListener('click', async () => {
    const newPw = newPasswordInput.value;
    if (newPw) {
      const newHash = await hashPassword(newPw);
      chrome.storage.sync.set({ passwordHash: newHash }, () => {
        status.textContent = 'Password updated successfully.';
        newPasswordInput.value = '';
        setTimeout(() => { status.textContent = ''; }, 2000);
      });
    }
  });
});
