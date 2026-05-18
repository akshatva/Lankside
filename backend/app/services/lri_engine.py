from __future__ import annotations

import logging
from collections.abc import Iterable, Mapping
from typing import Any

from sqlalchemy import MetaData, Table, inspect, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.crud.audit_finding import get_audit_findings
from app.crud.business import get_business
from app.crud.document import get_documents
from app.crud.lri_score import create_lri_score
from app.models.audit_finding import AuditFinding
from app.models.business import Business
from app.models.document import Document
from app.schemas.lri import LRIBand, LRIRecommendation, LRIScoreCreate, LRIScoreRead

logger = logging.getLogger(__name__)

CRITICAL_DOCUMENTS = {
    "GST_CERTIFICATE": "GST certificate",
    "UDYAM_CERTIFICATE": "Udyam certificate",
    "PAN_CARD": "PAN card",
}
SUPPORTING_DOCUMENTS = {
    "BANK_STATEMENT": "Bank statement",
    "ITR_ACKNOWLEDGEMENT": "ITR acknowledgement",
}
MANDATORY_DOCUMENTS = {**CRITICAL_DOCUMENTS, **SUPPORTING_DOCUMENTS}
LOW_CONFIDENCE_THRESHOLD = 0.60
MOU_TABLE_CANDIDATES = ("mous", "mou_records", "mou_agreements")


class ScoreTracker:
    def __init__(self, score: float) -> None:
        self.score = score
        self.explanations: list[str] = []
        self.recommendations: dict[str, LRIRecommendation] = {}

    def deduct(
        self,
        points: float,
        explanation: str,
        recommendation: LRIRecommendation | None = None,
    ) -> None:
        self.score -= points
        self.explanations.append(f"-{points:g}: {explanation}")
        if recommendation is not None:
            self.recommendations.setdefault(recommendation.code, recommendation)

    def add(self, points: float, explanation: str) -> None:
        self.score += points
        self.explanations.append(f"+{points:g}: {explanation}")

    def final(self) -> float:
        return round(_clamp(self.score), 2)


def calculate_lri_for_business(db: Session, business_id: int) -> LRIScoreRead:
    business = get_business(db, business_id)
    if business is None:
        raise ValueError("Business profile not found.")

    documents = get_documents(db, business_id=business_id)
    documents_by_type = _latest_documents_by_type(documents)
    findings = get_audit_findings(db, business_id=business_id, is_resolved=False)
    mou_records = _load_mou_records(db, business_id)

    document_tracker = _calculate_document_integrity(documents_by_type, findings)
    collaboration_tracker = _calculate_collaboration_readiness(
        business,
        mou_records,
    )
    financial_tracker = _calculate_financial_consistency(
        business,
        documents_by_type,
        findings,
    )

    document_integrity_score = document_tracker.final()
    collaboration_score = collaboration_tracker.final()
    financial_consistency_score = financial_tracker.final()
    overall_score = round(
        (0.4 * document_integrity_score)
        + (0.3 * collaboration_score)
        + (0.3 * financial_consistency_score),
        2,
    )
    band = _band_for(overall_score)
    recommendations = _merge_recommendations(
        document_tracker,
        collaboration_tracker,
        financial_tracker,
        band=band,
    )
    explanation = _build_explanation(
        document_integrity_score=document_integrity_score,
        collaboration_score=collaboration_score,
        financial_consistency_score=financial_consistency_score,
        overall_score=overall_score,
        band=band,
        document_explanations=document_tracker.explanations,
        collaboration_explanations=collaboration_tracker.explanations,
        financial_explanations=financial_tracker.explanations,
    )

    score = create_lri_score(
        db,
        LRIScoreCreate(
            business_id=business.id,
            document_integrity_score=document_integrity_score,
            collaboration_score=collaboration_score,
            financial_consistency_score=financial_consistency_score,
            overall_score=overall_score,
            band=band,
            explanation=explanation,
            recommendations=recommendations,
        ),
    )
    return LRIScoreRead.model_validate(score)


