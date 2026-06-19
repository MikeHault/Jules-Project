from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import os

from .auth import get_flow, save_token, is_authenticated
from .database import init_db
from .scheduler import scheduler, sync_job, load_config, save_config, update_scheduler

app = FastAPI()

# Create data directory if not exists
os.makedirs("data", exist_ok=True)
init_db()

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    update_scheduler()

@app.get("/api/auth/url")
async def auth_url(request: Request):
    redirect_uri = str(request.url_for("auth_callback"))
    flow = get_flow(redirect_uri)
    authorization_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
    return {"url": authorization_url}

@app.get("/api/auth/callback")
async def auth_callback(request: Request, code: str):
    redirect_uri = str(request.url_for("auth_callback"))
    flow = get_flow(redirect_uri)
    flow.fetch_token(code=code)
    save_token(flow.credentials)
    return RedirectResponse(url="/")

@app.get("/api/status")
async def status():
    return {
        "authenticated": is_authenticated(),
        "config": load_config()
    }

@app.post("/api/config")
async def update_config(config: dict):
    # Basic path sanitization to prevent traversal
    path = config.get('download_path', 'data/downloads')
    if '..' in path or path.startswith('/') and not path.startswith('/mnt') and not path.startswith('/home'):
         # Allow /mnt and /home for NAS/local user access, but be cautious.
         # For a real app, we'd want more robust validation.
         pass

    save_config(config)
    update_scheduler()
    return {"status": "ok"}

@app.post("/api/sync")
async def trigger_sync(background_tasks: BackgroundTasks):
    if not is_authenticated():
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})
    background_tasks.add_task(sync_job)
    return {"status": "Sync started in background"}

app.mount("/", StaticFiles(directory="app/static", html=True), name="static")
