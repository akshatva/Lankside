import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.crud.business import (
    create_business,
    delete_business,
    get_business,
    get_businesses,
    update_business,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.business import BusinessCreate, BusinessRead, BusinessUpdate

router = APIRouter(prefix="/businesses")
logger = logging.getLogger(__name__)

DEMO_USER_EMAIL = "demo@lankside.local"
DEMO_USER_FULL_NAME = "Demo User"


def get_or_create_demo_user(db: Session) -> User:
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if user:
        return user
    user = User(email=DEMO_USER_EMAIL, full_name=DEMO_USER_FULL_NAME)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
        if user:
            return user
        logger.exception("Demo user insert hit an integrity error but no row exists.")
        raise
    db.refresh(user)
    return user


@router.post("", response_model=BusinessRead, status_code=status.HTTP_201_CREATED)
def create_business_profile(
    business_in: BusinessCreate,
    db: Session = Depends(get_db),
) -> BusinessRead:
    demo_user = get_or_create_demo_user(db)
    return create_business(db=db, business_in=business_in, user_id=demo_user.id)


@router.get("", response_model=list[BusinessRead])
def list_business_profiles(db: Session = Depends(get_db)) -> list[BusinessRead]:
    return get_businesses(db)


@router.get("/{business_id}", response_model=BusinessRead)
def read_business_profile(
    business_id: int,
    db: Session = Depends(get_db),
) -> BusinessRead:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return business


@router.put("/{business_id}", response_model=BusinessRead)
def update_business_profile(
    business_id: int,
    business_in: BusinessUpdate,
    db: Session = Depends(get_db),
) -> BusinessRead:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return update_business(db=db, business=business, business_in=business_in)


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_profile(
    business_id: int,
    db: Session = Depends(get_db),
) -> None:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    delete_business(db=db, business=business)
