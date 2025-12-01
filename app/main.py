from fastapi import FastAPI

from app.auth.routes import router as auth_router
from app.images.routes import router as images_router

app = FastAPI()

app.include_router(auth_router)
app.include_router(images_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI application!"}

