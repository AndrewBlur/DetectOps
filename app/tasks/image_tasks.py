import uuid
from datetime import datetime
from app.celery_app import celery_app

from app.database import SessionLocal
from app.annotations.models import Annotation
from app.images.models import Image
from app.auth.models import User
from app.utils.blob_service import upload_to_blob, generate_signed_url


@celery_app.task(name="process_batch_upload")
def process_batch_upload(files: list, user_id: int):
    db = SessionLocal()

    results = []
    failures = []

    try:
        for file in files:
            filename = file["filename"]
            contents = file["data"].encode("latin1")  # restore original bytes

            blob_name = f"{user_id}/{uuid.uuid4()}_{filename}"

            try:
                # Upload to Azure Blob
                upload_to_blob(blob_name, contents)
                signed_url = generate_signed_url(blob_name)

                # Write DB entry
                new_image = Image(
                    filepath=blob_name,
                    storage_url=signed_url,
                    user_id=user_id,
                    uploaded_at=datetime.now(),
                    is_annotated=False
                )
                db.add(new_image)
                db.commit()
                db.refresh(new_image)

                results.append({
                    "filename": filename,
                    "blob": blob_name,
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
            "total": len(files)
        }

    finally:
        db.close()
