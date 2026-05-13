from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.orm import Session

from app.crud.audit_finding import get_audit_findings
from app.crud.business import get_business
from app.crud.document import get_documents
from app.crud.lri_score import get_latest_lri_score_for_business
from app.crud.mou import get_mous
from app.crud.scheme import get_schemes
from app.crud.scheme_match import clear_matches_for_business, create_scheme_match
from app.models.business import Business
from app.models.lri_score import LRIScore
from app.models.mou import MOU
from app.models.scheme import Scheme
from app.schemas.scheme import (
    GRANT_SCOUT_DISCLAIMER,
    GrantMatchRunResponse,
    SchemeMatchCreate,
    SchemeMatchResult,
)
from app.services.vector_search import search_schemes


@dataclass
class MatchTracker:
    score: float = 40
    reasons: list[str] = field(default_factory=lambda: ["Base scheme-fit score: 40."])
    documents: set[str] = field(default_factory=set)
    vector_score: float | None = None

    def add(self, points: float, reason: str) -> None:
        self.score += points
        self.reasons.append(f"+{points:g}: {reason}")

    def deduct(self, points: float, reason: str) -> None:
        self.score -= points
        self.reasons.append(f"-{points:g}: {reason}")

    def final_score(self) -> float:
        return round(min(100, max(0, self.score)), 2)


def run_grant_matching(db: Session, business_id: int) -> GrantMatchRunResponse:
    business = get_business(db, business_id)
    if business is None:
        raise ValueError("Business profile not found.")

    schemes = get_schemes(db, active_only=True)
    documents = get_documents(db, business_id=business_id)
    document_types = {document.document_type for document in documents}
    latest_lri = get_latest_lri_score_for_business(db, business_id)
    findings = get_audit_findings(db, business_id=business_id, is_resolved=False)
    high_findings = [finding for finding in findings if finding.severity == "HIGH"]
    mous = get_mous(db, business_id=business_id)
    vector_boosts = _vector_boosts(business, schemes)

    clear_matches_for_business(db, business_id)
    created_matches = []
    for scheme in schemes:
        tracker = _score_scheme(
            business=business,
            scheme=scheme,
            document_types=document_types,
            latest_lri=latest_lri,
            high_finding_count=len(high_findings),
            mous=mous,
            vector_score=vector_boosts.get(scheme.code),
        )
        match = create_scheme_match(
            db,
            SchemeMatchCreate(
                business_id=business.id,
                scheme_id=scheme.id,
                match_score=tracker.final_score(),
                recommendation_status=_recommendation_status(tracker.final_score()),
                match_reason=_match_reason(scheme, business, tracker),
                eligibility_notes=_eligibility_notes(scheme),
                required_documents=sorted(tracker.documents),
                vector_score=tracker.vector_score,
            ),
            commit=False,
        )
        created_matches.append(match)

    db.commit()
    for match in created_matches:
        db.refresh(match)

    sorted_matches = sorted(
        created_matches,
        key=lambda item: (-item.match_score, item.id),
    )
    return GrantMatchRunResponse(
        business_id=business.id,
        total_matches=len(sorted_matches),
        matches=[SchemeMatchResult.model_validate(match) for match in sorted_matches],
        disclaimer=GRANT_SCOUT_DISCLAIMER,
    )