def _calculate_document_integrity(
    documents_by_type: dict[str, Document],
    findings: list[AuditFinding],
) -> ScoreTracker:
    tracker = ScoreTracker(100)

    for document_type, label in CRITICAL_DOCUMENTS.items():
        if document_type not in documents_by_type:
            tracker.deduct(
                15,
                f"Missing critical document: {label}.",
                LRIRecommendation(
                    code=f"UPLOAD_{document_type}",
                    message=f"Upload the latest {label}.",
                    priority="HIGH",
                ),
            )

    for document_type, label in SUPPORTING_DOCUMENTS.items():
        if document_type not in documents_by_type:
            tracker.deduct(
                10,
                f"Missing supporting document: {label}.",
                LRIRecommendation(
                    code=f"UPLOAD_{document_type}",
                    message=f"Upload the latest {label}.",
                    priority="MEDIUM",
                ),
            )

    for document_type, label in MANDATORY_DOCUMENTS.items():
        document = documents_by_type.get(document_type)
        if document is not None and _status(document) == "FAILED":
            tracker.deduct(
                10,
                f"Failed mandatory document extraction: {label}.",
                LRIRecommendation(
                    code=f"RERUN_EXTRACTION_{document_type}",
                    message=f"Re-run extraction or re-upload a clearer {label}.",
                    priority="HIGH",
                ),
            )

        confidence_score = _confidence_score(document)
        if confidence_score is not None and confidence_score < LOW_CONFIDENCE_THRESHOLD:
            tracker.deduct(
                5,
                f"Low-confidence extraction for {label}: {confidence_score:.2f}.",
                LRIRecommendation(
                    code=f"REVIEW_LOW_CONFIDENCE_{document_type}",
                    message=f"Review extracted fields for the {label}.",
                    priority="MEDIUM",
                ),
            )

    for finding in findings:
        severity = _normalize_code(getattr(finding, "severity", None))
        if severity == "HIGH":
            tracker.deduct(
                10,
                f"HIGH audit finding: {finding.title}.",
                LRIRecommendation(
                    code="FIX_HIGH_AUDIT_FINDINGS",
                    message="Fix high-severity audit findings first.",
                    priority="HIGH",
                ),
            )
        elif severity == "MEDIUM":
            tracker.deduct(
                5,
                f"MEDIUM audit finding: {finding.title}.",
                LRIRecommendation(
                    code="FIX_MEDIUM_AUDIT_FINDINGS",
                    message="Resolve medium-severity audit findings before lender review.",
                    priority="MEDIUM",
                ),
            )
        elif severity == "LOW":
            tracker.deduct(
                2,
                f"LOW audit finding: {finding.title}.",
                LRIRecommendation(
                    code="REVIEW_LOW_AUDIT_FINDINGS",
                    message="Review low-severity audit findings for cleaner evidence.",
                    priority="LOW",
                ),
            )

    if not tracker.explanations:
        tracker.explanations.append("No document integrity deductions applied.")
    return tracker


def _calculate_collaboration_readiness(
    business: Business,
    mou_records: list[dict[str, Any]],
) -> ScoreTracker:
    tracker = ScoreTracker(40)
    tracker.explanations.append("+40: Baseline collaboration readiness.")

    if mou_records:
        tracker.add(20, "At least one MOU record exists.")
    else:
        tracker.recommendations.setdefault(
            "CREATE_STRUCTURED_MOU",
            LRIRecommendation(
                code="CREATE_STRUCTURED_MOU",
                message="Improve collaboration readiness by generating at least one structured MOU.",
                priority="MEDIUM",
            ),
        )

    if any(_mou_status(record) in {"GENERATED", "EXPORTED"} for record in mou_records):
        tracker.add(15, "At least one MOU is generated or exported.")
    if any(_has_value(record.get("cluster_purpose")) for record in mou_records):
        tracker.add(10, "At least one MOU includes a cluster purpose.")
    if _has_value(business.industry_type):
        tracker.add(10, "Business industry type is present.")
    else:
        tracker.recommendations.setdefault(
            "ADD_INDUSTRY_TYPE",
            LRIRecommendation(
                code="ADD_INDUSTRY_TYPE",
                message="Add industry type to the business profile.",
                priority="LOW",
            ),
        )
    if _has_value(business.city) and _has_value(business.state):
        tracker.add(5, "Business city and state are present.")
    else:
        tracker.recommendations.setdefault(
            "ADD_CITY_STATE",
            LRIRecommendation(
                code="ADD_CITY_STATE",
                message="Add city and state to the business profile.",
                priority="LOW",
            ),
        )

    return tracker


