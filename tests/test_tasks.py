from unittest.mock import patch
from fastapi.testclient import TestClient

def test_get_batch_status(client: TestClient):
    with patch("app.tasks.routes.AsyncResult") as mock_async:
        mock_async.return_value.state = "SUCCESS"
        mock_async.return_value.result = {"done": True}

        response = client.get("/tasks/upload/batch/status/task123")

        assert response.status_code == 200
        body = response.json()

        assert body["task_id"] == "task123"
        assert body["state"] == "SUCCESS"
        assert body["result"] == {"done": True}
