from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ExtractionRead(BaseModel):
    document_id: int
    business_id: int
    document_type: str
    status: str
    extraction_status: str
    confidence_score: Optional[float]
    extracted_fields: dict[str, Any]
    processed_at: Optional[datetime]


class ExtractionList(BaseModel):
    extractions: list[ExtractionRead]
