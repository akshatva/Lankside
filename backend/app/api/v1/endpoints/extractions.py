from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.document import get_document, get_documents
from app.db.session import get_db
from app.models.document import Document
from app.schemas.extraction import ExtractionList, ExtractionRead

router = APIRouter(prefix="/extractions")


def _to_extraction_read(document: Document) -> ExtractionRead:
    extraction_status = "COMPLETED" if document.status == "COMPLETED" else document.status
    confidence_score = 0.92 if document.status == "COMPLETED" else None
    return ExtractionRead(
        document_id=document.id,
        business_id=document.business_id,
        document_type=document.document_type,
        status=document.status,
        extraction_status=extraction_status,
        confidence_score=confidence_score,
        extracted_fields={
            "document_type": document.document_type,
            "source": "deterministic_demo_extraction",
            "sensitive_values_redacted": True,
        }
        if document.status == "COMPLETED"
        else {},
        processed_at=document.processed_at,
    )


@router.get("", response_model=ExtractionList)
def list_extractions(
    business_id: Optional[int] = Query(default=None),
    document_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db),
) -> ExtractionList:
    if document_id is not None:
        document = get_document(db, document_id)
        if document is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        documents = [document]
    else:
        documents = get_documents(db, business_id=business_id)
    return ExtractionList(extractions=[_to_extraction_read(document) for document in documents])


@router.get("/{document_id}", response_model=ExtractionRead)
def read_extraction(
    document_id: int,
    db: Session = Depends(get_db),
) -> ExtractionRead:
    document = get_document(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return _to_extraction_read(document)


@router.post("/{document_id}/run", response_model=ExtractionRead)
def run_extraction(
    document_id: int,
    db: Session = Depends(get_db),
) -> ExtractionRead:
    document = get_document(db, document_id)
    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    document.status = "COMPLETED"
    document.processed_at = datetime.now(timezone.utc)
    db.add(document)
    db.commit()
    db.refresh(document)
    return _to_extraction_read(document)
