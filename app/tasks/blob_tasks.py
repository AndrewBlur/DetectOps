from app.celery_app import celery_app
from app.utils.blob_service import delete_blob


@celery_app.task(
    name="delete_blob_task",
    autoretry_for=(Exception,),
    retry_kwargs={"max_retries": 5, "countdown": 10},
)
def delete_blob_task(filepath: str):
    delete_blob(filepath)
