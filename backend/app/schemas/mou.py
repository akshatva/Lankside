from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

MOUStatus = Literal["GENERATED", "EXPORTED"]


def _strip_text(value: str) -> str:
    return value.strip()


class MOUBase(BaseModel):
    business_id: int
    party_a_name: str = Field(min_length=2, max_length=255)
    party_b_name: str = Field(min_length=2, max_length=255)
    purpose: str = Field(min_length=5)
    duration_months: int = Field(gt=0, le=120)
    contribution_details: str = Field(min_length=5)
    revenue_sharing: str = Field(min_length=1)
    dispute_resolution: str = Field(min_length=5)
    cluster_purpose: str = Field(min_length=5)

    @field_validator(
        "party_a_name",
        "party_b_name",
        "purpose",
        "contribution_details",
        "revenue_sharing",
        "dispute_resolution",
        "cluster_purpose",
    )
    @classmethod
    def strip_input_text(cls, value: str) -> str:
        return _strip_text(value)


class MOUCreate(MOUBase):
    draft_text: str
    status: MOUStatus = "GENERATED"


class MOUGenerateRequest(MOUBase):
    pass


class MOUUpdate(BaseModel):
    party_a_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    party_b_name: Optional[str] = Field(default=None, min_length=2, max_length=255)
    purpose: Optional[str] = Field(default=None, min_length=5)
    duration_months: Optional[int] = Field(default=None, gt=0, le=120)
    contribution_details: Optional[str] = Field(default=None, min_length=5)
    revenue_sharing: Optional[str] = Field(default=None, min_length=1)
    dispute_resolution: Optional[str] = Field(default=None, min_length=5)
    cluster_purpose: Optional[str] = Field(default=None, min_length=5)
    draft_text: Optional[str] = Field(default=None, min_length=10)

    @field_validator(
        "party_a_name",
        "party_b_name",
        "purpose",
        "contribution_details",
        "revenue_sharing",
        "dispute_resolution",
        "cluster_purpose",
        "draft_text",
    )
    @classmethod
    def strip_optional_text(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        return _strip_text(value)


class MOURead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    party_a_name: str
    party_b_name: str
    purpose: str
    duration_months: int
    contribution_details: str
    revenue_sharing: str
    dispute_resolution: str
    cluster_purpose: str
    draft_text: str
    pdf_path: Optional[str]
    status: MOUStatus
    created_at: datetime
    updated_at: datetime


class MOUGenerateResponse(MOURead):
    pass


class MOUExportResponse(MOURead):
    pass
