import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

DB_HOST = os.getenv("host")
DB_PORT = os.getenv("port")
DB_USER = os.getenv("user")
DB_PASSWORD = os.getenv("password")
DB_NAME = os.getenv("database")
TEST_DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}_test"

# Create test engine
test_engine = create_engine(TEST_DATABASE_URL)

# Create test session
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Override get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Apply the override
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    """Create tables before each test and drop them after"""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="module")
def client():
    """Create a test client"""
    return TestClient(app)


def test_register_user(client):
    response = client.post(
        "/auth/register",
        json={"email": "testuser@gmail.com", "password": "testpass"}
    )
    assert response.status_code == 201
    assert response.json() == {"message": "User registered Successfully"}

def test_register_existing_user(client):
    # First, register the user
    client.post(
        "/auth/register",
        json={"email": "testuser@gmail.com", "password": "testpass"}
    )

    # Try to register the same user again
    response = client.post(
        "/auth/register",
        json={"email": "testuser@gmail.com", "password": "testpass"}
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered"}

def test_register_missing_fields(client):
    response = client.post(
        "/auth/register",
        json={"password": "testpass"}
    )
    assert response.status_code == 422  # Unprocessable Entity due to missing email

    response = client.post(
        "/auth/register",
        json={"email": "testuser@gmail.com"}
    )
    assert response.status_code == 422  # Unprocessable Entity due to missing password
    
def test_register_invalid_email(client):
    response = client.post(
        "/auth/register",
        json={"email": "invalidemail", "password": "testpass"}
    )
    assert response.status_code == 422  # Validation error

def test_login_user(client):
    # First, register the user
    client.post(
        "/auth/register",
        json={"email": "testuser@gmail.com", "password": "testpass"}
    )

    # Now, login with the registered user
    response = client.post(
        "/auth/login",
        data={"username": "testuser@gmail.com", "password": "testpass"}
    )

    assert response.status_code == 200
    json_response = response.json()
    assert "token" in json_response
    assert json_response["token_type"] == "bearer"

def test_login_no_user(client):
    response = client.post(
        "/auth/login",
        data={"username": "testuser@gmail.com", "password": "testpass"}
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "User does not exist"}

def test_login_invalid_password(client):
    # First, register the user
    client.post(
        "/auth/register",
        json={"email": "testuser@gmail.com", "password": "testpass"}
    )
    response = client.post(
        "/auth/login",
        data={"username": "testuser@gmail.com", "password": "invalidpassword"}
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid Credentials"}

def test_login_invalid_username(client):
    response = client.post(
        "/auth/login",
        data={"username": "invalid@gmail.com", "password": "testpass"}
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "User does not exist"}
