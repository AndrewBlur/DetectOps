from fastapi import FastAPI

from app.auth.routes import router as auth_router
from app.images.routes import router as images_router
from app.annotations.routes import router as annotations_router
from app.projects.routes import router as projects_router
from app.tasks.routes import router as tasks_router
from app.datasets.routes import router as datasets_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(images_router)
app.include_router(annotations_router)
app.include_router(projects_router)
app.include_router(tasks_router)
app.include_router(datasets_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}

