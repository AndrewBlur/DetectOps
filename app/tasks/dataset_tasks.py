import random
from datetime import datetime

from azure.storage.blob import ContainerClient

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.core.config import AzureStorageSettings
from app.images.models import Image
from app.annotations.models import Annotation
from app.datasets.models import Dataset
from app.projects.models import Project
from app.utils.blob_service import generate_signed_url
import zipstream


def get_azure_container():
    """Build Azure container client with proper connection string."""
    azure_settings = AzureStorageSettings()
    connection_string = (
        f"DefaultEndpointsProtocol=https;"
        f"AccountName={azure_settings.AZURE_STORAGE_ACCOUNT_NAME};"
        f"AccountKey={azure_settings.AZURE_STORAGE_KEY};"
        f"EndpointSuffix=core.windows.net"
    )
    return ContainerClient.from_connection_string(
        conn_str=connection_string,
        container_name=azure_settings.AZURE_STORAGE_CONTAINER_NAME
    )


@celery_app.task(name="export_dataset_task", bind=True)
def export_dataset_task(self, project_id: int, train_split: float, val_split: float, test_split: float):
    """
    Celery task to export dataset as a ZIP file with progress tracking.
    """
    db = SessionLocal()
    
    try:
        # Get project info for naming
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            return {"status": "error", "message": "Project not found"}
        
        # Get all annotated images for the project
        images = db.query(Image).filter(
            Image.project_id == project_id,
            Image.is_annotated == True
        ).all()
        
        if not images:
            return {"status": "error", "message": "No annotated images found"}
        
        random.shuffle(images)
        n = len(images)
        
        # Calculate split counts
        train_n = int(n * train_split)
        val_n = int(n * val_split)
        
        train = images[:train_n]
        val = images[train_n:train_n + val_n]
        test = images[train_n + val_n:]
        
        # Get all annotations for class mapping
        all_anns = db.query(Annotation).join(Image).filter(Image.project_id == project_id).all()
        tags = sorted({a.tag for a in all_anns})
        class_map = {tag: idx for idx, tag in enumerate(tags)}
        
        # Create zip stream
        z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        container = get_azure_container()
        
        # Process images with progress tracking
        total_images = len(images)
        processed = 0
        
        def add_split_images(split_images, split_name):
            nonlocal processed
            for img in split_images:
                blob_path = img.filepath
                img_name = blob_path.split('/')[-1]
                blob = container.get_blob_client(blob_path)
                
                # Add image to zip
                z.write_iter(f"images/{split_name}/{img_name}", blob.download_blob().chunks())
                
                # Add labels
                anns = db.query(Annotation).filter(Annotation.image_id == img.id).all()
                lines = [f"{class_map[ann.tag]} {ann.x} {ann.y} {ann.w} {ann.h}" for ann in anns]
                label_name = img_name.rsplit('.', 1)[0] + '.txt'
                z.writestr(f"labels/{split_name}/{label_name}", "\n".join(lines).encode('utf-8'))
                
                processed += 1
                self.update_state(
                    state="PROGRESS",
                    meta={
                        "current": processed,
                        "total": total_images,
                        "phase": f"Processing {split_name}",
                        "message": f"Processing {img_name}..."
                    }
                )
        
        add_split_images(train, 'train')
        add_split_images(val, 'val')
        add_split_images(test, 'test')
        
        # Add data.yaml
        yaml = f"""
train: images/train
val: images/val
test: images/test
nc: {len(class_map)}
names: {list(class_map.keys())}
"""
        z.writestr("data.yaml", yaml.encode('utf-8'))
        
        # Upload progress
        self.update_state(
            state="PROGRESS",
            meta={
                "current": total_images,
                "total": total_images,
                "phase": "Uploading",
                "message": "Uploading dataset to cloud..."
            }
        )
        
        # Get next version
        last = db.query(Dataset).filter(Dataset.project_id == project_id).order_by(Dataset.version.desc()).first()
        next_version = 1 if not last else last.version + 1
        
        # Upload to blob storage with user directory and project name
        # Sanitize project name for file path (replace spaces and special chars)
        safe_project_name = "".join(c if c.isalnum() or c in '-_' else '_' for c in project.name)
        zip_name = f"datasets/{project.user_id}/{safe_project_name}_v{next_version}.zip"
        container.upload_blob(name=zip_name, data=(chunk for chunk in z), overwrite=True, length=None)
        
        # Generate signed URL
        zip_url = generate_signed_url(zip_name)
        
        # Save dataset record
        dataset = Dataset(
            project_id=project_id,
            version=next_version,
            zip_url=zip_url,
            blob_path=zip_name,  # Store path for deletion on cascade
            classes=list(class_map.keys()),
            train_split=train_split,
            val_split=val_split,
            test_split=test_split
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        return {
            "status": "success",
            "dataset_id": dataset.id,
            "version": dataset.version,
            "zip_url": dataset.zip_url,
            "classes": dataset.classes,
            "total_images": total_images
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        db.close()


@celery_app.task(name="delete_dataset_blob_task", bind=True)
def delete_dataset_blob_task(self, blob_path: str):
    """
    Celery task to delete a dataset blob from Azure Storage.
    """
    try:
        container = get_azure_container()
        blob_client = container.get_blob_client(blob_path)
        
        if blob_client.exists():
            blob_client.delete_blob()
            return {"status": "success", "message": f"Deleted blob: {blob_path}"}
        else:
            return {"status": "success", "message": f"Blob not found (already deleted): {blob_path}"}
            
    except Exception as e:
        return {"status": "error", "message": str(e)}
