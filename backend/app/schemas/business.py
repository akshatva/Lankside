from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


def _uppercase_or_none(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized.upper() or None


class BusinessBase(BaseModel):
    udyam_id: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    industry_type: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    business_age_years: Optional[int] = Field(default=None, ge=0)
    turnover_range: Optional[str] = None

    @field_validator("udyam_id", "gstin", "pan", mode="before")
    @classmethod
    def uppercase_registration_ids(cls, value: Optional[str]) -> Optional[str]:
        return _uppercase_or_none(value)


class BusinessCreate(BusinessBase):
    business_name: str = Field(min_length=2)
    owner_name: str = Field(min_length=2)


class BusinessUpdate(BusinessBase):
    business_name: Optional[str] = Field(default=None, min_length=2)
    owner_name: Optional[str] = Field(default=None, min_length=2)


class BusinessRead(BusinessBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    business_name: str
    owner_name: str
    created_at: datetime
    updated_at: datetime
