from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.business import Business
from app.schemas.business import BusinessCreate, BusinessUpdate


def get_business(db: Session, business_id: int) -> Business | None:
    return db.get(Business, business_id)


def get_businesses(db: Session) -> list[Business]:
    return db.query(Business).order_by(Business.created_at.desc()).all()


def create_business(
    db: Session,
    business_in: BusinessCreate,
    user_id: int,
) -> Business:
    business = Business(**business_in.model_dump(), user_id=user_id)
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


def update_business(
    db: Session,
    business: Business,
    business_in: BusinessUpdate,
) -> Business:
    update_data = business_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(business, field, value)
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


def delete_business(db: Session, business: Business) -> None:
    db.delete(business)
    db.commit()
