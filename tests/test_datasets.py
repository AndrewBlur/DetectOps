import io
from unittest.mock import patch, MagicMock
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
    """Create a test image with annotation."""
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


@pytest.fixture
def annotated_image(client: TestClient, test_project, test_image):
    """Create an annotated image."""
    project_id = test_project["id"]
    image_id = test_image["id"]
    
    annotation_data = {
        "image_id": image_id,
        "annotation": {"x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4, "tag": "test_class"}
    }
    client.post(f"/projects/{project_id}/annotations", json=annotation_data)
    return test_image


class TestGetDatasets:
    """Tests for GET /projects/{project_id}/datasets endpoint."""

    def test_get_datasets_empty(self, client: TestClient, test_project):
        """Test getting datasets when none exist."""
        project_id = test_project["id"]
        
        with patch("app.datasets.routes.redis_client"):
            response = client.get(f"/projects/{project_id}/datasets")
        
        assert response.status_code == 200
        assert response.json() == []

    def test_get_datasets_unauthorized_project(self, client: TestClient, test_user):
        """Test getting datasets for non-existent project."""
        response = client.get("/projects/99999/datasets")
        assert response.status_code == 404
        assert response.json()["detail"] == "Project not found"


class TestExportDataset:
    """Tests for POST /projects/{project_id}/datasets/export endpoint."""

    def test_export_dataset_success(self, client: TestClient, test_project, annotated_image):
        """Test successful dataset export triggers Celery task."""
        project_id = test_project["id"]
        
        with patch("app.datasets.routes.export_dataset_task.delay") as mock_task:
            mock_task.return_value = MagicMock(id="test-task-id")
            
            response = client.post(
                f"/projects/{project_id}/datasets/export",
                params={"train_split": 0.7, "val_split": 0.15, "test_split": 0.15}
            )
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "test-task-id"
        assert data["message"] == "Dataset export started"
        
        # Verify task was called with correct arguments
        mock_task.assert_called_once_with(project_id, 0.7, 0.15, 0.15)

    def test_export_dataset_invalid_splits(self, client: TestClient, test_project):
        """Test that splits not summing to 1.0 returns error."""
        project_id = test_project["id"]
        
        response = client.post(
            f"/projects/{project_id}/datasets/export",
            params={"train_split": 0.5, "val_split": 0.2, "test_split": 0.1}
        )
        
        assert response.status_code == 400
        assert response.json()["detail"] == "Splits must sum to 1.0"

    def test_export_dataset_unauthorized_project(self, client: TestClient):
        """Test exporting from non-existent project."""
        response = client.post("/projects/99999/datasets/export")
        assert response.status_code == 404


class TestGetExportStatus:
    """Tests for GET /tasks/export/dataset/status/{task_id} endpoint."""

    def test_get_export_status_success(self, client: TestClient):
        """Test getting task status."""
        with patch("app.tasks.routes.AsyncResult") as mock_result:
            mock_task = MagicMock()
            mock_task.state = "PROGRESS"
            mock_task.ready.return_value = False
            mock_task.info = {"current": 5, "total": 10, "phase": "Processing train"}
            mock_result.return_value = mock_task
            
            response = client.get("/tasks/export/dataset/status/test-task-id")
        
        assert response.status_code == 200
        data = response.json()
        assert data["task_id"] == "test-task-id"
        assert data["state"] == "PROGRESS"
        assert data["result"]["current"] == 5

    def test_get_export_status_completed(self, client: TestClient):
        """Test getting status of completed task."""
        with patch("app.tasks.routes.AsyncResult") as mock_result:
            mock_task = MagicMock()
            mock_task.state = "SUCCESS"
            mock_task.ready.return_value = True
            mock_task.result = {"status": "success", "dataset_id": 1, "version": 1}
            mock_result.return_value = mock_task
            
            response = client.get("/tasks/export/dataset/status/test-task-id")
        
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "SUCCESS"
        assert data["result"]["status"] == "success"


class TestDeleteDataset:
    """Tests for DELETE /projects/{project_id}/datasets/{dataset_id} endpoint."""

    def test_delete_dataset_not_found(self, client: TestClient, test_project):
        """Test deleting non-existent dataset."""
        project_id = test_project["id"]
        
        response = client.delete(f"/projects/{project_id}/datasets/99999")
        
        assert response.status_code == 404
        assert response.json()["detail"] == "Dataset not found"

    def test_delete_dataset_success(self, client: TestClient, test_project, db_session):
        """Test successful dataset deletion."""
        from app.datasets.models import Dataset
        
        project_id = test_project["id"]
        
        # Create a dataset directly in DB
        dataset = Dataset(
            project_id=project_id,
            version=1,
            zip_url="https://example.com/test.zip",
            classes=["class1", "class2"],
            train_split=0.7,
            val_split=0.15,
            test_split=0.15
        )
        db_session.add(dataset)
        db_session.commit()
        db_session.refresh(dataset)
        dataset_id = dataset.id
        
        with patch("app.datasets.routes.redis_client"), \
             patch("app.datasets.routes.delete_dataset_blob_task.delay") as mock_delete:
            mock_delete.return_value = MagicMock(id="delete-task-id")
            
            response = client.delete(f"/projects/{project_id}/datasets/{dataset_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Dataset deleted"
        assert data["dataset_id"] == dataset_id
        assert data["delete_task_id"] == "delete-task-id"
        
        # Verify delete task was triggered
        mock_delete.assert_called_once()