def _calculate_financial_consistency(
    business: Business,
    documents_by_type: dict[str, Document],
    findings: list[AuditFinding],
) -> ScoreTracker:
    tracker = ScoreTracker(100)

    bank_statement = documents_by_type.get("BANK_STATEMENT")
    itr_acknowledgement = documents_by_type.get("ITR_ACKNOWLEDGEMENT")

    if bank_statement is None:
        tracker.deduct(
            20,
            "Bank statement is missing.",
            LRIRecommendation(
                code="UPLOAD_BANK_STATEMENT",
                message="Upload a recent bank statement.",
                priority="HIGH",
            ),
        )
    if itr_acknowledgement is None:
        tracker.deduct(
            20,
            "ITR acknowledgement is missing.",
            LRIRecommendation(
                code="UPLOAD_ITR_ACKNOWLEDGEMENT",
                message="Upload the latest ITR acknowledgement.",
                priority="HIGH",
            ),
        )
    if _extraction_missing_or_failed(bank_statement):
        tracker.deduct(
            15,
            "Bank statement extraction is missing or failed.",
            LRIRecommendation(
                code="EXTRACT_BANK_STATEMENT",
                message="Re-run extraction for the bank statement.",
                priority="HIGH",
            ),
        )
    if _extraction_missing_or_failed(itr_acknowledgement):
        tracker.deduct(
            15,
            "ITR acknowledgement extraction is missing or failed.",
            LRIRecommendation(
                code="EXTRACT_ITR_ACKNOWLEDGEMENT",
                message="Re-run extraction for the ITR acknowledgement.",
                priority="HIGH",
            ),
        )

    for finding in findings:
        if _is_pan_mismatch(finding):
            tracker.deduct(
                15,
                f"PAN mismatch finding: {finding.title}.",
                LRIRecommendation(
                    code="RESOLVE_PAN_MISMATCH",
                    message="Resolve PAN mismatch before applying for formal credit.",
                    priority="HIGH",
                ),
            )
        if _is_bank_holder_mismatch(finding):
            tracker.deduct(
                10,
                f"Bank account holder mismatch finding: {finding.title}.",
                LRIRecommendation(
                    code="RESOLVE_BANK_HOLDER_MISMATCH",
                    message="Resolve bank account holder mismatch before lender submission.",
                    priority="HIGH",
                ),
            )

    if not _has_value(business.turnover_range):
        tracker.deduct(
            5,
            "Business turnover range is missing.",
            LRIRecommendation(
                code="ADD_TURNOVER_RANGE",
                message="Add turnover range to improve financial consistency context.",
                priority="LOW",
            ),
        )
    if business.business_age_years is None:
        tracker.deduct(
            5,
            "Business age is missing.",
            LRIRecommendation(
                code="ADD_BUSINESS_AGE",
                message="Add business age in years to the business profile.",
                priority="LOW",
            ),
        )

    if not tracker.explanations:
        tracker.explanations.append("No financial consistency deductions applied.")
    return tracker


def _latest_documents_by_type(documents: Iterable[Document]) -> dict[str, Document]:
    latest_documents: dict[str, Document] = {}
    for document in documents:
        document_type = _normalize_code(getattr(document, "document_type", None))
        if document_type:
            latest_documents.setdefault(document_type, document)
    return latest_documents


def _load_mou_records(db: Session, business_id: int) -> list[dict[str, Any]]:
    bind = db.get_bind()
    try:
        inspector = inspect(bind)
        for table_name in MOU_TABLE_CANDIDATES:
            if not inspector.has_table(table_name):
                continue
            metadata = MetaData()
            table = Table(table_name, metadata, autoload_with=bind)
            if "business_id" not in table.c:
                continue
            rows = db.execute(
                select(table).where(table.c.business_id == business_id),
            ).mappings()
            return [dict(row) for row in rows]
    except SQLAlchemyError:
        logger.exception("Unable to load optional MOU records for LRI scoring.")
    return []


