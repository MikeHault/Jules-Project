import os
import json
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

CLIENT_SECRETS_FILE = "data/client_secret.json"
TOKEN_FILE = "data/token.json"
SCOPES = ['https://www.googleapis.com/auth/photoslibrary.readonly']

def get_flow(redirect_uri):
    return Flow.from_client_secrets_file(
        CLIENT_SECRETS_FILE,
        scopes=SCOPES,
        redirect_uri=redirect_uri
    )

def save_token(credentials):
    with open(TOKEN_FILE, 'w') as f:
        f.write(credentials.to_json())

def load_token():
    if os.path.exists(TOKEN_FILE):
        return Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    return None

def get_credentials():
    creds = load_token()
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
        save_token(creds)
    return creds

def is_authenticated():
    creds = load_token()
    return creds and creds.valid
