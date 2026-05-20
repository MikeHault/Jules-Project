# Google Photos Bulk Downloader

A web application designed to bulk download photos from Google Photos to a local directory or NAS. Specifically built to target photos older than 12 months for archival purposes.

## Features

- **OAuth2 Authentication**: Secure connection to your Google Photos library.
- **Bulk Archival**: Automatically identifies and downloads media older than 12 months.
- **Original Quality**: Downloads the original resolution files using the `=d` parameter.
- **Scheduling**: Built-in cron-style scheduler for automated daily or weekly backups.
- **NAS Support**: Configurable download paths.
- **Automation Ready**: REST API endpoint for integration with local LLMs or Home Assistant.
- **Duplicate Prevention**: Tracks downloaded items in a local SQLite database.

## Prerequisites

1. **Google Cloud Project**:
   - Create a project in the [Google Cloud Console](https://console.cloud.google.com/).
   - Enable the **Photos Library API**.
   - Create **OAuth 2.0 Client IDs** (Desktop or Web application).
   - Download the JSON credentials and save them as `data/client_secret.json` in this project.

2. **Python 3.10+**

## Installation

1. Clone the repository and navigate to the directory.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Start the server:
   ```bash
   python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
2. Open your browser to `http://localhost:8000`.

## Setup Instructions

1. **Authenticate**: Click "Connect Google Account" on the dashboard to link your library.
2. **Configure**:
   - Set the **Download Path** (e.g., `/mnt/nas/photos`).
   - Set the **Schedule** using standard cron syntax (e.g., `0 2 * * *` for 2 AM daily).
   - Toggle **Enable Scheduled Sync** and click **Save Configuration**.
3. **Manual Sync**: Click "Start Manual Sync Now" to trigger a download immediately.

## Automation & API

You can trigger a sync via a simple POST request, making it easy to automate from Home Assistant or a local LLM:

```bash
curl -X POST http://localhost:8000/api/sync
```

## Security Note

- This application is intended for local network use. Ensure your firewall settings protect the web interface if exposed.
- Path validation is implemented but always be cautious when providing absolute paths.
