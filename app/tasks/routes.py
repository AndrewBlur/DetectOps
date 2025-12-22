from fastapi import APIRouter
from celery.result import AsyncResult
from app.celery_app import celery_app

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/upload/batch/status/{task_id}")
def get_batch_upload_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "state": task.state,
        "result": task.result
    }
