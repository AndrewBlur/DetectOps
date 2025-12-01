from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from typing import List


from app.database import get_db
from app.images.models import Image
from app.auth.security import get_current_user
from app.images.schemas import ImageResponse
from app.utils.blob_service import upload_to_blob,generate_signed_url,delete_blob


router = APIRouter(prefix="/images",tags=["images"])

@router.post("/upload/batch",status_code=201,response_model=List[ImageResponse])
async def upload_images(files:List[UploadFile], db:Session=Depends(get_db), current_user=Depends(get_current_user)):
    if not files or len(files) == 0:
        raise HTTPException(status_code=400,detail="No files provided for upload")
    
    uploaded_images = []

    for file in files:
        try:
            contents = await file.read()
            blob_name = f"{current_user.id}/{uuid.uuid4()}_{file.filename}"

            try:
                upload_to_blob(blob_name,contents)

            except Exception as e:
                raise HTTPException(status_code=500,detail=f"Failed to upload image {file.filename} to blob storage")
            
            signed_url = generate_signed_url(blob_name)

            new_image = Image(filepath=blob_name, storage_url=signed_url, user_id=current_user.id,uploaded_at=datetime.now())
            db.add(new_image)

            uploaded_images.append(new_image)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500,detail=f"Failed to process image {file.filename}")
        
    db.commit()
    for img in uploaded_images:
        db.refresh(img)

    return uploaded_images

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

@router.get("/mine",response_model=List[ImageResponse],status_code=200)
def get_my_images(db:Session=Depends(get_db), current_user=Depends(get_current_user)):

    images = db.query(Image).filter(Image.user_id == current_user.id).all()
    return images

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