def _confidence_score(document: Document | None) -> float | None:
    if document is None:
        return None
    payload = _extract_payload(document)
    if payload is None:
        return _coerce_float(getattr(document, "confidence_score", None))
    return (
        _coerce_float(payload.get("confidence_score"))
        or _coerce_float(payload.get("confidence"))
        or _coerce_float(getattr(document, "confidence_score", None))
    )


def _extraction_missing_or_failed(document: Document | None) -> bool:
    if document is None:
        return True
    document_status = _status(document)
    if document_status == "FAILED":
        return True
    if document_status != "COMPLETED":
        return True
    return _extract_payload(document) is None


def _extract_payload(document: Document) -> dict[str, Any] | None:
    for attr_name in (
        "extraction_result",
        "extracted_fields",
        "extracted_data",
        "extraction_data",
    ):
        payload = _as_mapping(getattr(document, attr_name, None))
        if payload:
            return payload
    for relation_name in ("extractions", "extraction_results"):
        related = getattr(document, relation_name, None)
        if not related:
            continue
        latest = related[0] if isinstance(related, (list, tuple)) else related
        payload = _as_mapping(latest)
        if payload:
            return payload
    return None


def _as_mapping(value: Any) -> dict[str, Any] | None:
    if value is None:
        return None
    if isinstance(value, dict):
        return value
    if isinstance(value, Mapping):
        return dict(value)
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "__dict__"):
        return {
            key: item
            for key, item in vars(value).items()
            if not key.startswith("_") and key != "metadata"
        }
    return None


def _is_pan_mismatch(finding: AuditFinding) -> bool:
    return "pan" in _finding_text(finding) and "mismatch" in _finding_text(finding)


def _is_bank_holder_mismatch(finding: AuditFinding) -> bool:
    text = _finding_text(finding)
    return "bank" in text and "holder" in text and "match" in text


def _finding_text(finding: AuditFinding) -> str:
    values = [
        getattr(finding, "finding_type", None),
        getattr(finding, "title", None),
        getattr(finding, "description", None),
        getattr(finding, "field_name", None),
    ]
    return " ".join(str(value) for value in values if value is not None).lower()


def _mou_status(record: dict[str, Any]) -> str:
    return _normalize_code(record.get("status"))


def _status(document: Document) -> str:
    return _normalize_code(getattr(document, "status", None))


def _normalize_code(value: Any) -> str:
    if value is None:
        return ""
    enum_value = getattr(value, "value", value)
    return str(enum_value).strip().upper()


def _has_value(value: Any) -> bool:
    return value is not None and str(value).strip() != ""


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _clamp(score: float) -> float:
    return min(100, max(0, score))


def _band_for(score: float) -> LRIBand:
    if score < 50:
        return "RED"
    if score < 80:
        return "YELLOW"
    return "GREEN"


def _merge_recommendations(
    *trackers: ScoreTracker,
    band: LRIBand,
) -> list[LRIRecommendation]:
    recommendations: dict[str, LRIRecommendation] = {}
    for tracker in trackers:
        recommendations.update(tracker.recommendations)
    if band == "RED":
        recommendations.setdefault(
            "FOCUS_CORE_READINESS",
            LRIRecommendation(
                code="FOCUS_CORE_READINESS",
                message="Prioritize missing documents, failed extractions, and high-severity audit findings before applying for formal credit.",
                priority="HIGH",
            ),
        )
    return sorted(
        recommendations.values(),
        key=lambda item: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}[item.priority],
    )


def _build_explanation(
    *,
    document_integrity_score: float,
    collaboration_score: float,
    financial_consistency_score: float,
    overall_score: float,
    band: LRIBand,
    document_explanations: list[str],
    collaboration_explanations: list[str],
    financial_explanations: list[str],
) -> str:
    sections = [
        "LRI is calculated deterministically as (0.4 x D) + (0.3 x C) + (0.3 x F).",
        f"D={document_integrity_score}, C={collaboration_score}, F={financial_consistency_score}, overall={overall_score}, band={band}.",
        "Document Integrity: " + " ".join(document_explanations),
        "Collaboration Readiness: " + " ".join(collaboration_explanations),
        "Financial Consistency: " + " ".join(financial_explanations),
    ]
    return "\n".join(sections)
