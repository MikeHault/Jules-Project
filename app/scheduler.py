import json
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

CONFIG_FILE = "data/config.json"

DEFAULT_CONFIG = {
    "download_path": "data/downloads",
    "schedule_cron": "0 2 * * *",  # Default to 2 AM daily
    "months_ago": 12,
    "enabled": False
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        with open(CONFIG_FILE, 'r') as f:
            return {**DEFAULT_CONFIG, **json.load(f)}
    return DEFAULT_CONFIG

def save_config(config):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config, f)

scheduler = AsyncIOScheduler()

async def sync_job():
    from .photos import get_photos_service, get_old_photos_page
    from .downloader import download_photo

    config = load_config()
    print(f"Starting sync job: {config}")

    service = get_photos_service()
    if not service:
        print("Failed to get photos service. Sync aborted.")
        return

    next_page_token = None
    total_downloaded = 0

    while True:
        items, next_page_token = get_old_photos_page(service, months_ago=config['months_ago'], page_token=next_page_token)
        if not items and not next_page_token:
            break

        print(f"Syncing page of {len(items)} photos...")
        for item in items:
            success, msg = await download_photo(item, config['download_path'])
            if success:
                total_downloaded += 1
                if total_downloaded % 10 == 0:
                    print(f"Downloaded {total_downloaded} photos...")

        if not next_page_token:
            break

    print(f"Sync job complete. Total downloaded: {total_downloaded}")

def update_scheduler():
    config = load_config()
    scheduler.remove_all_jobs()
    if config['enabled']:
        scheduler.add_job(sync_job, CronTrigger.from_crontab(config['schedule_cron']), id="sync_job")
        print(f"Scheduler updated: Sync job enabled at {config['schedule_cron']}")
    else:
        print("Scheduler updated: Sync job disabled")
