from __future__ import annotations

from collections.abc import Callable, Iterable
from typing import Any, cast

from sqlalchemy.orm import Session

from app.crud.audit_finding import (
    create_audit_finding,
    delete_or_clear_findings_for_business,
)
from app.crud.business import get_business
from app.crud.document import get_documents
from app.models.business import Business
from app.models.document import Document
from app.schemas.audit import AuditFindingCreate, AuditRunResponse, AuditSeverity
from app.services.normalization import (
    normalize_gstin,
    normalize_name,
    normalize_pan,
    normalize_text,
    normalize_udyam_id,
    simple_similarity,
)

MANDATORY_DOCUMENTS = {
    "GST_CERTIFICATE": "GST certificate",
    "UDYAM_CERTIFICATE": "Udyam certificate",
    "PAN_CARD": "PAN card",
    "BANK_STATEMENT": "Bank statement",
    "ITR_ACKNOWLEDGEMENT": "ITR acknowledgement",
}

MISSING_DOCUMENT_SEVERITY: dict[str, AuditSeverity] = {
    "GST_CERTIFICATE": "HIGH",
    "UDYAM_CERTIFICATE": "HIGH",
    "PAN_CARD": "HIGH",
    "BANK_STATEMENT": "MEDIUM",
    "ITR_ACKNOWLEDGEMENT": "MEDIUM",
}

LOW_CONFIDENCE_THRESHOLD = 0.60
NAME_MATCH_THRESHOLD = 0.82
Normalizer = Callable[[Any], str]


def run_compliance_audit(db: Session, business_id: int) -> AuditRunResponse:
    business = get_business(db, business_id)
    if business is None:
        raise ValueError("Business profile not found.")

    delete_or_clear_findings_for_business(db, business_id)
    documents = get_documents(db, business_id=business_id)
    documents_by_type = _latest_documents_by_type(documents)
    finding_inputs: list[AuditFindingCreate] = []

    _check_missing_documents(business, documents_by_type, finding_inputs)
    _check_extraction_quality(business, documents_by_type, finding_inputs)
    _check_business_profile_documents(business, documents_by_type, finding_inputs)
    _check_cross_documents(business, documents_by_type, finding_inputs)

    generated_findings = [
        create_audit_finding(db, finding_in, commit=False)
        for finding_in in finding_inputs
    ]
    db.commit()
    for finding in generated_findings:
        db.refresh(finding)

    return AuditRunResponse(
        business_id=business.id,
        total_findings=len(generated_findings),
        high_count=sum(1 for item in generated_findings if item.severity == "HIGH"),
        medium_count=sum(
            1 for item in generated_findings if item.severity == "MEDIUM"
        ),
        low_count=sum(1 for item in generated_findings if item.severity == "LOW"),
        missing_documents_count=sum(
            1 for item in generated_findings if item.finding_type == "MISSING_DOCUMENT"
        ),
        generated_findings=generated_findings,
    )


def _latest_documents_by_type(documents: Iterable[Document]) -> dict[str, Document]:
    latest_documents: dict[str, Document] = {}
    for document in documents:
        if document.document_type not in latest_documents:
            latest_documents[document.document_type] = document
    return latest_documents


def _check_missing_documents(
    business: Business,
    documents_by_type: dict[str, Document],
    findings: list[AuditFindingCreate],
) -> None:
    for document_type, label in MANDATORY_DOCUMENTS.items():
        if document_type not in documents_by_type:
            findings.append(
                _finding(
                    business,
                    finding_type="MISSING_DOCUMENT",
                    severity=MISSING_DOCUMENT_SEVERITY[document_type],
                    title=f"{label.title()} missing",
                    description=f"The mandatory {label} is not uploaded for this business profile.",
                    recommendation=f"Upload the latest {label} before lender or scheme submission.",
                    field_name="document_type",
                    expected_value=document_type,
                ),
            )


