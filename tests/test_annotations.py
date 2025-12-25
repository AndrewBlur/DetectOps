import io
from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from app.auth.security import get_current_user
from app.auth.models import User


@pytest.fixture(autouse=True)
def override_user(test_user: User, client: TestClient):
    from app.core.main import app
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def test_project(client: TestClient):
    response = client.post("/projects/", json={"name": "Test Project", "description": "A project for testing"})
    assert response.status_code == 201
    return response.json()

@pytest.fixture
def test_image(client: TestClient, test_project):
    project_id = test_project["id"]
    file_content = b"fake image data"

    with patch("app.images.routes.upload_to_blob"), \
         patch("app.images.routes.generate_signed_url") as mock_url:
        mock_url.return_value = "https://signed.url/test.jpg"
        response = client.post(
            f"/projects/{project_id}/images/upload",
            files={"file": ("test.jpg", io.BytesIO(file_content), "image/jpeg")}
        )
    assert response.status_code == 201
    return response.json()

def test_create_annotation_success(client: TestClient, test_project, test_image):
    project_id = test_project["id"]
    image_id = test_image["id"]

    annotation_data = {
        "image_id": image_id,
        "annotation": {"x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4, "tag": "test"}
    }

    response = client.post(f"/projects/{project_id}/annotations", json=annotation_data)
    assert response.status_code == 201
    data = response.json()
    assert data["image_id"] == image_id
    assert data["tag"] == "test"

def test_get_annotations_for_image(client: TestClient, test_project, test_image):
    project_id = test_project["id"]
    image_id = test_image["id"]

    # First, create an annotation
    annotation_data = {
        "image_id": image_id,
        "annotation": {"x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4, "tag": "test"}
    }
    client.post(f"/projects/{project_id}/annotations", json=annotation_data)

    # Now, get the annotations
    response = client.get(f"/projects/{project_id}/annotations/{image_id}")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["tag"] == "test"

def test_get_tags_for_project(client: TestClient, test_project, test_image):
    project_id = test_project["id"]
    image_id = test_image["id"]

    # Create a few annotations with different tags
    client.post(f"/projects/{project_id}/annotations", json={"image_id": image_id, "annotation": {"x": 0, "y": 0, "w": 0, "h": 0, "tag": "tag1"}})
    client.post(f"/projects/{project_id}/annotations", json={"image_id": image_id, "annotation": {"x": 0, "y": 0, "w": 0, "h": 0, "tag": "tag2"}})
    client.post(f"/projects/{project_id}/annotations", json={"image_id": image_id, "annotation": {"x": 0, "y": 0, "w": 0, "h": 0, "tag": "tag1"}})

    response = client.get(f"/projects/{project_id}/annotations/tags")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert "tag1" in data
    assert "tag2" in data

def test_delete_annotation_success(client: TestClient, test_project, test_image):
    project_id = test_project["id"]
    image_id = test_image["id"]

    # Create an annotation
    annotation_data = {
        "image_id": image_id,
        "annotation": {"x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4, "tag": "test"}
    }
    create_response = client.post(f"/projects/{project_id}/annotations", json=annotation_data)
    annotation_id = create_response.json()["id"]

    # Delete the annotation
    response = client.delete(f"/projects/{project_id}/annotations/delete/{annotation_id}/{image_id}")
    assert response.status_code == 204

    # Verify it's deleted
    response = client.get(f"/projects/{project_id}/annotations/{image_id}")
    assert len(response.json()) == 0