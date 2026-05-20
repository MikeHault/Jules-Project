import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta
@patch('app.photos.get_photos_service')
def test_get_old_photos_page(mock_get_service):
    from app.photos import get_old_photos_page
    mock_service = MagicMock()

    # Mock API response
    mock_search = mock_service.mediaItems().search
    mock_search.return_value.execute.return_value = {
        'mediaItems': [
            {'id': '1', 'filename': 'photo1.jpg', 'baseUrl': 'url1'},
            {'id': '2', 'filename': 'photo2.jpg', 'baseUrl': 'url2'}
        ],
        'nextPageToken': 'token1'
    }

    items, token = get_old_photos_page(mock_service, months_ago=12)

    assert len(items) == 2
    assert items[0]['filename'] == 'photo1.jpg'
    assert token == 'token1'

@patch('app.downloader.SessionLocal')
@patch('httpx.AsyncClient.get')
@pytest.mark.asyncio
async def test_download_photo(mock_get, mock_session):
    from app.downloader import download_photo
    import os

    # Mock DB
    mock_db = MagicMock()
    mock_session.return_value = mock_db
    mock_db.query().filter().first.return_value = None

    # Mock HTTP response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.content = b'fake photo data'
    mock_get.return_value = mock_response

    item = {'id': '1', 'filename': 'test.jpg', 'baseUrl': 'http://test.com'}
    target_dir = 'test_downloads'

    with patch('builtins.open', MagicMock()):
        success, msg = await download_photo(item, target_dir)

    assert success is True
    assert msg == "Success"
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
