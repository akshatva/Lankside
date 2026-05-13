from pydantic import BaseModel


class DemoSummary(BaseModel):
    demo_businesses: int
    documents: int
    extractions: int
    audit_findings: int
    lri_scores: int
    mous: int
    scheme_matches: int
    reports: int


class DemoSeedResponse(BaseModel):
    success: bool
    message: str
    created: dict[str, int]
    updated: dict[str, int]
    summary: DemoSummary


class DemoResetResponse(BaseModel):
    success: bool
    message: str
    deleted: dict[str, int]
    summary: DemoSummary
