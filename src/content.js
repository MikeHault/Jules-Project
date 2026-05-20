(function() {
  const css = `
    /* Hide Shorts Shelves and Items */
    ytd-reel-shelf-renderer,
    ytd-rich-shelf-renderer[is-shorts],
    ytd-mini-guide-entry-renderer[aria-label="Shorts"],
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-video-renderer:has(a[href*="/shorts/"]),
    ytd-grid-video-renderer:has(a[href*="/shorts/"]),
    ytd-rich-item-renderer:has(a[href*="/shorts/"]),

    /* Hide Search UI */
    ytd-searchbox,
    #searchbox,
    #search-button,
    #search-icon-legacy,
    ytd-mini-guide-entry-renderer[aria-label="Search"],
    ytd-guide-entry-renderer:has(a[href*="/results"]),

    /* Hide restricted sections in sidebar */
    ytd-guide-entry-renderer:has(a[href="/feed/trending"]),
    ytd-guide-entry-renderer:has(a[href="/feed/subscriptions"]),

    #yt-blocker-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.98);
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: sans-serif;
    }
    #yt-blocker-overlay h1 { font-size: 2.5em; margin-bottom: 20px; }
    #yt-blocker-overlay p { font-size: 1.5em; }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.innerText = css;
  document.documentElement.appendChild(styleSheet);

  let whitelist = [];
  let enabled = true;
  let dailyLimit = 60;
  let todayUsage = 0;

  function loadSettings(callback) {
    chrome.storage.sync.get(['whitelist', 'enabled', 'dailyLimit', 'todayUsage'], (syncData) => {
      chrome.storage.local.get(['todayUsage'], (localData) => {
        whitelist = syncData.whitelist || [];
        enabled = syncData.enabled !== false;
        dailyLimit = syncData.dailyLimit || 60;
        // Use local usage but fall back to sync if local is missing (new device)
        todayUsage = localData.todayUsage || syncData.todayUsage || 0;
        if (callback) callback();
      });
    });
  }

  function getChannelId(element = document) {
    // Check meta tags first if it's the whole document
    if (element === document) {
      const meta = document.querySelector('meta[itemprop="channelId"]');
      if (meta) return meta.getAttribute('content');
    }

    // Try to find channel link within the element
    const channelLinks = element.querySelectorAll('a[href*="/channel/"], a[href*="/@"]');
    for (const link of channelLinks) {
      const href = link.getAttribute('href');
      if (href) {
        if (href.includes('/channel/')) return href.split('/channel/')[1].split('/')[0];
        if (href.includes('/@')) return href.split('/@')[1].split('/')[0];
      }
    }
    return null;
  }

  function blockPage(title = "Content Blocked", message = "This channel is not in your whitelist.") {
    if (document.getElementById('yt-blocker-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'yt-blocker-overlay';
    overlay.innerHTML = `
      <h1>${title}</h1>
      <p>${message}</p>
    `;
    document.body.appendChild(overlay);
    const video = document.querySelector('video');
    if (video) video.pause();
  }

  function filterFeed() {
    // Home feed items
    const videoItems = document.querySelectorAll('ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer');
    videoItems.forEach(item => {
      if (item.getAttribute('data-checked')) return;

      const channelId = getChannelId(item);
      if (channelId) {
        const isWhitelisted = whitelist.some(id => id === channelId || id === `@${channelId}`);
        if (!isWhitelisted) {
          item.style.display = 'none';
        }
        item.setAttribute('data-checked', 'true');
      }
    });
  }

  function checkPage() {
    if (!enabled) return;

    if (todayUsage >= dailyLimit) {
      blockPage("Time Limit Reached", "You have used up your daily YouTube screen time.");
      return;
    }

    const url = window.location.href;
    if (url.includes('/feed/trending') || url.includes('/feed/subscriptions') || url.includes('/results')) {
      blockPage("Restricted Area", "Searching and discovery feeds are disabled.");
      return;
    }

    if (url.includes('/watch')) {
      const channelId = getChannelId();
      if (!channelId) {
        setTimeout(checkPage, 500);
        return;
      }
      const isWhitelisted = whitelist.some(id => id === channelId || id === `@${channelId}`);
      if (!isWhitelisted) {
        blockPage();
      }
    }

    // Always filter feed on home or other browse pages
    filterFeed();
  }

  // Heartbeat for timer
  setInterval(() => {
    if (!document.hidden && enabled) {
        chrome.runtime.sendMessage({ type: 'heartbeat' });
        todayUsage += 1; // Increment current session usage
        if (todayUsage >= dailyLimit) checkPage();
    }
  }, 60000); // Every minute

  let filterDebounceTimer;
  const observer = new MutationObserver(() => {
    clearTimeout(filterDebounceTimer);
    filterDebounceTimer = setTimeout(filterFeed, 200);
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  loadSettings(() => {
    checkPage();
  });

  window.addEventListener('yt-navigate-finish', () => {
    loadSettings(() => {
      checkPage();
    });
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.whitelist || changes.enabled || changes.dailyLimit) {
      loadSettings(() => {
        if (!enabled) {
            const overlay = document.getElementById('yt-blocker-overlay');
            if (overlay) overlay.remove();
        }
        checkPage();
      });
    }
  });
})();
