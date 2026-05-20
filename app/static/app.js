document.addEventListener('DOMContentLoaded', async () => {
    const authBtn = document.getElementById('auth-btn');
    const authStatus = document.getElementById('auth-status');
    const configForm = document.getElementById('config-form');
    const syncBtn = document.getElementById('sync-btn');
    const syncStatus = document.getElementById('sync-status');

    async function loadStatus() {
        const res = await fetch('/api/status');
        const data = await res.json();

        if (data.authenticated) {
            authStatus.innerText = 'Connected to Google Photos';
            authStatus.className = 'card-text text-success';
            authBtn.style.display = 'none';
        } else {
            authStatus.innerText = 'Not connected to Google Photos';
            authStatus.className = 'card-text text-danger';
            authBtn.style.display = 'block';
        }

        document.getElementById('download_path').value = data.config.download_path;
        document.getElementById('schedule_cron').value = data.config.schedule_cron;
        document.getElementById('months_ago').value = data.config.months_ago;
        document.getElementById('enabled').checked = data.config.enabled;
    }

    authBtn.onclick = async () => {
        const res = await fetch('/api/auth/url');
        const data = await res.json();
        window.location.href = data.url;
    };

    configForm.onsubmit = async (e) => {
        e.preventDefault();
        const config = {
            download_path: document.getElementById('download_path').value,
            schedule_cron: document.getElementById('schedule_cron').value,
            months_ago: parseInt(document.getElementById('months_ago').value),
            enabled: document.getElementById('enabled').checked
        };
        const res = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
        if (res.ok) alert('Config saved!');
    };

    syncBtn.onclick = async () => {
        syncStatus.innerText = 'Syncing...';
        const res = await fetch('/api/sync', { method: 'POST' });
        const data = await res.json();
        syncStatus.innerText = data.status || data.error;
    };

    await loadStatus();
});
