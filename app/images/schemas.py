from pydantic import BaseModel,ConfigDict
from datetime import datetime

class ImageResponse(BaseModel):
    id: int
    filepath: str
    storage_url:str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)

