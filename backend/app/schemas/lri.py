from datetime import datetime
from typing import Any, List, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

LRIBand = Literal["RED", "YELLOW", "GREEN"]


class LRIRecommendation(BaseModel):
    code: str
    message: str
    priority: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM"


class LRIScoreCreate(BaseModel):
    business_id: int
    document_integrity_score: float = Field(ge=0, le=100)
    collaboration_score: float = Field(ge=0, le=100)
    financial_consistency_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)
    band: LRIBand
    explanation: str
    recommendations: List[LRIRecommendation] = Field(default_factory=list)

    @field_validator("recommendations", mode="before")
    @classmethod
    def default_recommendations(cls, value: Any) -> Any:
        return [] if value is None else value

    @field_validator(
        "document_integrity_score",
        "collaboration_score",
        "financial_consistency_score",
        "overall_score",
        mode="before",
    )
    @classmethod
    def clamp_scores(cls, value: Any) -> Any:
        return _clamp_score_value(value)


class LRIScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    document_integrity_score: float = Field(ge=0, le=100)
    collaboration_score: float = Field(ge=0, le=100)
    financial_consistency_score: float = Field(ge=0, le=100)
    overall_score: float = Field(ge=0, le=100)
    band: LRIBand
    explanation: str
    recommendations: List[LRIRecommendation] = Field(default_factory=list)
    created_at: datetime

    @field_validator("recommendations", mode="before")
    @classmethod
    def default_read_recommendations(cls, value: Any) -> Any:
        return [] if value is None else value

    @field_validator(
        "document_integrity_score",
        "collaboration_score",
        "financial_consistency_score",
        "overall_score",
        mode="before",
    )
    @classmethod
    def clamp_read_scores(cls, value: Any) -> Any:
        return _clamp_score_value(value)


def _clamp_score_value(value: Any) -> Any:
    if value is None:
        return value
    try:
        numeric_value = float(value)
    except (TypeError, ValueError):
        return value
    return min(100, max(0, numeric_value))


class LRIScoreResult(LRIScoreRead):
    pass


class LRIScoreHistory(BaseModel):
    business_id: int
    scores: List[LRIScoreRead]


class LRIScoreBreakdown(BaseModel):
    document_integrity_deductions: List[str]
    collaboration_additions: List[str]
    financial_consistency_deductions: List[str]


class LRIScoreCalculation(BaseModel):
    result: LRIScoreResult
    breakdown: LRIScoreBreakdown
    metadata: dict[str, Any] = {}
