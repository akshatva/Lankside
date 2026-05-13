from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict

AuditSeverity = Literal["HIGH", "MEDIUM", "LOW"]


class AuditFindingCreate(BaseModel):
    business_id: int
    document_id: Optional[int] = None
    finding_type: str
    severity: AuditSeverity
    title: str
    description: str
    recommendation: str
    field_name: Optional[str] = None
    expected_value: Optional[str] = None
    actual_value: Optional[str] = None


class AuditFindingUpdate(BaseModel):
    is_resolved: Optional[bool] = None


class AuditFindingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    document_id: Optional[int]
    finding_type: str
    severity: AuditSeverity
    title: str
    description: str
    recommendation: str
    field_name: Optional[str]
    expected_value: Optional[str]
    actual_value: Optional[str]
    is_resolved: bool
    created_at: datetime
    updated_at: datetime


class AuditSummary(BaseModel):
    business_id: int
    total_findings: int
    high_count: int
    medium_count: int
    low_count: int
    missing_documents_count: int
    generated_findings: List[AuditFindingRead]


class AuditRunResponse(AuditSummary):
    pass
