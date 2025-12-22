from sqlalchemy import Column, Integer, String, ForeignKey, DateTime,Boolean
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer,primary_key=True, index=True)
    storage_url = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.now)
    is_annotated = Column(Boolean, default=False,nullable=False)
    project = relationship("Project",back_populates="images")
    annotations = relationship(
        "Annotation",
        back_populates="image",
        cascade="all, delete-orphan"
    )