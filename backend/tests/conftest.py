from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

TEST_ROOT = Path(os.environ.get("LANKSIDE_TEST_ROOT", "/private/tmp/lankside-tests"))
TEST_ROOT.mkdir(parents=True, exist_ok=True)

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_ROOT / 'pytest.db'}"
os.environ["REDIS_URL"] = "redis://localhost:6379/15"
os.environ["CELERY_BROKER_URL"] = "redis://localhost:6379/15"
os.environ["CELERY_RESULT_BACKEND"] = "redis://localhost:6379/15"
os.environ["GEMINI_API_KEY"] = ""
os.environ["GRANT_SCOUT_USE_VECTOR"] = "false"
os.environ["EXTRACTION_USE_AI"] = "false"
os.environ["ADMIN_DEMO_ENABLED"] = "true"
os.environ["UPLOAD_DIR"] = str(TEST_ROOT / "uploads")
os.environ["MOU_PDF_DIR"] = str(TEST_ROOT / "mous")
os.environ["REPORT_OUTPUT_DIR"] = str(TEST_ROOT / "reports")
os.environ["REPORT_PDF_DIR"] = str(TEST_ROOT / "reports")

import app.models  # noqa: E402,F401
from app.core.config import settings  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

TEST_DATABASE_URL = f"sqlite:///{TEST_ROOT / 'pytest.db'}"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine,
)

settings.upload_dir = str(TEST_ROOT / "uploads")
settings.mou_pdf_dir = str(TEST_ROOT / "mous")
settings.report_output_dir = str(TEST_ROOT / "reports")
settings.report_pdf_dir = str(TEST_ROOT / "reports")

for directory in (
    settings.upload_dir,
    settings.mou_pdf_dir,
    settings.report_output_dir,
):
    Path(directory).mkdir(parents=True, exist_ok=True)

Base.metadata.create_all(bind=test_engine)


def override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def clean_database() -> Generator[None, None, None]:
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def business_payload() -> dict[str, object]:
    return {
        "business_name": "Phase 14 Demo Business",
        "owner_name": "Demo Owner",
        "udyam_id": "UDYAM-TS-00-0000014",
        "gstin": "09DEMOA1234A1Z5",
        "pan": "DEMOA1234A",
        "industry_type": "Medical Stockist",
        "state": "Uttar Pradesh",
        "city": "Raebareli",
        "business_age_years": 3,
        "turnover_range": "Micro",
    }


@pytest.fixture()
def created_business(client: TestClient, business_payload: dict[str, object]) -> dict:
    response = client.post("/api/v1/businesses", json=business_payload)
    assert response.status_code == 201
    return response.json()


def create_uploaded_document(
    client: TestClient,
    business_id: int,
    document_type: str = "GST_CERTIFICATE",
    filename: str = "demo.pdf",
) -> dict:
    response = client.post(
        "/api/v1/documents/upload",
        data={"business_id": str(business_id), "document_type": document_type},
        files={"file": (filename, b"%PDF-1.4\n% demo only\n", "application/pdf")},
    )
    assert response.status_code == 201
    return response.json()
