from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from app.models.scheme import SchemeMatch
from app.schemas.scheme import SchemeMatchCreate


def get_scheme_matches(db: Session, business_id: int) -> list[SchemeMatch]:
    return (
        db.query(SchemeMatch)
        .options(joinedload(SchemeMatch.scheme))
        .filter(SchemeMatch.business_id == business_id)
        .order_by(SchemeMatch.match_score.desc(), SchemeMatch.id.asc())
        .all()
    )


def get_scheme_match(db: Session, match_id: int) -> SchemeMatch | None:
    return (
        db.query(SchemeMatch)
        .options(joinedload(SchemeMatch.scheme))
        .filter(SchemeMatch.id == match_id)
        .first()
    )


def clear_matches_for_business(db: Session, business_id: int) -> int:
    deleted_count = (
        db.query(SchemeMatch)
        .filter(SchemeMatch.business_id == business_id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return int(deleted_count)


def create_scheme_match(
    db: Session,
    match_in: SchemeMatchCreate,
    *,
    commit: bool = True,
) -> SchemeMatch:
    match = SchemeMatch(**match_in.model_dump())
    db.add(match)
    if commit:
        db.commit()
        db.refresh(match)
    return match
