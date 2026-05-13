from __future__ import annotations

from sqlalchemy.orm import Session

from app.schemas.admin import DemoResetResponse, DemoSeedResponse
from app.services.demo_data import reset_demo_data, seed_demo_data


def seed_demo(db: Session) -> DemoSeedResponse:
    return seed_demo_data(db)


def reset_demo(db: Session) -> DemoResetResponse:
    return reset_demo_data(db)
