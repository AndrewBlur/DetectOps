import asyncio
import json
from fastapi import APIRouter
from celery.result import AsyncResult
from sse_starlette.sse import EventSourceResponse
from app.core.celery_app import celery_app

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("/upload/batch/stream/{task_id}")
async def stream_batch_upload_status(task_id: str):
    """
    SSE endpoint that streams task status updates in real-time.
    Client connects once and receives updates until task completes.
    """
    async def event_generator():
        while True:
            task = AsyncResult(task_id, app=celery_app)
            
            # Prepare the status data
            data = {
                "task_id": task_id,
                "state": task.state,
                "result": task.result if task.ready() else task.info
            }
            
            yield {
                "event": "status",
                "data": json.dumps(data)
            }
            
            # Stop streaming if task is complete (success or failure)
            if task.ready():
                break
            
            # Wait 1 second before next check
            await asyncio.sleep(1)
    
    return EventSourceResponse(event_generator())

@router.get("/upload/batch/status/{task_id}")
def get_batch_upload_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "state": task.state,
        "result": task.result
    }


