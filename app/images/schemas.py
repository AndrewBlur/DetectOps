from pydantic import BaseModel,ConfigDict
from datetime import datetime
from typing import List

class ImageResponse(BaseModel):
    id: int
    filepath: str
    storage_url:str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedImageResponse(BaseModel):
    images: List[ImageResponse]
    total: int