import os
import httpx
from .database import SessionLocal, DownloadedPhoto

async def download_photo(item, target_dir):
    photo_id = item['id']
    filename = item['filename']
    # The '=d' suffix ensures original quality download
    download_url = f"{item['baseUrl']}=d"

    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.join(target_dir, filename)

    # Check if already downloaded
    db = SessionLocal()
    try:
        existing = db.query(DownloadedPhoto).filter(DownloadedPhoto.id == photo_id).first()
        if existing and os.path.exists(file_path):
            return False, "Already downloaded"

        async with httpx.AsyncClient() as client:
            response = await client.get(download_url, follow_redirects=True)
            if response.status_code == 200:
                with open(file_path, 'wb') as f:
                    f.write(response.content)

                if not existing:
                    new_photo = DownloadedPhoto(id=photo_id, filename=filename)
                    db.add(new_photo)
                    db.commit()
                return True, "Success"
            else:
                return False, f"Failed to download: {response.status_code}"
    finally:
        db.close()
