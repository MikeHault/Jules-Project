let lastHeartbeatTime = 0;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['enabled', 'dailyLimit', 'passwordHash'], (data) => {
    if (data.enabled === undefined) chrome.storage.sync.set({ enabled: true });
    if (data.dailyLimit === undefined) chrome.storage.sync.set({ dailyLimit: 60 });
    if (!data.passwordHash) {
       chrome.storage.sync.set({ passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' });
    }
  });
});

async function checkDailyReset() {
  const today = new Date().toDateString();
  const data = await chrome.storage.local.get(['lastResetDay']);
  if (data.lastResetDay !== today) {
    await chrome.storage.local.set({ todayUsage: 0, lastResetDay: today });
    await chrome.storage.sync.set({ todayUsage: 0, lastResetDay: today });
    return true;
  }
  return false;
}

chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyReset') checkDailyReset();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'heartbeat') {
    const now = Date.now();
    // Only count heartbeat once every 50 seconds to handle multiple tabs
    if (now - lastHeartbeatTime > 50000) {
      lastHeartbeatTime = now;
      updateUsage();
    }
  }
});

async function updateUsage() {
  await checkDailyReset();
  const localData = await chrome.storage.local.get(['todayUsage']);
  let usage = (localData.todayUsage || 0) + 1;
  await chrome.storage.local.set({ todayUsage: usage });

  // Periodic sync to avoid rate limits
  if (usage % 5 === 0) {
    chrome.storage.sync.set({ todayUsage: usage, lastResetDay: new Date().toDateString() });
  }
}
