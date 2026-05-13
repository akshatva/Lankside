from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict

DocumentType = Literal[
    "GST_CERTIFICATE",
    "UDYAM_CERTIFICATE",
    "PAN_CARD",
    "BANK_STATEMENT",
    "ITR_ACKNOWLEDGEMENT",
    "OTHER",
]

DocumentStatus = Literal["PENDING", "PROCESSING", "COMPLETED", "FAILED"]


class DocumentCreate(BaseModel):
    business_id: int
    document_type: DocumentType


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    document_type: str
    status: str
    original_filename: str
    stored_filename: str
    file_path: str
    mime_type: Optional[str]
    file_size_bytes: int
    uploaded_at: datetime
    processed_at: Optional[datetime]


class DocumentList(BaseModel):
    documents: List[DocumentRead]
