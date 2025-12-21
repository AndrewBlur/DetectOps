import pytest
from fastapi.testclient import TestClient
from datetime import datetime

from app.auth.security import get_current_user
from app.annotations.models import Annotation
from app.images.models import Image


@pytest.fixture(autouse=True)
def override_user(test_user):
    from app.main import app
    app.dependency_overrides[get_current_user] = lambda: test_user
    yield
    app.dependency_overrides.pop(get_current_user, None)


def test_create_annotation_success(client: TestClient, db_session, test_user):
    image = Image(
        user_id=test_user.id,
        filepath="test.jpg",
        storage_url="https://example.com/test.jpg",
        is_annotated=False,
        uploaded_at=datetime.utcnow()
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)

    payload = {
        "image_id": image.id,
        "annotation": {
            "x": 0.1,
            "y": 0.2,
            "w": 0.3,
            "h": 0.4,
            "tag": "fork"
        }
    }

    response = client.post("/annotations", json=payload)

    assert response.status_code == 201
    body = response.json()

    assert body["image_id"] == image.id
    assert body["tag"] == "fork"

    db_session.refresh(image)
    assert image.is_annotated is True


def test_create_annotation_image_not_found(client: TestClient):
    payload = {
        "image_id": 9999,
        "annotation": {
            "x": 0.1,
            "y": 0.2,
            "w": 0.3,
            "h": 0.4,
            "tag": "knife"
        }
    }

    response = client.post("/annotations", json=payload)

    assert response.status_code == 404
    assert response.json()["detail"] == "Image not found"


def test_get_annotations_by_image(client: TestClient, db_session, test_user):
    image = Image(
        user_id=test_user.id,
        filepath="img.jpg",
        storage_url="https://example.com/img.jpg",
        is_annotated=True,
        uploaded_at=datetime.utcnow()
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)

    ann = Annotation(
        image_id=image.id,
        user_id=test_user.id,
        x=0.1,
        y=0.2,
        w=0.3,
        h=0.4,
        tag="spoon",
        created_at=datetime.utcnow()
    )
    db_session.add(ann)
    db_session.commit()

    response = client.get(f"/annotations/{image.id}")

    assert response.status_code == 200
    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["tag"] == "spoon"


def test_get_annotations_empty(client: TestClient, db_session, test_user):
    image = Image(
        user_id=test_user.id,
        filepath="empty.jpg",
        storage_url="https://example.com/empty.jpg",
        is_annotated=False,
        uploaded_at=datetime.utcnow()
    )
    db_session.add(image)
    db_session.commit()

    response = client.get(f"/annotations/{image.id}")

    assert response.status_code == 200
    assert response.json() == []


def test_get_tags(client: TestClient, db_session, test_user):
    image = Image(
        user_id=test_user.id,
        filepath="tags.jpg",
        storage_url="https://example.com/tags.jpg",
        is_annotated=True,
        uploaded_at=datetime.utcnow()
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)

    tags = ["fork", "knife", "fork"]

    for tag in tags:
        db_session.add(
            Annotation(
                image_id=image.id,
                user_id=test_user.id,
                x=0.1,
                y=0.1,
                w=0.2,
                h=0.2,
                tag=tag,
                created_at=datetime.utcnow()
            )
        )

    db_session.commit()

    response = client.get("/annotations/tags")

    assert response.status_code == 200
    data = response.json()

    assert sorted(data) == sorted(set(tags))


def test_delete_last_annotation_updates_image(
    client: TestClient, db_session, test_user
):
    image = Image(
        user_id=test_user.id,
        filepath="del.jpg",
        storage_url="https://example.com/del.jpg",
        is_annotated=True,
        uploaded_at=datetime.utcnow()
    )
    db_session.add(image)
    db_session.commit()
    db_session.refresh(image)

    ann = Annotation(
        image_id=image.id,
        user_id=test_user.id,
        x=0.1,
        y=0.1,
        w=0.2,
        h=0.2,
        tag="cup",
        created_at=datetime.utcnow()
    )
    db_session.add(ann)
    db_session.commit()
    db_session.refresh(ann)

    response = client.delete(
        f"/annotations/delete/{ann.id}/{image.id}"
    )

    assert response.status_code == 204

    db_session.refresh(image)
    assert image.is_annotated is False


def test_delete_annotation_not_found(client: TestClient):
    response = client.delete("/annotations/delete/9999/1")

    assert response.status_code == 404
    assert response.json()["detail"] == "Annotation not found"
