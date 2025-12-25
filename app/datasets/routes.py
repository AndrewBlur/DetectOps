from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from app.auth.models import User
from app.projects.models import Project
from app.core.database import get_db
from app.auth.security import get_current_user
from app.datasets.models import Dataset
from app.core.redis import redis_client
from app.utils.blob_service import generate_signed_url
from app.tasks.dataset_tasks import export_dataset_task, delete_dataset_blob_task

router = APIRouter(prefix="/projects/{project_id}/datasets", tags=["datasets"])

DATASET_URL_TTL = 55 * 60  # 55 minutes

def get_dataset_signed_url_cached(dataset, project):
    """Get or generate cached signed URL for dataset zip"""
    cache_key = f"signed_url:dataset:{dataset.id}"
    
    cached_url = redis_client.get(cache_key)
    if cached_url:
        return cached_url
    
    # Build blob path with user directory and project name
    safe_project_name = "".join(c if c.isalnum() or c in '-_' else '_' for c in project.name)
    blob_path = f"datasets/{project.user_id}/{safe_project_name}_v{dataset.version}.zip"
    signed_url = generate_signed_url(blob_path, hours=1)
    
    redis_client.setex(
        cache_key,
        DATASET_URL_TTL,
        signed_url
    )
    
    return signed_url


# Dependency to verify project ownership
def get_project_for_user(project_id: int = Path(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("")
def get_datasets(project: Project = Depends(get_project_for_user), db: Session = Depends(get_db)):
    """List all datasets for a project with fresh signed URLs"""
    datasets = db.query(Dataset).filter(Dataset.project_id == project.id).order_by(Dataset.version.desc()).all()
    return [
        {
            "id": d.id,
            "version": d.version,
            "zip_url": get_dataset_signed_url_cached(d, project),
            "classes": d.classes,
            "train_split": d.train_split,
            "val_split": d.val_split,
            "test_split": d.test_split,
            "created_at": d.created_at.isoformat() if d.created_at else None
        }
        for d in datasets
    ]


@router.post("/export")
def export_dataset(project: Project = Depends(get_project_for_user), 
                   train_split: float = 0.7, 
                   val_split: float = 0.15, 
                   test_split: float = 0.15):
    """Start async dataset export task and return task_id for tracking"""
    # Validate splits sum to 1.0
    if abs((train_split + val_split + test_split) - 1.0) > 0.01:
        raise HTTPException(status_code=400, detail="Splits must sum to 1.0")
    
    # Trigger Celery task
    task = export_dataset_task.delay(project.id, train_split, val_split, test_split)
    
    return {
        "task_id": task.id,
        "message": "Dataset export started"
    }


@router.delete("/{dataset_id}",status_code=204)
def delete_dataset(
    dataset_id: int,
    project: Project = Depends(get_project_for_user),
    db: Session = Depends(get_db)
):
    """Delete a dataset and schedule blob deletion in background"""
    # Find the dataset
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id,
        Dataset.project_id == project.id
    ).first()
    
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Build the blob path for deletion
    safe_project_name = "".join(c if c.isalnum() or c in '-_' else '_' for c in project.name)
    blob_path = f"datasets/{project.user_id}/{safe_project_name}_v{dataset.version}.zip"
    
    # Clear cached URL from Redis
    cache_key = f"signed_url:dataset:{dataset.id}"
    redis_client.delete(cache_key)
    
    # Delete from database
    db.delete(dataset)
    db.commit()
    
    # Schedule blob deletion in background
    task = delete_dataset_blob_task.delay(blob_path)
    
    return {
        "message": "Dataset deleted",
        "dataset_id": dataset_id,
        "delete_task_id": task.id
    }