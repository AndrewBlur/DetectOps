from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List

from celery.result import AsyncResult
from app.celery_app import celery_app

from app.tasks.image_tasks import process_batch_upload
from app.database import get_db
from app.images.models import Image
from app.auth.security import get_current_user
from app.images.schemas import ImageResponse,PaginatedImageResponse
from app.utils.blob_service import upload_to_blob,generate_signed_url,delete_blob


router = APIRouter(prefix="/images",tags=["images"])

@router.post("/upload/batch", status_code=202)
async def enqueue_batch_upload(
    files: List[UploadFile],
    current_user=Depends(get_current_user)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    # Convert files to memory payload (must serialize)
    payload = []
    for file in files:
        content = await file.read()
        payload.append({
            "filename": file.filename,
            "data": content.decode("latin1")  # safe reversible encoding
        })

    task = process_batch_upload.delay(payload, current_user.id)

    return {
        "message": "Batch upload is being processed",
        "task_id": task.id,
        "total_files": len(files)
    }

@router.post("/upload",response_model=ImageResponse,status_code=201)
async def upload_image(file:UploadFile, db:Session=Depends(get_db), current_user=Depends(get_current_user)):
    
    contents = await file.read()
    blob_name = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"

    try:
        upload_to_blob(blob_name,contents)

    except Exception as e:
        raise HTTPException(status_code=500,detail="Failed to upload image to blob storage")
    
    signed_url = generate_signed_url(blob_name)

    new_image = Image(filepath=blob_name, storage_url=signed_url, user_id=current_user.id,uploaded_at=datetime.now())
    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return new_image

@router.get("/mine", status_code=200,response_model=PaginatedImageResponse)
def get_my_images(
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    
    offset = (page - 1) * page_size

    total = db.query(Image).filter(Image.user_id == current_user.id).count()

    images = (
        db.query(Image)
        .filter(Image.user_id == current_user.id)
        .order_by(Image.uploaded_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "images": images,
        "total": total
    }

@router.delete("/{image_id}",status_code=204)
def delete_image(image_id:int, db:Session=Depends(get_db), current_user=Depends(get_current_user)):

    image = db.query(Image).filter(Image.id == image_id, Image.user_id == current_user.id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    blob_name = image.filepath

    try:
        delete_blob(blob_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete image from blob storage")
    
    db.delete(image)
    db.commit()


@router.get("/upload/batch/status/{task_id}")
def get_batch_upload_status(task_id: str):
    task = AsyncResult(task_id, app=celery_app)
    return {
        "task_id": task_id,
        "state": task.state,
        "result": task.result
    }