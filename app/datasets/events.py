from sqlalchemy import event
from app.datasets.models import Dataset
from app.tasks.blob_tasks import delete_blob_task


@event.listens_for(Dataset, "after_delete")
def enqueue_dataset_blob_delete(mapper, connection, target):
    """Delete the dataset zip blob when the dataset is deleted."""
    if target.blob_path:
        delete_blob_task.delay(target.blob_path)
