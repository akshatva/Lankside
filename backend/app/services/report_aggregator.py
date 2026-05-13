from __future__ import annotations

from collections import Counter
from collections.abc import Mapping
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.crud.audit_finding import get_audit_findings
from app.crud.business import get_business
from app.crud.document import get_documents
from app.crud.lri_score import get_latest_lri_score_for_business
from app.crud.mou import get_mous
from app.crud.scheme_match import get_scheme_matches
from app.models.audit_finding import AuditFinding
from app.models.document import Document
from app.schemas.report import BANKABILITY_REPORT_DISCLAIMER


def aggregate_bankability_report_data(
    db: Session,
    business_id: int,
) -> dict[str, Any]:
    business = get_business(db, business_id)
    if business is None:
        raise ValueError("Business profile not found.")

    documents = get_documents(db, business_id=business_id)
    audit_findings = get_audit_findings(
        db,
        business_id=business_id,
        is_resolved=False,
    )
    latest_lri = get_latest_lri_score_for_business(db, business_id)
    mous = get_mous(db, business_id=business_id)
    grant_matches = get_scheme_matches(db, business_id)
    recommendations = _build_recommendations(
        documents=documents,
        audit_findings=audit_findings,
        latest_lri=latest_lri,
        mous=mous,
    )
    summary_text = _build_executive_summary(
        business_name=business.business_name,
        lri_score=latest_lri.overall_score if latest_lri else None,
        lri_band=latest_lri.band if latest_lri else None,
        high_findings=_findings_by_severity(audit_findings)["HIGH"],
        document_count=len(documents),
        grant_count=len(grant_matches),
    )

    latest_mou = mous[0] if mous else None
    top_matches = grant_matches[:5]

    return {
        "report_title": "Bankability Report",
        "positioning": "AI-assisted MSME readiness and documentation summary.",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": BANKABILITY_REPORT_DISCLAIMER,
        "business_profile": {
            "id": business.id,
            "business_name": business.business_name,
            "owner_name": business.owner_name,
            "industry": business.industry_type,
            "location": _join_non_empty([business.city, business.state]),
            "turnover_range": business.turnover_range,
            "business_age_years": business.business_age_years,
            "gstin_available": bool(_has_value(business.gstin)),
            "udyam_available": bool(_has_value(business.udyam_id)),
            "pan_available": bool(_has_value(business.pan)),
        },
        "executive_summary": {
            "summary_text": summary_text,
            "major_strengths": _major_strengths(
                documents=documents,
                latest_lri=latest_lri,
                mous=mous,
                grant_matches=grant_matches,
            ),
            "major_risks": _major_risks(
                documents=documents,
                audit_findings=audit_findings,
                latest_lri=latest_lri,
            ),
        },
        "documents": {
            "total_uploaded": len(documents),
            "document_types": sorted({document.document_type for document in documents}),
            "status_counts": dict(Counter(document.status for document in documents)),
            "items": [_document_summary(document) for document in documents],
            "extraction_confidence_overview": _confidence_overview(documents),
        },
        "audit_findings": {
            "total_unresolved": len(audit_findings),
            "by_severity": _findings_by_severity(audit_findings),
            "high": [_finding_summary(item) for item in audit_findings if item.severity == "HIGH"],
            "medium": [_finding_summary(item) for item in audit_findings if item.severity == "MEDIUM"],
            "low": [_finding_summary(item) for item in audit_findings if item.severity == "LOW"],
            "unresolved_risks": [_finding_summary(item) for item in audit_findings[:10]],
        },
        "lri": {
            "document_integrity_score": latest_lri.document_integrity_score
            if latest_lri
            else None,
            "collaboration_score": latest_lri.collaboration_score if latest_lri else None,
            "financial_consistency_score": latest_lri.financial_consistency_score
            if latest_lri
            else None,
            "overall_score": latest_lri.overall_score if latest_lri else None,
            "band": latest_lri.band if latest_lri else None,
            "explanation": latest_lri.explanation if latest_lri else None,
            "recommendations": latest_lri.recommendations if latest_lri else [],
        },
        "mou_readiness": {
            "mou_count": len(mous),
            "cluster_collaboration_readiness": "Structured collaboration evidence present"
            if mous
            else "No structured MOU evidence yet",
            "latest_mou_status": latest_mou.status if latest_mou else None,
            "latest_mou_id": latest_mou.id if latest_mou else None,
        },
        "grant_recommendations": {
            "total_matches": len(grant_matches),
            "top_matches": [
                {
                    "scheme_name": match.scheme.name,
                    "scheme_code": match.scheme.code,
                    "match_score": match.match_score,
                    "recommendation_status": match.recommendation_status,
                    "benefits_summary": match.scheme.benefits_summary,
                    "scheme_fit_explanation": match.match_reason,
                }
                for match in top_matches
            ],
        },
        "recommendations": recommendations,
        "summary": {
            "business_name": business.business_name,
            "lri_score": latest_lri.overall_score if latest_lri else None,
            "lri_band": latest_lri.band if latest_lri else None,
            "total_audit_findings": len(audit_findings),
            "high_severity_findings": _findings_by_severity(audit_findings)["HIGH"],
            "top_grant_match": top_matches[0].scheme.name if top_matches else None,
            "top_grant_match_score": top_matches[0].match_score if top_matches else None,
            "recommendation": recommendations[0]["message"]
            if recommendations
            else "Maintain documentation hygiene and periodically refresh readiness checks.",
            "disclaimer": BANKABILITY_REPORT_DISCLAIMER,
        },
    }