def _check_extraction_quality(
    business: Business,
    documents_by_type: dict[str, Document],
    findings: list[AuditFindingCreate],
) -> None:
    for document_type, label in MANDATORY_DOCUMENTS.items():
        document = documents_by_type.get(document_type)
        if document is None:
            continue
        if document.status == "FAILED":
            findings.append(
                _finding(
                    business,
                    document=document,
                    finding_type="EXTRACTION_QUALITY",
                    severity="HIGH",
                    title="Extraction failed",
                    description=f"The {label} has failed extraction status.",
                    recommendation="Re-upload a clearer copy or retry extraction before audit submission.",
                    field_name="status",
                    expected_value="COMPLETED",
                    actual_value=document.status,
                ),
            )
            continue
        context = _get_extraction_context(document)
        if context["fields"] is None:
            findings.append(
                _finding(
                    business,
                    document=document,
                    finding_type="EXTRACTION_QUALITY",
                    severity="MEDIUM",
                    title="Extraction result missing",
                    description=f"The {label} does not have extracted fields available for comparison.",
                    recommendation="Run document extraction before running the compliance audit again.",
                    field_name="extraction_result",
                    expected_value="available",
                    actual_value="missing",
                ),
            )
            continue
        confidence_score = context["confidence_score"]
        if confidence_score is not None and confidence_score < LOW_CONFIDENCE_THRESHOLD:
            findings.append(
                _finding(
                    business,
                    document=document,
                    finding_type="EXTRACTION_QUALITY",
                    severity="MEDIUM",
                    title="Low extraction confidence",
                    description=f"The {label} extraction confidence is below 0.60.",
                    recommendation="Review extracted fields manually or upload a clearer document.",
                    field_name="confidence_score",
                    expected_value=">= 0.60",
                    actual_value=str(confidence_score),
                ),
            )


def _check_business_profile_documents(
    business: Business,
    documents_by_type: dict[str, Document],
    findings: list[AuditFindingCreate],
) -> None:
    gst_document = documents_by_type.get("GST_CERTIFICATE")
    gst_fields = _fields_for(gst_document)
    if gst_document and gst_fields:
        legal_name = _field(gst_fields, "legal_name", "business_legal_name")
        trade_name = _field(gst_fields, "trade_name", "business_trade_name")
        if business.business_name and not _matches_any_name(
            business.business_name,
            [legal_name, trade_name],
        ):
            findings.append(
                _finding(
                    business,
                    document=gst_document,
                    finding_type="PROFILE_DOCUMENT_MISMATCH",
                    severity="MEDIUM",
                    title="Business name does not match GST certificate",
                    description="The business profile name does not match GST legal name or trade name.",
                    recommendation="Update the business profile or verify the uploaded GST certificate.",
                    field_name="business_name",
                    expected_value=business.business_name,
                    actual_value=_join_values([legal_name, trade_name]),
                ),
            )
        _compare_exact_field(
            business,
            gst_document,
            findings,
            field_name="gstin",
            expected_value=business.gstin,
            actual_value=_field(gst_fields, "gstin", "gst_number"),
            normalizer=normalize_gstin,
            severity="HIGH",
            title="GSTIN mismatch",
            description="The business profile GSTIN does not match the GST certificate.",
            recommendation="Use the GSTIN printed on the valid GST certificate or upload the correct certificate.",
        )

    udyam_document = documents_by_type.get("UDYAM_CERTIFICATE")
    udyam_fields = _fields_for(udyam_document)
    if udyam_document and udyam_fields:
        _compare_name_field(
            business,
            udyam_document,
            findings,
            field_name="business_name",
            expected_value=business.business_name,
            actual_value=_field(udyam_fields, "enterprise_name", "business_name"),
            severity="MEDIUM",
            title="Business name does not match Udyam certificate",
            description="The business profile name differs from the Udyam enterprise name.",
            recommendation="Confirm the correct MSME profile name and upload the right Udyam certificate.",
        )
        _compare_name_field(
            business,
            udyam_document,
            findings,
            field_name="owner_name",
            expected_value=business.owner_name,
            actual_value=_field(udyam_fields, "owner_name", "entrepreneur_name"),
            severity="MEDIUM",
            title="Owner name does not match Udyam certificate",
            description="The business owner name differs from the Udyam certificate owner name.",
            recommendation="Verify the owner/signatory information before submission.",
        )
        _compare_exact_field(
            business,
            udyam_document,
            findings,
            field_name="udyam_id",
            expected_value=business.udyam_id,
            actual_value=_field(udyam_fields, "udyam_number", "udyam_id"),
            normalizer=normalize_udyam_id,
            severity="MEDIUM",
            title="Udyam ID mismatch",
            description="The business profile Udyam ID does not match the Udyam certificate.",
            recommendation="Update the Udyam ID or upload the correct certificate.",
        )

    pan_document = documents_by_type.get("PAN_CARD")
    pan_fields = _fields_for(pan_document)
    if pan_document and pan_fields:
        _compare_exact_field(
            business,
            pan_document,
            findings,
            field_name="pan",
            expected_value=business.pan,
            actual_value=_field(pan_fields, "pan_number", "pan"),
            normalizer=normalize_pan,
            severity="HIGH",
            title="PAN mismatch",
            description="The business profile PAN does not match the PAN card.",
            recommendation="Correct the PAN in the profile or upload the matching PAN card.",
        )

    itr_document = documents_by_type.get("ITR_ACKNOWLEDGEMENT")
    itr_fields = _fields_for(itr_document)
    if itr_document and itr_fields:
        _compare_exact_field(
            business,
            itr_document,
            findings,
            field_name="pan",
            expected_value=business.pan,
            actual_value=_field(itr_fields, "pan", "pan_number"),
            normalizer=normalize_pan,
            severity="HIGH",
            title="PAN does not match ITR acknowledgement",
            description="The business profile PAN differs from the PAN extracted from the ITR acknowledgement.",
            recommendation="Use the correct PAN and ITR acknowledgement for this business.",
        )


