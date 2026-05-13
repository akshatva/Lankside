from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.business import get_business
from app.crud.mou import (
    create_mou,
    delete_mou,
    get_mou,
    get_mous,
    update_mou,
    update_mou_pdf_path,
    update_mou_status,
)
from app.db.session import get_db
from app.schemas.mou import (
    MOUCreate,
    MOUExportResponse,
    MOUGenerateRequest,
    MOUGenerateResponse,
    MOURead,
    MOUUpdate,
)
from app.services.mou_generator import generate_mou_draft
from app.services.pdf_generator import generate_mou_pdf

router = APIRouter(prefix="/mous")

ALLOWED_MOU_STATUSES = {"GENERATED", "EXPORTED"}


def _normalize_status(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip().upper()
    if normalized not in ALLOWED_MOU_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="status must be one of GENERATED or EXPORTED.",
        )
    return normalized


def _get_existing_mou(db: Session, mou_id: int):
    mou = get_mou(db, mou_id)
    if mou is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MOU not found.",
        )
    return mou


@router.post(
    "/generate",
    response_model=MOUGenerateResponse,
    status_code=status.HTTP_201_CREATED,
)
def generate_mou(
    mou_in: MOUGenerateRequest,
    db: Session = Depends(get_db),
) -> MOUGenerateResponse:
    business = get_business(db, mou_in.business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )

    draft_text = generate_mou_draft(db, mou_in)
    return create_mou(
        db,
        MOUCreate(
            **mou_in.model_dump(),
            draft_text=draft_text,
            status="GENERATED",
        ),
    )


@router.get("", response_model=List[MOURead])
def list_mous(
    business_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> List[MOURead]:
    return get_mous(
        db,
        business_id=business_id,
        status=_normalize_status(status),
    )


@router.get("/{mou_id}", response_model=MOURead)
def read_mou(mou_id: int, db: Session = Depends(get_db)) -> MOURead:
    return _get_existing_mou(db, mou_id)


@router.put("/{mou_id}", response_model=MOURead)
def edit_mou(
    mou_id: int,
    mou_in: MOUUpdate,
    db: Session = Depends(get_db),
) -> MOURead:
    mou = _get_existing_mou(db, mou_id)
    return update_mou(db, mou, mou_in)


@router.post("/{mou_id}/export-pdf", response_model=MOUExportResponse)
def export_mou_pdf(
    mou_id: int,
    db: Session = Depends(get_db),
) -> MOUExportResponse:
    mou = _get_existing_mou(db, mou_id)
    try:
        pdf_path = generate_mou_pdf(mou)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc

    mou = update_mou_pdf_path(db, mou, pdf_path)
    return update_mou_status(db, mou, "EXPORTED")


@router.get("/{mou_id}/download")
def download_mou_pdf(
    mou_id: int,
    db: Session = Depends(get_db),
) -> FileResponse:
    mou = _get_existing_mou(db, mou_id)
    if not mou.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PDF has been generated for this MOU.",
        )

    file_path = Path(mou.pdf_path).expanduser().resolve()
    pdf_root = Path(settings.mou_pdf_dir).expanduser().resolve()
    if pdf_root not in (file_path, *file_path.parents) or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated PDF not found.",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"mou-{mou.id}.pdf",
    )


@router.delete("/{mou_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_mou(mou_id: int, db: Session = Depends(get_db)) -> None:
    mou = _get_existing_mou(db, mou_id)
    _remove_pdf_file(mou.pdf_path)
    delete_mou(db, mou)


def _remove_pdf_file(pdf_path: Optional[str]) -> None:
    if not pdf_path:
        return
    file_path = Path(pdf_path).expanduser().resolve()
    pdf_root = Path(settings.mou_pdf_dir).expanduser().resolve()
    if pdf_root not in (file_path, *file_path.parents):
        return
    file_path.unlink(missing_ok=True)