def _build_recommendations(
    *,
    documents: list[Document],
    audit_findings: list[AuditFinding],
    latest_lri: Any,
    mous: list[Any],
) -> list[dict[str, str]]:
    recommendations: list[dict[str, str]] = []
    text = " ".join(
        f"{finding.title} {finding.description} {finding.field_name or ''}"
        for finding in audit_findings
    ).lower()
    document_types = {document.document_type for document in documents}
    failed_document_types = {
        document.document_type for document in documents if document.status == "FAILED"
    }
    high_count = sum(1 for finding in audit_findings if finding.severity == "HIGH")

    if "pan" in text and "mismatch" in text:
        recommendations.append(
            {
                "priority": "HIGH",
                "message": "Resolve PAN mismatch before applying for formal credit.",
            },
        )
    if "BANK_STATEMENT" in failed_document_types:
        recommendations.append(
            {
                "priority": "HIGH",
                "message": "Re-run extraction for failed bank statement.",
            },
        )
    if not mous:
        recommendations.append(
            {
                "priority": "MEDIUM",
                "message": "Improve collaboration readiness with at least one structured MOU.",
            },
        )
    if high_count > 0:
        recommendations.append(
            {
                "priority": "HIGH",
                "message": "Address unresolved HIGH severity audit findings before applying for credit.",
            },
        )

    missing_documents = [
        label
        for document_type, label in {
            "GST_CERTIFICATE": "GST certificate",
            "UDYAM_CERTIFICATE": "Udyam certificate",
            "PAN_CARD": "PAN card",
            "BANK_STATEMENT": "bank statement",
            "ITR_ACKNOWLEDGEMENT": "ITR acknowledgement",
        }.items()
        if document_type not in document_types
    ]
    if missing_documents:
        recommendations.append(
            {
                "priority": "MEDIUM",
                "message": "Upload missing docs: " + ", ".join(missing_documents) + ".",
            },
        )
    if latest_lri is None:
        recommendations.append(
            {
                "priority": "MEDIUM",
                "message": "Calculate LRI to add a readiness score and band to the report.",
            },
        )
    elif latest_lri.financial_consistency_score < 70:
        recommendations.append(
            {
                "priority": "MEDIUM",
                "message": "Improve financial consistency by resolving document and profile mismatches.",
            },
        )

    return _dedupe_recommendations(recommendations)


def _document_summary(document: Document) -> dict[str, Any]:
    payload = _extract_payload(document)
    return {
        "id": document.id,
        "document_type": document.document_type,
        "status": document.status,
        "original_filename": document.original_filename,
        "uploaded_at": document.uploaded_at.isoformat()
        if document.uploaded_at
        else None,
        "processed_at": document.processed_at.isoformat()
        if document.processed_at
        else None,
        "confidence_score": _confidence_score(document),
        "extracted_field_count": len(_extracted_fields(payload)),
    }


