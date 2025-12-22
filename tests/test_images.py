import io
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.auth.security import get_current_user
from app.auth.models import User
from app.images.models import Image

@pytest.fixture(autouse=True)
def override_user(test_user: User, client: TestClient):
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def test_project(client: TestClient):
    response = client.post("/projects/", json={"name": "Test Project", "description": "A project for testing"})
    assert response.status_code == 201
    return response.json()

def test_upload_single_image_success(client: TestClient, test_project):
    project_id = test_project["id"]
    file_content = b"fake image data"

    with patch("app.images.routes.upload_to_blob") as mock_upload, \
         patch("app.images.routes.generate_signed_url") as mock_url:

        mock_url.return_value = "https://signed.url/test.jpg"

        response = client.post(
            f"/projects/{project_id}/images/upload",
            files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")}
        )

        assert response.status_code == 201
        data = response.json()

        mock_upload.assert_called_once()
        assert data["storage_url"] == "https://signed.url/test.jpg"
        assert "id" in data

def test_upload_batch_images_success(client: TestClient, test_project):
    project_id = test_project["id"]
    files = [
        ("files", ("img1.jpg", io.BytesIO(b"123"), "image/jpeg")),
        ("files", ("img2.jpg", io.BytesIO(b"456"), "image/jpeg")),
    ]

    with patch("app.images.routes.process_batch_upload.delay") as mock_task:
        mock_task.return_value.id = "task123"

        response = client.post(f"/projects/{project_id}/images/upload/batch", files=files)

        assert response.status_code == 202
        data = response.json()

        mock_task.assert_called_once()
        assert data["task_id"] == "task123"
        assert data["total_files"] == 2
        assert data["message"] == "Batch upload is being processed"

def test_get_project_images(client: TestClient, test_project):
    project_id = test_project["id"]
    response = client.get(f"/projects/{project_id}/images/")
    assert response.status_code == 200
    data = response.json()

    assert "images" in data
    assert "total" in data
    assert isinstance(data["images"], list)

def test_get_project_annotated_images(client: TestClient, test_project):
    project_id = test_project["id"]
    response = client.get(f"/projects/{project_id}/images/annotated")
    assert response.status_code == 200
    data = response.json()

    assert "images" in data
    assert "total" in data
    assert isinstance(data["images"], list)

def test_delete_image_success(client: TestClient, test_project, db_session):
    project_id = test_project["id"]

    # Upload image
    with patch("app.images.routes.upload_to_blob"), \
         patch("app.images.routes.generate_signed_url") as mock_signed:
        mock_signed.return_value = "https://fake-url.com/test.jpg"

        upload_res = client.post(
            f"/projects/{project_id}/images/upload",
            files={"file": ("delete.jpg", io.BytesIO(b"abc"), "image/jpeg")}
        )

    image_id = upload_res.json()["id"]

    # Delete image
    response = client.delete(f"/projects/{project_id}/images/{image_id}")
    assert response.status_code == 204

    # Ensure DB row is gone
    image = db_session.query(Image).filter(Image.id == image_id).first()
    assert image is None

def test_delete_nonexistent_image(client: TestClient, test_project):
    project_id = test_project["id"]
    response = client.delete(f"/projects/{project_id}/images/9999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Image not found in this project"