def _score_scheme(
    *,
    business: Business,
    scheme: Scheme,
    document_types: set[str],
    latest_lri: LRIScore | None,
    high_finding_count: int,
    mous: list[MOU],
    vector_score: float | None,
) -> MatchTracker:
    tracker = MatchTracker()
    industry = _normalized(business.industry_type)
    turnover = _normalized(business.turnover_range)
    profile_fields = [
        business.industry_type,
        business.state,
        business.city,
        business.turnover_range,
        business.business_age_years,
    ]

    if business.industry_type:
        tracker.add(10, "Industry type is available.")
    if business.state:
        tracker.add(5, "State is available.")
    if business.city:
        tracker.add(5, "City is available.")
    if business.turnover_range:
        tracker.add(5, "Turnover range is available.")
    if business.business_age_years is not None:
        tracker.add(5, "Business age is available.")

    code = scheme.code.upper()
    if code == "PMEGP":
        tracker.documents.update(["Business profile", "Project report", "Identity proof"])
        if business.business_age_years in (None, 0, 1):
            tracker.add(15, "Business appears new or early-stage.")
        if _contains_any(industry, ["manufacturing", "service", "trading", "trade", "retail"]):
            tracker.add(10, "Industry aligns with common PMEGP activity categories.")
        if _is_micro_or_small(turnover):
            tracker.add(5, "Turnover range suggests micro or small scale.")
    elif code == "MUDRA":
        tracker.documents.update(["Business profile", "Bank statement", "KYC documents"])
        if _contains_any(
            industry,
            ["trader", "stockist", "distributor", "service", "shop", "retail"],
        ):
            tracker.add(15, "Business type aligns with MUDRA borrower profiles.")
        if _is_micro_or_small(turnover):
            tracker.add(10, "Turnover range suggests micro or small scale.")
        if business.business_age_years is not None:
            tracker.add(5, "Business age is available for lender review.")
    elif code == "ZED_CERTIFICATION":
        tracker.documents.update(["Udyam certificate", "GST certificate", "Process details"])
        if _contains_any(
            industry,
            ["manufacturing", "textile", "industrial", "production", "factory"],
        ):
            tracker.add(25, "Industry suggests manufacturing readiness for ZED.")
        if "GST_CERTIFICATE" in document_types:
            tracker.add(10, "GST certificate is uploaded.")
        if latest_lri is not None and latest_lri.overall_score >= 50:
            tracker.add(5, "Latest LRI is at least 50.")
    elif code == "MSE_CDP":
        tracker.documents.update(
            ["Cluster proposal", "MOU or collaboration evidence", "Unit details"],
        )
        if mous:
            tracker.add(20, "At least one MOU exists for collaboration evidence.")
        if any(_has_value(mou.cluster_purpose) for mou in mous):
            tracker.add(15, "At least one MOU includes cluster purpose.")
        if _contains_any(industry, ["manufacturing", "textile", "industrial"]):
            tracker.add(10, "Industry suggests cluster development potential.")
        if business.city and business.state:
            tracker.add(5, "City and state are available for cluster mapping.")
    elif code == "CGTMSE":
        tracker.documents.update(["Udyam certificate", "GST certificate", "Bank statement"])
        if business.gstin or business.udyam_id:
            tracker.add(15, "GSTIN or Udyam ID is available.")
        if latest_lri is not None and latest_lri.overall_score >= 50:
            tracker.add(10, "Latest LRI is at least 50.")
        if high_finding_count == 0:
            tracker.add(10, "No unresolved HIGH audit findings are present.")
        if "BANK_STATEMENT" in document_types:
            tracker.add(5, "Bank statement is uploaded.")

    if _present_count(profile_fields) <= 2:
        tracker.deduct(10, "Business profile is very incomplete.")
    if high_finding_count > 0:
        tracker.deduct(10, "Unresolved HIGH audit findings are present.")
    if latest_lri is not None and latest_lri.band == "RED":
        tracker.deduct(5, "Latest LRI band is RED.")

    if vector_score is not None:
        boost = round(min(5, max(0, vector_score * 5)), 2)
        tracker.vector_score = vector_score
        if boost > 0:
            tracker.add(boost, "Optional vector retrieval returned a related scheme.")

    return tracker


def _vector_boosts(business: Business, schemes: list[Scheme]) -> dict[str, float]:
    if not schemes:
        return {}
    query = " ".join(
        str(value)
        for value in [
            business.business_name,
            business.industry_type,
            business.city,
            business.state,
            business.turnover_range,
        ]
        if value
    )
    if not query:
        return {}
    results = search_schemes(query, top_k=len(schemes))
    boosts: dict[str, float] = {}
    for result in results:
        code = result.get("code")
        score = _coerce_float(result.get("score"))
        if code and score is not None:
            boosts[str(code)] = score
    return boosts


def _match_reason(scheme: Scheme, business: Business, tracker: MatchTracker) -> str:
    manual_check = (
        "Manual verification required: check official scheme guidelines, current "
        "eligibility conditions, lender or ministry process, and document requirements "
        "before applying."
    )
    return (
        f"{scheme.name} was matched for {business.business_name} using seeded "
        f"scheme rules. Evidence: {' '.join(tracker.reasons)} {manual_check}"
    )


def _eligibility_notes(scheme: Scheme) -> str:
    return (
        f"{scheme.eligibility_summary} This is a preliminary fit signal, not an "
        "eligibility decision or approval."
    )


def _recommendation_status(score: float) -> str:
    if score >= 80:
        return "Strong fit"
    if score >= 50:
        return "Moderate fit"
    return "Weak fit"


def _contains_any(value: str, needles: list[str]) -> bool:
    return any(needle in value for needle in needles)


def _is_micro_or_small(value: str) -> bool:
    return _contains_any(value, ["micro", "small", "low", "under", "below", "<"])


def _normalized(value: Any) -> str:
    return str(value or "").strip().lower()


def _has_value(value: Any) -> bool:
    return value is not None and str(value).strip() != ""


def _present_count(values: list[Any]) -> int:
    return sum(1 for value in values if _has_value(value))


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
