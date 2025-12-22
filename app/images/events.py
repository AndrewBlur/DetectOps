from sqlalchemy import event
from app.images.models import Image
from app.tasks.blob_tasks import delete_blob_task


@event.listens_for(Image, "after_delete")
def enqueue_blob_delete(mapper, connection, target):
    if target.filepath:
        delete_blob_task.delay(target.filepath)
