from datetime import datetime
from typing import Any, List, Literal

from pydantic import BaseModel, ConfigDict

LRIBand = Literal["RED", "YELLOW", "GREEN"]


class LRIRecommendation(BaseModel):
    code: str
    message: str
    priority: Literal["HIGH", "MEDIUM", "LOW"] = "MEDIUM"


class LRIScoreCreate(BaseModel):
    business_id: int
    document_integrity_score: float
    collaboration_score: float
    financial_consistency_score: float
    overall_score: float
    band: LRIBand
    explanation: str
    recommendations: List[LRIRecommendation] = []


class LRIScoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    business_id: int
    document_integrity_score: float
    collaboration_score: float
    financial_consistency_score: float
    overall_score: float
    band: LRIBand
    explanation: str
    recommendations: List[LRIRecommendation] = []
    created_at: datetime


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
