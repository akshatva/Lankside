from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.lri_score import LRIScore
from app.schemas.lri import LRIScoreCreate


def create_lri_score(db: Session, score_in: LRIScoreCreate) -> LRIScore:
    payload = score_in.model_dump()
    payload["recommendations"] = [
        recommendation.model_dump()
        for recommendation in score_in.recommendations
    ]
    score = LRIScore(**payload)
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


def get_lri_score(db: Session, score_id: int) -> LRIScore | None:
    return db.get(LRIScore, score_id)


def get_latest_lri_score_for_business(
    db: Session,
    business_id: int,
) -> LRIScore | None:
    return (
        db.query(LRIScore)
        .filter(LRIScore.business_id == business_id)
        .order_by(LRIScore.created_at.desc(), LRIScore.id.desc())
        .first()
    )


def get_lri_scores_for_business(
    db: Session,
    business_id: int,
) -> list[LRIScore]:
    return (
        db.query(LRIScore)
        .filter(LRIScore.business_id == business_id)
        .order_by(LRIScore.created_at.desc(), LRIScore.id.desc())
        .all()
    )


def delete_lri_score(db: Session, score: LRIScore) -> None:
    db.delete(score)
    db.commit()
