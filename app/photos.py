from googleapiclient.discovery import build
from datetime import datetime, timedelta
from .auth import get_credentials

def get_photos_service():
    creds = get_credentials()
    if not creds:
        return None
    return build('photoslibrary', 'v1', credentials=creds, static_discovery=False)

def get_old_photos_page(service, months_ago=12, page_token=None):
    # Calculate date threshold
    threshold_date = datetime.now() - timedelta(days=months_ago * 30)

    start_date = {"year": 1900, "month": 1, "day": 1}
    end_date = {
        "year": threshold_date.year,
        "month": threshold_date.month,
        "day": threshold_date.day
    }

    body = {
        "filters": {
            "dateFilter": {
                "ranges": [{
                    "startDate": start_date,
                    "endDate": end_date
                }]
            }
        },
        "pageSize": 100
    }

    if page_token:
        body['pageToken'] = page_token

    results = service.mediaItems().search(body=body).execute()
    return results.get('mediaItems', []), results.get('nextPageToken')
