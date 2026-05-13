from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.document import DocumentCreate


def create_document(
    db: Session,
    document_in: DocumentCreate,
    *,
    original_filename: str,
    stored_filename: str,
    file_path: str,
    mime_type: str | None,
    file_size_bytes: int,
) -> Document:
    document = Document(
        **document_in.model_dump(),
        status="PENDING",
        original_filename=original_filename,
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=mime_type,
        file_size_bytes=file_size_bytes,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


def get_document(db: Session, document_id: int) -> Document | None:
    return db.get(Document, document_id)


def get_documents(
    db: Session,
    *,
    business_id: int | None = None,
    document_type: str | None = None,
    status: str | None = None,
) -> list[Document]:
    query = db.query(Document)

    if business_id is not None:
        query = query.filter(Document.business_id == business_id)
    if document_type is not None:
        query = query.filter(Document.document_type == document_type)
    if status is not None:
        query = query.filter(Document.status == status)

    return query.order_by(Document.uploaded_at.desc()).all()


def delete_document(db: Session, document: Document) -> None:
    db.delete(document)
    db.commit()
