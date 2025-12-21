from pydantic import BaseModel, Field,ConfigDict
from typing import Optional
from datetime import datetime

class AnnotationIn(BaseModel):
    x: float
    y: float
    w: float
    h: float
    tag: str

class AnnotationRequest(BaseModel):
    image_id: int
    annotation: AnnotationIn

class AnnotationResponse(BaseModel):
    id: int
    image_id: int
    user_id: int
    x: float
    y: float
    w: float
    h: float
    tag: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
