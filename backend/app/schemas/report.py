from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict

ReportType = Literal["BANKABILITY_REPORT"]
ReportStatus = Literal["GENERATING", "GENERATED", "FAILED"]

BANKABILITY_REPORT_DISCLAIMER = (
    "The Bankability Report is informational and not a formal credit score, "
    "legal certification, loan approval, or government approval."
)


class ReportSummary(BaseModel):
    business_name: str
    lri_score: Optional[float] = None
    lri_band: Optional[str] = None
    total_audit_findings: int
    high_severity_findings: int
    top_grant_match: Optional[str] = None
    top_grant_match_score: Optional[float] = None
    recommendation: str
    disclaimer: str = BANKABILITY_REPORT_DISCLAIMER


class ReportCreate(BaseModel):
    business_id: int
    report_type: ReportType = "BANKABILITY_REPORT"
    status: ReportStatus = "GENERATING"
    summary: dict[str, Any] = {}
    summary_text: str = ""
    pdf_path: Optional[str] = None
    generated_at: Optional[datetime] = None


class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    summary: Optional[dict[str, Any]] = None
    summary_text: Optional[str] = None
    pdf_path: Optional[str] = None
    generated_at: Optional[datetime] = None


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    report_type: str
    status: str
    summary: dict[str, Any]
    summary_text: str
    pdf_path: Optional[str]
    generated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ReportSummaryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    report_type: str
    status: str
    pdf_path: Optional[str]
    generated_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime


class ReportGenerateResponse(ReportRead):
    disclaimer: str = BANKABILITY_REPORT_DISCLAIMER
