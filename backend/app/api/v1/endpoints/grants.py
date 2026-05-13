from __future__ import annotations

from typing import Union

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud.business import get_business
from app.crud.scheme import get_scheme, get_schemes
from app.crud.scheme_match import clear_matches_for_business, get_scheme_matches
from app.db.session import get_db
from app.schemas.scheme import (
    GrantMatchRunResponse,
    SchemeMatchRead,
    SchemeRead,
    SchemeSeedResponse,
)
from app.services.grant_matcher import run_grant_matching
from app.services.scheme_seed_data import seed_mvp_schemes
from app.services.vector_search import index_schemes_if_available

router = APIRouter(prefix="/grants")


@router.post("/seed-schemes", response_model=SchemeSeedResponse)
def seed_schemes(db: Session = Depends(get_db)) -> SchemeSeedResponse:
    result = seed_mvp_schemes(db)
    index_schemes_if_available(get_schemes(db, active_only=True))
    return SchemeSeedResponse(**result)


@router.get("/schemes", response_model=list[SchemeRead])
def list_schemes(db: Session = Depends(get_db)) -> list[SchemeRead]:
    return get_schemes(db, active_only=True)


@router.get("/schemes/{scheme_id}", response_model=SchemeRead)
def read_scheme(
    scheme_id: int,
    db: Session = Depends(get_db),
) -> SchemeRead:
    scheme = get_scheme(db, scheme_id)
    if scheme is None or not scheme.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scheme not found.",
        )
    return scheme


@router.post("/{business_id}/match", response_model=GrantMatchRunResponse)
def match_grants(
    business_id: int,
    db: Session = Depends(get_db),
) -> GrantMatchRunResponse:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return run_grant_matching(db, business_id)


@router.get("/{business_id}/matches", response_model=list[SchemeMatchRead])
def list_grant_matches(
    business_id: int,
    db: Session = Depends(get_db),
) -> list[SchemeMatchRead]:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return get_scheme_matches(db, business_id)


@router.delete("/{business_id}/matches")
def delete_grant_matches(
    business_id: int,
    db: Session = Depends(get_db),
) -> dict[str, Union[int, bool]]:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    deleted_count = clear_matches_for_business(db, business_id)
    return {"success": True, "deleted_count": deleted_count}