def _check_cross_documents(
    business: Business,
    documents_by_type: dict[str, Document],
    findings: list[AuditFindingCreate],
) -> None:
    gst_document = documents_by_type.get("GST_CERTIFICATE")
    udyam_document = documents_by_type.get("UDYAM_CERTIFICATE")
    pan_document = documents_by_type.get("PAN_CARD")
    itr_document = documents_by_type.get("ITR_ACKNOWLEDGEMENT")
    bank_document = documents_by_type.get("BANK_STATEMENT")
    gst_fields = _fields_for(gst_document)
    udyam_fields = _fields_for(udyam_document)
    pan_fields = _fields_for(pan_document)
    itr_fields = _fields_for(itr_document)
    bank_fields = _fields_for(bank_document)

    if gst_document and udyam_document and gst_fields and udyam_fields:
        _compare_name_field(
            business,
            udyam_document,
            findings,
            field_name="legal_name",
            expected_value=_field(gst_fields, "legal_name", "business_legal_name"),
            actual_value=_field(udyam_fields, "enterprise_name", "business_name"),
            severity="MEDIUM",
            title="GST and Udyam business names differ",
            description="GST legal name does not match Udyam enterprise name.",
            recommendation="Verify both certificates belong to the same business entity.",
        )
    if pan_document and itr_document and pan_fields and itr_fields:
        _compare_exact_field(
            business,
            itr_document,
            findings,
            field_name="pan",
            expected_value=_field(pan_fields, "pan_number", "pan"),
            actual_value=_field(itr_fields, "pan", "pan_number"),
            normalizer=normalize_pan,
            severity="HIGH",
            title="PAN card and ITR PAN differ",
            description="The PAN extracted from the PAN card does not match the ITR acknowledgement.",
            recommendation="Upload documents for the same applicant or business PAN.",
        )
    if bank_document and bank_fields:
        account_holder = _field(bank_fields, "account_holder_name", "holder_name")
        if account_holder and not _matches_any_name(
            account_holder,
            [business.business_name, business.owner_name],
        ):
            findings.append(
                _finding(
                    business,
                    document=bank_document,
                    finding_type="CROSS_DOCUMENT_MISMATCH",
                    severity="MEDIUM",
                    title="Bank account holder does not match profile",
                    description="The bank account holder name does not match the business or owner name.",
                    recommendation="Upload the primary business bank statement or verify the account holder details.",
                    field_name="account_holder_name",
                    expected_value=_join_values(
                        [business.business_name, business.owner_name],
                    ),
                    actual_value=account_holder,
                ),
            )
    if udyam_document and udyam_fields:
        _compare_exact_field(
            business,
            udyam_document,
            findings,
            field_name="state",
            expected_value=business.state,
            actual_value=_field(udyam_fields, "state"),
            normalizer=normalize_text,
            severity="LOW",
            title="State differs from Udyam certificate",
            description="Business profile state differs from the Udyam certificate state.",
            recommendation="Review address details for consistency.",
        )
        _compare_exact_field(
            business,
            udyam_document,
            findings,
            field_name="city",
            expected_value=business.city,
            actual_value=_field(udyam_fields, "district", "city"),
            normalizer=normalize_text,
            severity="LOW",
            title="City or district differs from Udyam certificate",
            description="Business profile city differs from the Udyam certificate district/city.",
            recommendation="Review city and district values before submission.",
        )


