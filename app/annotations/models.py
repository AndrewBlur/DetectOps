from sqlalchemy import Column, Integer, String, ForeignKey, DateTime,Float
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"), nullable=False)
    x = Column(Float, nullable=False)
    y = Column(Float, nullable=False)
    w = Column(Float, nullable=False)
    h = Column(Float, nullable=False)
    tag = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    image = relationship("Image", back_populates="annotations")

