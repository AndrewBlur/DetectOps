import io
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.auth.security import get_current_user


@pytest.fixture(autouse=True)
def override_user(test_user):
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_upload_single_image_success(client: TestClient):
    file_content = b"fake image data"

    with patch("app.images.routes.upload_to_blob") as mock_upload, \
         patch("app.images.routes.generate_signed_url") as mock_url:

        mock_url.return_value = "https://signed.url/test.jpg"

        response = client.post(
            "/images/upload",
            files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")}
        )

        assert response.status_code == 201
        data = response.json()

        mock_upload.assert_called_once()
        assert data["storage_url"] == "https://signed.url/test.jpg"
        assert "id" in data


def test_upload_batch_images_success(client: TestClient):
    files = [
        ("files", ("img1.jpg", io.BytesIO(b"123"), "image/jpeg")),
        ("files", ("img2.jpg", io.BytesIO(b"456"), "image/jpeg")),
    ]

    # Patch Celery .delay()
    with patch("app.images.routes.process_batch_upload.delay") as mock_task:
        mock_task.return_value.id = "task123"

        response = client.post("/images/upload/batch", files=files)

        assert response.status_code == 202
        data = response.json()

        mock_task.assert_called_once()
        assert data["task_id"] == "task123"
        assert data["total_files"] == 2
        assert data["message"] == "Batch upload is being processed"


def test_upload_batch_no_files(client: TestClient):
    response = client.post("/images/upload/batch", files={})

    # FastAPI validation triggers BEFORE hitting route logic.
    assert response.status_code == 422
    
    # Optional: validate the structure of validation error
    detail = response.json().get("detail")

    assert isinstance(detail, list)
    assert detail[0]["type"] == "missing" or detail[0]["msg"].startswith("field required")


def test_get_my_images(client: TestClient):
    response = client.get("/images/mine")
    assert response.status_code == 200
    data = response.json()

    assert "images" in data
    assert "total" in data
    assert isinstance(data["images"], list)


def test_get_my_annotated_images(client: TestClient):
    response = client.get("/images/annotated")
    assert response.status_code == 200
    data = response.json()

    assert "images" in data
    assert "total" in data
    assert isinstance(data["images"], list)


def test_delete_image_success(client: TestClient):
    # First upload an image
    with patch("app.images.routes.upload_to_blob"), \
         patch("app.images.routes.generate_signed_url") as mock_signed:
        mock_signed.return_value = "https://fake-url.com/test.jpg"

        upload_res = client.post(
            "/images/upload",
            files={"file": ("delete.jpg", io.BytesIO(b"abc"), "image/jpeg")}
        )

    image_id = upload_res.json()["id"]

    # Delete the uploaded image
    with patch("app.images.routes.delete_blob") as mock_delete:
        response = client.delete(f"/images/{image_id}")

        mock_delete.assert_called_once()
        assert response.status_code == 204


def test_delete_nonexistent_image(client: TestClient):
    response = client.delete("/images/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Image not found"


def test_get_batch_status(client: TestClient):
    with patch("app.images.routes.AsyncResult") as mock_async:
        mock_async.return_value.state = "SUCCESS"
        mock_async.return_value.result = {"done": True}

        response = client.get("/images/upload/batch/status/task123")

        assert response.status_code == 200
        body = response.json()

        assert body["task_id"] == "task123"
        assert body["state"] == "SUCCESS"
        assert body["result"] == {"done": True}