def _compare_exact_field(
    business: Business,
    document: Document,
    findings: list[AuditFindingCreate],
    *,
    field_name: str,
    expected_value: Any,
    actual_value: Any,
    normalizer: Normalizer,
    severity: AuditSeverity,
    title: str,
    description: str,
    recommendation: str,
) -> None:
    expected = normalizer(expected_value)
    actual = normalizer(actual_value)
    if not expected:
        return
    if not actual:
        findings.append(
            _finding(
                business,
                document=document,
                finding_type="MISSING_EXTRACTED_FIELD",
                severity="LOW",
                title=f"{field_name.replace('_', ' ').title()} missing from extraction",
                description="An expected extracted field is missing from the document result.",
                recommendation="Review extraction output or upload a clearer document.",
                field_name=field_name,
                expected_value=str(expected_value),
            ),
        )
    elif expected != actual:
        findings.append(
            _finding(
                business,
                document=document,
                finding_type="PROFILE_DOCUMENT_MISMATCH",
                severity=severity,
                title=title,
                description=description,
                recommendation=recommendation,
                field_name=field_name,
                expected_value=str(expected_value),
                actual_value=str(actual_value),
            ),
        )


def _compare_name_field(
    business: Business,
    document: Document,
    findings: list[AuditFindingCreate],
    *,
    field_name: str,
    expected_value: Any,
    actual_value: Any,
    severity: AuditSeverity,
    title: str,
    description: str,
    recommendation: str,
) -> None:
    if not normalize_name(expected_value):
        return
    if not normalize_name(actual_value):
        findings.append(
            _finding(
                business,
                document=document,
                finding_type="MISSING_EXTRACTED_FIELD",
                severity="LOW",
                title=f"{field_name.replace('_', ' ').title()} missing from extraction",
                description="An expected extracted field is missing from the document result.",
                recommendation="Review extraction output or upload a clearer document.",
                field_name=field_name,
                expected_value=str(expected_value),
            ),
        )
    elif simple_similarity(expected_value, actual_value) < NAME_MATCH_THRESHOLD:
        findings.append(
            _finding(
                business,
                document=document,
                finding_type="PROFILE_DOCUMENT_MISMATCH",
                severity=severity,
                title=title,
                description=description,
                recommendation=recommendation,
                field_name=field_name,
                expected_value=str(expected_value),
                actual_value=str(actual_value),
            ),
        )


def _fields_for(document: Document | None) -> dict[str, Any] | None:
    if document is None:
        return None
    return _get_extraction_context(document)["fields"]


def _get_extraction_context(document: Document) -> dict[str, Any]:
    payload = _extract_payload(document)
    if payload is None:
        return {"fields": None, "confidence_score": None}
    fields = (
        _as_mapping(payload.get("fields"))
        or _as_mapping(payload.get("extracted_fields"))
        or _as_mapping(payload.get("extracted_data"))
        or _as_mapping(payload.get("result"))
        or payload
    )
    confidence_score = (
        _coerce_float(payload.get("confidence_score"))
        or _coerce_float(payload.get("confidence"))
        or _coerce_float(getattr(document, "confidence_score", None))
    )
    return {"fields": fields, "confidence_score": confidence_score}


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
        if related:
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
    if hasattr(value, "model_dump"):
        return value.model_dump()
    if hasattr(value, "__dict__"):
        return {
            key: item
            for key, item in vars(value).items()
            if not key.startswith("_") and key != "metadata"
        }
    return None


def _field(fields: dict[str, Any], *keys: str) -> Any:
    lookup = {
        normalize_text(key).replace(" ", "_"): value for key, value in fields.items()
    }
    for key in keys:
        normalized_key = normalize_text(key).replace(" ", "_")
        if normalized_key in lookup:
            return lookup[normalized_key]
    return None


def _matches_any_name(value: Any, candidates: Iterable[Any]) -> bool:
    return any(
        simple_similarity(value, candidate) >= NAME_MATCH_THRESHOLD
        for candidate in candidates
        if normalize_name(candidate)
    )


def _join_values(values: Iterable[Any]) -> str | None:
    present_values = [str(value) for value in values if value]
    return " / ".join(present_values) if present_values else None


def _coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _finding(
    business: Business,
    *,
    finding_type: str,
    severity: AuditSeverity,
    title: str,
    description: str,
    recommendation: str,
    document: Document | None = None,
    field_name: str | None = None,
    expected_value: str | None = None,
    actual_value: str | None = None,
) -> AuditFindingCreate:
    return AuditFindingCreate(
        business_id=business.id,
        document_id=document.id if document else None,
        finding_type=finding_type,
        severity=cast(AuditSeverity, severity),
        title=title,
        description=description,
        recommendation=recommendation,
        field_name=field_name,
        expected_value=expected_value,
        actual_value=actual_value,
    )
