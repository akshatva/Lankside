from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.mou import MOU
from app.schemas.mou import MOUCreate, MOUUpdate


def create_mou(db: Session, mou_in: MOUCreate) -> MOU:
    mou = MOU(**mou_in.model_dump())
    db.add(mou)
    db.commit()
    db.refresh(mou)
    return mou


def get_mou(db: Session, mou_id: int) -> MOU | None:
    return db.get(MOU, mou_id)


def get_mous(
    db: Session,
    *,
    business_id: int | None = None,
    status: str | None = None,
) -> list[MOU]:
    query = db.query(MOU)

    if business_id is not None:
        query = query.filter(MOU.business_id == business_id)
    if status is not None:
        query = query.filter(MOU.status == status)

    return query.order_by(MOU.created_at.desc(), MOU.id.desc()).all()


def update_mou(db: Session, mou: MOU, mou_in: MOUUpdate) -> MOU:
    update_data = mou_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(mou, field, value)
    db.add(mou)
    db.commit()
    db.refresh(mou)
    return mou


def delete_mou(db: Session, mou: MOU) -> None:
    db.delete(mou)
    db.commit()


def update_mou_pdf_path(db: Session, mou: MOU, pdf_path: str) -> MOU:
    mou.pdf_path = pdf_path
    db.add(mou)
    db.commit()
    db.refresh(mou)
    return mou


def update_mou_status(db: Session, mou: MOU, status: str) -> MOU:
    mou.status = status
    db.add(mou)
    db.commit()
    db.refresh(mou)
    return mou