def _finding_summary(finding: AuditFinding) -> dict[str, Any]:
    return {
        "id": finding.id,
        "severity": finding.severity,
        "title": finding.title,
        "description": finding.description,
        "recommendation": finding.recommendation,
        "finding_type": finding.finding_type,
        "document_id": finding.document_id,
    }


def _build_executive_summary(
    *,
    business_name: str,
    lri_score: float | None,
    lri_band: str | None,
    high_findings: int,
    document_count: int,
    grant_count: int,
) -> str:
    score_text = (
        f"LRI score is {lri_score:g} with a {lri_band} band"
        if lri_score is not None and lri_band
        else "LRI score is not calculated"
    )
    return (
        f"{business_name} has {document_count} uploaded document records. "
        f"{score_text}. The current audit view shows {high_findings} unresolved "
        f"HIGH severity findings, and Grant Scout has {grant_count} stored scheme "
        "matches. This is an AI-assisted MSME readiness and documentation summary."
    )


def _major_strengths(
    *,
    documents: list[Document],
    latest_lri: Any,
    mous: list[Any],
    grant_matches: list[Any],
) -> list[str]:
    strengths: list[str] = []
    if documents:
        strengths.append("Uploaded documentation is available for review.")
    if latest_lri and latest_lri.band == "GREEN":
        strengths.append("Latest LRI band is GREEN.")
    if mous:
        strengths.append("Structured MOU collaboration evidence exists.")
    if grant_matches:
        strengths.append("Grant Scout has stored scheme-fit recommendations.")
    return strengths or ["Initial business profile is available."]


def _major_risks(
    *,
    documents: list[Document],
    audit_findings: list[AuditFinding],
    latest_lri: Any,
) -> list[str]:
    risks: list[str] = []
    high_count = sum(1 for finding in audit_findings if finding.severity == "HIGH")
    if high_count:
        risks.append(f"{high_count} unresolved HIGH severity audit findings.")
    if any(document.status == "FAILED" for document in documents):
        risks.append("One or more document extractions have failed.")
    if latest_lri and latest_lri.band == "RED":
        risks.append("Latest LRI band is RED.")
    if not documents:
        risks.append("No uploaded documents are available.")
    return risks or ["No major readiness risks detected from stored records."]


def _confidence_overview(documents: list[Document]) -> dict[str, Any]:
    scores = [
        score
        for score in (_confidence_score(document) for document in documents)
        if score is not None
    ]
    if not scores:
        return {"average_confidence": None, "low_confidence_count": 0}
    return {
        "average_confidence": round(sum(scores) / len(scores), 2),
        "low_confidence_count": sum(1 for score in scores if score < 0.60),
    }


def _findings_by_severity(findings: list[AuditFinding]) -> dict[str, int]:
    counts = Counter(finding.severity for finding in findings)
    return {
        "HIGH": counts.get("HIGH", 0),
        "MEDIUM": counts.get("MEDIUM", 0),
        "LOW": counts.get("LOW", 0),
    }


def _confidence_score(document: Document) -> float | None:
    payload = _extract_payload(document)
    if payload is None:
        return _coerce_float(getattr(document, "confidence_score", None))
    return (
        _coerce_float(payload.get("confidence_score"))
        or _coerce_float(payload.get("confidence"))
        or _coerce_float(getattr(document, "confidence_score", None))
    )


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


def _extracted_fields(payload: dict[str, Any] | None) -> dict[str, Any]:
    if payload is None:
        return {}
    return (
        _as_mapping(payload.get("fields"))
        or _as_mapping(payload.get("extracted_fields"))
        or _as_mapping(payload.get("extracted_data"))
        or {}
    )


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


def _dedupe_recommendations(items: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: set[str] = set()
    result: list[dict[str, str]] = []
    priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    for item in sorted(items, key=lambda value: priority_order[value["priority"]]):
        if item["message"] in seen:
            continue
        seen.add(item["message"])
        result.append(item)
    return result


def _join_non_empty(values: list[Any]) -> str | None:
    text = ", ".join(str(value).strip() for value in values if _has_value(value))
    return text or None


def _has_value(value: Any) -> bool:
    return value is not None and str(value).strip() != ""


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None
