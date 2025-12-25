from fastapi import APIRouter, Depends, HTTPException, UploadFile, Path
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List

from celery.result import AsyncResult
from app.core.celery_app import celery_app
from app.tasks.image_tasks import process_batch_upload

from app.core.database import get_db
from app.projects.models import Project
from app.images.models import Image
from app.images.cache import get_signed_url_cached
from app.auth.security import get_current_user
from app.auth.models import User
from app.images.schemas import ImageResponse, PaginatedImageResponse
from app.utils.blob_service import upload_to_blob, generate_signed_url, delete_blob

router = APIRouter(prefix="/projects/{project_id}/images", tags=["images"])

# Dependency to verify project ownership
def get_project_for_user(project_id: int = Path(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/upload/batch", status_code=202)
async def enqueue_batch_upload(
    files: List[UploadFile],
    project: Project = Depends(get_project_for_user)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    payload = []
    for file in files:
        content = await file.read()
        payload.append({
            "filename": file.filename,
            "data": content.decode("latin1")
        })

    task = process_batch_upload.delay(payload, project.id)

    return {
        "message": "Batch upload is being processed",
        "task_id": task.id,
        "total_files": len(files)
    }

@router.post("/upload", response_model=ImageResponse, status_code=201)
async def upload_image(
    file: UploadFile,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_for_user)
):
    contents = await file.read()
    blob_name = f"{project.id}/{uuid.uuid4()}_{file.filename}"

    try:
        upload_to_blob(blob_name, contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload image to blob storage")

    signed_url = generate_signed_url(blob_name)

    new_image = Image(
        filepath=blob_name,
        storage_url=signed_url,
        project_id=project.id,
        uploaded_at=datetime.now(),
        is_annotated=False
    )
    db.add(new_image)
    db.commit()
    db.refresh(new_image)

    return new_image

@router.get("/", status_code=200, response_model=PaginatedImageResponse)
def get_project_images(
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_for_user)
):
    offset = (page - 1) * page_size

    total = db.query(Image).filter(Image.project_id == project.id, Image.is_annotated == False).count()

    images = (
        db.query(Image)
        .filter(Image.project_id == project.id, Image.is_annotated == False)
        .order_by(Image.uploaded_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    for img in images:
        img.storage_url = get_signed_url_cached(img)

    return {
        "images": images,
        "total": total
    }

@router.get("/annotated", status_code=200, response_model=PaginatedImageResponse)
def get_project_annotated_images(
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_for_user)
):
    offset = (page - 1) * page_size

    total = db.query(Image).filter(Image.project_id == project.id, Image.is_annotated == True).count()

    images = (
        db.query(Image)
        .filter(Image.project_id == project.id, Image.is_annotated == True)
        .order_by(Image.uploaded_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    for img in images:
        img.storage_url = get_signed_url_cached(img)

    return {
        "images": images,
        "total": total
    }

@router.get("/{image_id}", status_code=200, response_model=ImageResponse)
def get_image(
    image_id: int,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_for_user)
):
    image = db.query(Image).filter(Image.id == image_id, Image.project_id == project.id).first()

    if not image:
        raise HTTPException(status_code=404, detail="Image not found in this project")

    image.storage_url = get_signed_url_cached(image)

    return image

@router.delete("/{image_id}", status_code=204)
def delete_image(
    image_id: int,
    db: Session = Depends(get_db),
    project: Project = Depends(get_project_for_user)
):
    image = (
        db.query(Image)
        .filter(Image.id == image_id, Image.project_id == project.id)
        .first()
    )

    if not image:
        raise HTTPException(status_code=404, detail="Image not found in this project")

    db.delete(image)
    db.commit()

# This route is not project specific, so it should be moved out of this router
# @router.get("/upload/batch/status/{task_id}")
# def get_batch_upload_status(task_id: str):
#     task = AsyncResult(task_id, app=celery_app)
#     return {
#         "task_id": task_id,
#         "state": task.state,
#         "result": task.result
#     }