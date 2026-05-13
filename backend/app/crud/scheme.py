from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.scheme import Scheme
from app.schemas.scheme import SchemeCreate


def get_schemes(db: Session, *, active_only: bool = True) -> list[Scheme]:
    query = db.query(Scheme)
    if active_only:
        query = query.filter(Scheme.is_active.is_(True))
    return query.order_by(Scheme.name.asc()).all()


def get_scheme(db: Session, scheme_id: int) -> Scheme | None:
    return db.get(Scheme, scheme_id)


def get_scheme_by_code(db: Session, code: str) -> Scheme | None:
    return db.query(Scheme).filter(Scheme.code == code).first()


def create_or_update_scheme(
    db: Session,
    scheme_in: SchemeCreate,
) -> tuple[Scheme, bool]:
    scheme = get_scheme_by_code(db, scheme_in.code)
    if scheme is None:
        scheme = Scheme(**scheme_in.model_dump())
        db.add(scheme)
        db.commit()
        db.refresh(scheme)
        return scheme, True

    for field, value in scheme_in.model_dump().items():
        setattr(scheme, field, value)
    db.add(scheme)
    db.commit()
    db.refresh(scheme)
    return scheme, False
