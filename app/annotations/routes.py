from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from sqlalchemy import distinct, and_
from datetime import datetime
from typing import List

from app.core.database import get_db
from app.projects.models import Project
from app.annotations.models import Annotation
from app.annotations.schemas import AnnotationRequest, AnnotationResponse
from app.auth.security import get_current_user
from app.auth.models import User
from app.images.models import Image

router = APIRouter(prefix="/projects/{project_id}/annotations", tags=["annotations"])

# Dependency to verify project ownership
def get_project_for_user(project_id: int = Path(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.get("/tags", response_model=List[str], status_code=200)
def get_tags(
    project: Project = Depends(get_project_for_user),
    db: Session = Depends(get_db)
):
    tags = (
        db.query(distinct(Annotation.tag))
        .join(Image)
        .filter(Image.project_id == project.id)
        .all()
    )
    res = [t[0] for t in tags]
    return res

@router.post("", response_model=AnnotationResponse, status_code=201)
def create_annotation(
    annotation_request: AnnotationRequest,
    project: Project = Depends(get_project_for_user),
    db: Session = Depends(get_db),
):
    image = (
        db.query(Image)
        .filter(
            Image.id == annotation_request.image_id,
            Image.project_id == project.id
        )
        .first()
    )

    if not image:
        raise HTTPException(status_code=404, detail="Image not found in this project")

    new_annotation = Annotation(
        image_id=annotation_request.image_id,
        x=annotation_request.annotation.x,
        y=annotation_request.annotation.y,
        w=annotation_request.annotation.w,
        h=annotation_request.annotation.h,
        tag=annotation_request.annotation.tag,
        created_at=datetime.now(),
    )

    db.add(new_annotation)
    image.is_annotated = True
    db.commit()

    db.refresh(new_annotation)
    db.refresh(image)

    return new_annotation

@router.get("/{image_id}", response_model=List[AnnotationResponse], status_code=200)
def get_annotations_for_image(
    image_id: int,
    project: Project = Depends(get_project_for_user),
    db: Session = Depends(get_db),
):
    # Ensure the image belongs to the project
    image = db.query(Image).filter(Image.id == image_id, Image.project_id == project.id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found in this project")

    annotations = (
        db.query(Annotation)
        .filter(Annotation.image_id == image_id)
        .all()
    )
    return annotations

@router.delete("/delete/{annotation_id}/{image_id}", status_code=204)
def delete_annotation(
    annotation_id: int,
    image_id: int,
    project: Project = Depends(get_project_for_user),
    db: Session = Depends(get_db),
):
    # Ensure the image belongs to the project
    image = db.query(Image).filter(Image.id == image_id, Image.project_id == project.id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found in this project")

    annotation = (
        db.query(Annotation)
        .filter(Annotation.id == annotation_id, Annotation.image_id == image.id)
        .first()
    )

    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    db.delete(annotation)
    db.flush()

    # Check if any annotations are left for the image
    remaining_annotations = db.query(Annotation).filter(Annotation.image_id == image_id).count()
    if remaining_annotations == 0:
        image.is_annotated = False

    db.commit()
