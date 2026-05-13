from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.business import get_business
from app.crud.lri_score import (
    delete_lri_score,
    get_latest_lri_score_for_business,
    get_lri_score,
    get_lri_scores_for_business,
)
from app.db.session import get_db
from app.schemas.lri import LRIScoreHistory, LRIScoreRead, LRIScoreResult
from app.services.lri_engine import calculate_lri_for_business

router = APIRouter(prefix="/lri")


@router.post("/{business_id}/calculate", response_model=LRIScoreResult)
def calculate_lri(
    business_id: int,
    db: Session = Depends(get_db),
) -> LRIScoreResult:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return calculate_lri_for_business(db, business_id)


@router.get("/{business_id}/latest", response_model=LRIScoreRead)
def read_latest_lri_score(
    business_id: int,
    db: Session = Depends(get_db),
) -> LRIScoreRead:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    score = get_latest_lri_score_for_business(db, business_id)
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LRI score exists for this business.",
        )
    return score


@router.get("/{business_id}/history", response_model=LRIScoreHistory)
def read_lri_history(
    business_id: int,
    db: Session = Depends(get_db),
) -> LRIScoreHistory:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return LRIScoreHistory(
        business_id=business_id,
        scores=get_lri_scores_for_business(db, business_id),
    )


@router.get("/score/{score_id}", response_model=LRIScoreRead)
def read_lri_score(
    score_id: int,
    db: Session = Depends(get_db),
) -> LRIScoreRead:
    score = get_lri_score(db, score_id)
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LRI score not found.",
        )
    return score


@router.delete("/score/{score_id}")
def remove_lri_score(
    score_id: int,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    score = get_lri_score(db, score_id)
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="LRI score not found.",
        )
    delete_lri_score(db, score)
    return {"success": True}
