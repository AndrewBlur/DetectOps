from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Dataset(Base):
    __tablename__ = 'datasets'
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    version = Column(String, nullable=False)
    zip_url = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    project = relationship("Project", back_populates="datasets")
    