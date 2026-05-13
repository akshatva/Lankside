from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from starlette import status as http_status

from app.core.config import settings
from app.crud.business import get_business
from app.crud.document import (
    create_document,
    delete_document,
    get_document,
    get_documents,
)
from app.db.session import get_db
from app.schemas.document import DocumentCreate, DocumentList, DocumentRead
from app.services.file_storage import (
    ALLOWED_EXTENSIONS,
    remove_stored_file,
    save_upload_file,
    validate_extension,
)

router = APIRouter(prefix="/documents")

ALLOWED_DOCUMENT_TYPES = {
    "GST_CERTIFICATE",
    "UDYAM_CERTIFICATE",
    "PAN_CARD",
    "BANK_STATEMENT",
    "ITR_ACKNOWLEDGEMENT",
    "OTHER",
}
ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg"}
ALLOWED_STATUSES = {"PENDING", "PROCESSING", "COMPLETED", "FAILED"}


def _parse_business_id(value: str) -> int:
    try:
        return int(value)
    except ValueError as exc:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="business_id must match an existing business ID.",
        ) from exc


def _normalize_document_type(value: str) -> str:
    normalized = value.strip().upper()
    if normalized not in ALLOWED_DOCUMENT_TYPES:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported document_type.",
        )
    return normalized


def _normalize_status(value: str) -> str:
    normalized = value.strip().upper()
    if normalized not in ALLOWED_STATUSES:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported status.",
        )
    return normalized


def _validate_upload_file(upload_file: UploadFile) -> None:
    try:
        validate_extension(upload_file.filename or "")
    except ValueError as exc:
        allowed = ", ".join(sorted(ALLOWED_EXTENSIONS))
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file extension. Allowed extensions: {allowed}.",
        ) from exc

    if upload_file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported MIME type.",
        )


@router.post(
    "/upload",
    response_model=DocumentRead,
    status_code=http_status.HTTP_201_CREATED,
)
async def upload_document(
    business_id: str = Form(...),
    document_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentRead:
    parsed_business_id = _parse_business_id(business_id)
    normalized_document_type = _normalize_document_type(document_type)
    business = get_business(db, parsed_business_id)
    if business is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )

    _validate_upload_file(file)
    try:
        stored_filename, file_path, file_size_bytes = await save_upload_file(
            file,
            upload_dir=settings.upload_dir,
            max_size_bytes=settings.max_upload_size_bytes,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    return create_document(
        db,
        DocumentCreate(
            business_id=parsed_business_id,
            document_type=normalized_document_type,
        ),
        original_filename=file.filename or stored_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=file.content_type,
        file_size_bytes=file_size_bytes,
    )


@router.get("", response_model=DocumentList)
def list_documents(
    business_id: Optional[str] = Query(default=None),
    document_type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> DocumentList:
    parsed_business_id = _parse_business_id(business_id) if business_id else None
    normalized_document_type = (
        _normalize_document_type(document_type) if document_type else None
    )
    normalized_status = _normalize_status(status) if status else None
    documents = get_documents(
        db,
        business_id=parsed_business_id,
        document_type=normalized_document_type,
        status=normalized_status,
    )
    return DocumentList(documents=documents)


@router.get("/{document_id}", response_model=DocumentRead)
def read_document(document_id: int, db: Session = Depends(get_db)) -> DocumentRead:
    document = get_document(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return document


@router.delete("/{document_id}")
def remove_document(document_id: int, db: Session = Depends(get_db)) -> dict[str, bool]:
    document = get_document(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    remove_stored_file(document.file_path, upload_dir=settings.upload_dir)
    delete_document(db, document)
    return {"success": True}


@router.get("/{document_id}/download")
def download_document(document_id: int, db: Session = Depends(get_db)) -> FileResponse:
    document = get_document(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    file_path = Path(document.file_path).expanduser().resolve()
    upload_root = Path(settings.upload_dir).expanduser().resolve()
    if upload_root not in (file_path, *file_path.parents) or not file_path.is_file():
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="Stored file not found.",
        )
    return FileResponse(
        path=file_path,
        media_type=document.mime_type,
        filename=document.original_filename,
    )
