from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from datetime import datetime
from typing import List

from app.database import get_db
from app.annotations.models import Annotation
from app.annotations.schemas import AnnotationRequest, AnnotationResponse
from app.auth.security import get_current_user
from app.images.models import Image 

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.get("/tags", response_model=List[str], status_code=200)
def get_tags(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tags = (
        db.query(distinct(Annotation.tag))
        .filter(Annotation.user_id == current_user.id)
        .all()
    )
    res = [t[0] for t in tags]

    return res

@router.post("", response_model=AnnotationResponse, status_code=201)
def create_annotation(
    annotation_request: AnnotationRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):  
    

    image = (
        db.query(Image)
        .filter(
            Image.id == annotation_request.image_id,
            Image.user_id == current_user.id
        )
        .first()
    )

    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # 2️⃣ Create annotation
    new_annotation = Annotation(
        image_id=annotation_request.image_id,
        user_id=current_user.id,
        x=annotation_request.annotation.x,
        y=annotation_request.annotation.y,
        w=annotation_request.annotation.w,
        h=annotation_request.annotation.h,
        tag=annotation_request.annotation.tag,
        created_at=datetime.now(),
    )

    db.add(new_annotation)

    # 3️⃣ Update image flag
    image.is_annotated = True

    # 4️⃣ Commit once
    db.commit()

    db.refresh(new_annotation)
    db.refresh(image)

    return new_annotation

@router.get("/{image_id}", response_model=List[AnnotationResponse], status_code=200)
def get_annotation(
    image_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    annotation = (
        db.query(Annotation)
        .filter(
            Annotation.image_id == image_id,
            Annotation.user_id == current_user.id,
        )
    )

    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    return annotation


@router.delete("/delete/{annotation_id}/{image_id}", status_code=204)
def delete_annotation(
    annotation_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 1. Retrieve the annotation and verify ownership
    annotation = (
        db.query(Annotation)
        .filter(
            Annotation.id == annotation_id,
            Annotation.user_id == current_user.id
        )
        .first()
    )

    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    # 2. Count total annotations for this image
    annotation_count = (
        db.query(Annotation)
        .filter(
            Annotation.image_id == image_id,
            Annotation.user_id == current_user.id
        )
        .count()
    )

    # 3. If it's the last annotation, update the image
    if annotation_count == 1:
        image = db.query(Image).filter(Image.id == image_id).first()
        if image:
            image.is_annotated = False

    # 4. Delete the annotation and commit
    db.delete(annotation)
    db.commit()

