from celery import Celery

import app.models

celery_app = Celery(
    "detectops",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1"
)

celery_app.autodiscover_tasks(['app', 'app.tasks'])

celery_app.conf.update(
    task_serializer='json',
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    )

# Import tasks after celery_app is created to avoid circular imports
import app.tasks.dataset_tasks  # noqa: F401
import app.tasks.image_tasks    # noqa: F401
