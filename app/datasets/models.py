from sqlalchemy import Column, Integer,Float,String, ForeignKey, DateTime,JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Dataset(Base):
    __tablename__ = 'datasets'
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey('projects.id'), nullable=False)
    version = Column(Integer, nullable=False)
    zip_url = Column(String, nullable=False)
    blob_path = Column(String, nullable=True)  # Path in Azure blob storage for deletion
    
    classes = Column(JSON, nullable=False)

    train_split = Column(Float, nullable=False)
    val_split = Column(Float, nullable=False)
    test_split = Column(Float, nullable=False)

    created_at = Column(DateTime, default=datetime.now)

    project = relationship("Project", back_populates="datasets")
    