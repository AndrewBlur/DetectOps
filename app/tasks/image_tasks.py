import uuid
from datetime import datetime

import app.models

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.images.models import Image
from app.utils.blob_service import upload_to_blob, generate_signed_url,delete_blob


@celery_app.task(name="process_batch_upload", bind=True)
def process_batch_upload(self, files: list, project_id: int):
    db = SessionLocal()

    results = []
    failures = []
    total = len(files)

    try:
        for index, file in enumerate(files):
            filename = file["filename"]
            contents = file["data"].encode("latin1")

            blob_name = f"{project_id}/{uuid.uuid4()}_{filename}"

            # Send progress update
            self.update_state(
                state="PROGRESS",
                meta={
                    "current": index + 1,
                    "total": total,
                    "message": f"Uploading {filename}..."
                }
            )

            try:
                upload_to_blob(blob_name, contents)
                signed_url = generate_signed_url(blob_name)

                new_image = Image(
                    filepath=blob_name,
                    storage_url=signed_url,
                    project_id=project_id,
                    uploaded_at=datetime.now(),
                    is_annotated=False
                )

                db.add(new_image)
                db.commit()
                db.refresh(new_image)

                results.append({
                    "filename": filename,
                    "image_id": new_image.id,
                    "url": signed_url,
                    "status": "success"
                })

            except Exception as e:
                failures.append({
                    "filename": filename,
                    "error": str(e)
                })

        return {
            "processed": len(results),
            "failed": failures,
            "success_items": results,
            "total": total
        }

    finally:
        db.close()