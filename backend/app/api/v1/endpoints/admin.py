from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.admin import DemoResetResponse, DemoSeedResponse, DemoSummary
from app.services.demo_data import get_demo_summary, reset_demo_data, seed_demo_data

router = APIRouter(prefix="/admin")


@router.post("/seed-demo-data", response_model=DemoSeedResponse)
def seed_demo(db: Session = Depends(get_db)) -> DemoSeedResponse:
    return seed_demo_data(db)


@router.post("/reset-demo-data", response_model=DemoResetResponse)
def reset_demo(db: Session = Depends(get_db)) -> DemoResetResponse:
    return reset_demo_data(db)


@router.get("/demo-summary", response_model=DemoSummary)
def read_demo_summary(db: Session = Depends(get_db)) -> DemoSummary:
    return get_demo_summary(db)
