from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer,primary_key=True, index=True)
    storage_url = Column(String, nullable=False)
    filepath = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.now)

    owner = relationship("User",back_populates="images")

