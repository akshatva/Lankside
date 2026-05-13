from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict

SchemeCategory = Literal[
    "CREDIT",
    "CREDIT / SUBSIDY",
    "CERTIFICATION / SUBSIDY",
    "CLUSTER_DEVELOPMENT",
    "GUARANTEE",
]

RecommendationStatus = Literal["Strong fit", "Moderate fit", "Weak fit"]

GRANT_SCOUT_DISCLAIMER = (
    "Preliminary scheme-fit recommendations based on available business profile "
    "and seeded scheme rules. Scheme eligibility should be verified against "
    "official government guidelines before applying."
)


class SchemeCreate(BaseModel):
    code: str
    name: str
    category: SchemeCategory
    description: str
    eligibility_summary: str
    benefits_summary: str
    state: Optional[str] = None
    industry_focus: str = "general"
    source_url: Optional[str] = None
    is_active: bool = True


class SchemeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    name: str
    category: str
    description: str
    eligibility_summary: str
    benefits_summary: str
    state: Optional[str]
    industry_focus: str
    source_url: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime


class SchemeMatchCreate(BaseModel):
    business_id: int
    scheme_id: int
    match_score: float
    recommendation_status: RecommendationStatus
    match_reason: str
    eligibility_notes: str
    required_documents: List[str] = []
    vector_score: Optional[float] = None


class SchemeMatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    scheme_id: int
    match_score: float
    recommendation_status: RecommendationStatus
    match_reason: str
    eligibility_notes: str
    required_documents: List[str]
    vector_score: Optional[float]
    created_at: datetime
    scheme: SchemeRead


class SchemeMatchResult(SchemeMatchRead):
    pass


class GrantMatchRunResponse(BaseModel):
    business_id: int
    total_matches: int
    matches: List[SchemeMatchResult]
    disclaimer: str = GRANT_SCOUT_DISCLAIMER


class SchemeSeedResponse(BaseModel):
    inserted: int
    updated: int
    total_seeded: int
