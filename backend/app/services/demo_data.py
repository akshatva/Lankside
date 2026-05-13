from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy.orm import Session

from app.crud.audit_finding import create_audit_finding
from app.models.audit_finding import AuditFinding
from app.models.business import Business
from app.models.document import Document
from app.models.lri_score import LRIScore
from app.models.mou import MOU
from app.models.report import BankabilityReport
from app.models.scheme import SchemeMatch
from app.models.user import User
from app.schemas.admin import DemoResetResponse, DemoSeedResponse, DemoSummary
from app.schemas.audit import AuditFindingCreate
from app.services.demo_documents import build_demo_pdf, remove_demo_uploads
from app.services.grant_matcher import run_grant_matching
from app.services.lri_engine import calculate_lri_for_business
from app.services.scheme_seed_data import seed_mvp_schemes

DEMO_USER_EMAIL = "demo@lankside.local"
DEMO_USER_NAME = "Demo User"
DEMO_BUSINESS_NAMES = (
    "Sharma Medical Distributors",
    "Kaveri Textiles",
    "GreenPack Industries",
)


@dataclass(frozen=True)
class DemoBusinessSpec:
    slug: str
    business_name: str
    owner_name: str
    pan: str | None
    gstin: str | None
    udyam_id: str | None
    industry_type: str
    state: str
    city: str
    business_age_years: int | None
    turnover_range: str | None
    scenario: str
    documents: dict[str, str]
    audit_findings: list[dict[str, str | None]]
    mou: dict[str, Any] | None = None


DEMO_BUSINESSES = (
    DemoBusinessSpec(
        slug="sharma_medical",
        business_name="Sharma Medical Distributors",
        owner_name="Demo Owner A",
        pan="DEMOA1234A",
        gstin="09DEMOA1234A1Z5",
        udyam_id="UDYAM-UP-00-0000001",
        industry_type="Medical Stockist",
        state="Uttar Pradesh",
        city="Raebareli",
        business_age_years=6,
        turnover_range="Small",
        scenario="Mostly ready with one minor profile consistency issue.",
        documents={
            "GST_CERTIFICATE": "COMPLETED",
            "UDYAM_CERTIFICATE": "COMPLETED",
            "PAN_CARD": "COMPLETED",
            "BANK_STATEMENT": "COMPLETED",
            "ITR_ACKNOWLEDGEMENT": "COMPLETED",
        },
        audit_findings=[
            {
                "finding_type": "PROFILE_DOCUMENT_MISMATCH",
                "severity": "LOW",
                "title": "Minor owner name abbreviation mismatch",
                "description": "Demo Udyam extraction uses an abbreviated owner name.",
                "recommendation": "Review owner name spelling before lender submission.",
                "field_name": "owner_name",
                "expected_value": "Demo Owner A",
                "actual_value": "D Owner A",
            },
        ],
    ),
    DemoBusinessSpec(
        slug="kaveri_textiles",
        business_name="Kaveri Textiles",
        owner_name="Demo Owner B",
        pan="DEMOB1234B",
        gstin="33DEMOB1234B1Z6",
        udyam_id="UDYAM-TN-00-0000002",
        industry_type="Textile Manufacturing",
        state="Tamil Nadu",
        city="Chennai",
        business_age_years=4,
        turnover_range="Small",
        scenario="Cluster and MOU-ready textile manufacturer with strong scheme fit.",
        documents={
            "GST_CERTIFICATE": "COMPLETED",
            "UDYAM_CERTIFICATE": "COMPLETED",
            "PAN_CARD": "COMPLETED",
            "BANK_STATEMENT": "COMPLETED",
            "ITR_ACKNOWLEDGEMENT": "COMPLETED",
        },
        audit_findings=[],
        mou={
            "party_a_name": "Kaveri Textiles",
            "party_b_name": "Demo Textile Cluster Association",
            "purpose": "Joint dyeing, finishing, and shared quality infrastructure.",
            "duration_months": 24,
            "contribution_details": "Shared facility usage, training, and quality systems.",
            "revenue_sharing": "Members bear costs based on facility utilization.",
            "dispute_resolution": "Good-faith discussion followed by Chennai mediation.",
            "cluster_purpose": "Textile cluster development and common facility readiness.",
        },
    ),
    DemoBusinessSpec(
        slug="greenpack_industries",
        business_name="GreenPack Industries",
        owner_name="Demo Owner C",
        pan=None,
        gstin="27DEMOC1234C1Z7",
        udyam_id="UDYAM-MH-00-0000003",
        industry_type="Packaging Manufacturing",
        state="Maharashtra",
        city="Pune",
        business_age_years=None,
        turnover_range=None,
        scenario="Incomplete documents and failed extraction for lower readiness demo.",
        documents={
            "GST_CERTIFICATE": "COMPLETED",
            "UDYAM_CERTIFICATE": "COMPLETED",
            "BANK_STATEMENT": "FAILED",
        },
        audit_findings=[
            {
                "finding_type": "MISSING_DOCUMENT",
                "severity": "HIGH",
                "title": "PAN card missing",
                "description": "Demo business has no PAN document uploaded.",
                "recommendation": "Upload a fake demo PAN card before rerunning readiness checks.",
                "field_name": "document_type",
                "expected_value": "PAN_CARD",
                "actual_value": None,
            },
            {
                "finding_type": "MISSING_DOCUMENT",
                "severity": "MEDIUM",
                "title": "ITR acknowledgement missing",
                "description": "Demo business has no ITR acknowledgement uploaded.",
                "recommendation": "Upload a fake demo ITR acknowledgement.",
                "field_name": "document_type",
                "expected_value": "ITR_ACKNOWLEDGEMENT",
                "actual_value": None,
            },
            {
                "finding_type": "CROSS_DOCUMENT_MISMATCH",
                "severity": "MEDIUM",
                "title": "Bank account holder does not match profile",
                "description": "Demo bank statement holder differs from business name.",
                "recommendation": "Use a bank statement for the demo business entity.",
                "field_name": "account_holder_name",
                "expected_value": "GreenPack Industries",
                "actual_value": "Demo Packaging Vendor",
            },
            {
                "finding_type": "EXTRACTION_QUALITY",
                "severity": "HIGH",
                "title": "Bank statement extraction failed",
                "description": "Demo bank statement is intentionally marked failed.",
                "recommendation": "Re-run extraction with a clearer demo bank statement.",
                "field_name": "status",
                "expected_value": "COMPLETED",
                "actual_value": "FAILED",
            },
        ],
    ),
)


def seed_demo_data(db: Session) -> DemoSeedResponse:
    user, user_created = _get_or_create_demo_user(db)
    created = {"users": int(user_created), "businesses": 0, "documents": 0}
    updated = {"users": int(not user_created), "businesses": 0, "documents": 0}

    businesses: list[Business] = []
    for spec in DEMO_BUSINESSES:
        business, was_created = _create_or_update_business(db, user, spec)
        businesses.append(business)
        created["businesses"] += int(was_created)
        updated["businesses"] += int(not was_created)
        _clear_demo_child_records(db, business.id)
        created["documents"] += _seed_documents(db, business, spec)
        _seed_audit_findings(db, business, spec)
        _seed_mou(db, business, spec)

    db.commit()
    seed_mvp_schemes(db)
    for business in businesses:
        calculate_lri_for_business(db, business.id)
        run_grant_matching(db, business.id)
        _seed_report(db, business)

    return DemoSeedResponse(
        success=True,
        message="Demo data seeded with fake IDs and dummy documents only.",
        created=created,
        updated=updated,
        summary=get_demo_summary(db),
    )


def reset_demo_data(db: Session) -> DemoResetResponse:
    user = _get_demo_user(db)
    deleted_files = remove_demo_uploads()
    if user is None:
        return DemoResetResponse(
            success=True,
            message="No demo user found. No database records were deleted.",
            deleted={"users": 0, "businesses": 0, "demo_files": deleted_files},
            summary=get_demo_summary(db),
        )

    demo_businesses = [
        business
        for business in user.businesses
        if business.business_name in DEMO_BUSINESS_NAMES
    ]
    business_count = len(demo_businesses)
    for business in demo_businesses:
        db.delete(business)
    db.flush()
    user_deleted = 0
    if not user.businesses:
        db.delete(user)
        user_deleted = 1
    db.commit()
    return DemoResetResponse(
        success=True,
        message="Deleted known Phase 13 demo business records only.",
        deleted={
            "users": user_deleted,
            "businesses": business_count,
            "demo_files": deleted_files,
        },
        summary=get_demo_summary(db),
    )


def get_demo_summary(db: Session) -> DemoSummary:
    business_ids = _demo_business_ids(db)
    if not business_ids:
        return DemoSummary(
            demo_businesses=0,
            documents=0,
            extractions=0,
            audit_findings=0,
            lri_scores=0,
            mous=0,
            scheme_matches=0,
            reports=0,
        )

    documents = _count_for(db, Document, business_ids)
    extractions = (
        db.query(Document)
        .filter(
            Document.business_id.in_(business_ids),
            Document.status == "COMPLETED",
        )
        .count()
    )
    return DemoSummary(
        demo_businesses=len(business_ids),
        documents=documents,
        extractions=extractions,
        audit_findings=_count_for(db, AuditFinding, business_ids),
        lri_scores=_count_for(db, LRIScore, business_ids),
        mous=_count_for(db, MOU, business_ids),
        scheme_matches=_count_for(db, SchemeMatch, business_ids),
        reports=_count_for(db, BankabilityReport, business_ids),
    )


def _get_demo_user(db: Session) -> User | None:
    return db.query(User).filter(User.email == DEMO_USER_EMAIL).first()


def _get_or_create_demo_user(db: Session) -> tuple[User, bool]:
    user = _get_demo_user(db)
    if user is not None:
        user.full_name = DEMO_USER_NAME
        db.add(user)
        db.commit()
        db.refresh(user)
        return user, False

    user = User(email=DEMO_USER_EMAIL, full_name=DEMO_USER_NAME)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True


def _create_or_update_business(
    db: Session,
    user: User,
    spec: DemoBusinessSpec,
) -> tuple[Business, bool]:
    business = (
        db.query(Business)
        .filter(
            Business.user_id == user.id,
            Business.business_name == spec.business_name,
        )
        .first()
    )
    created = business is None
    if business is None:
        business = Business(user_id=user.id, business_name=spec.business_name)

    business.owner_name = spec.owner_name
    business.pan = spec.pan
    business.gstin = spec.gstin
    business.udyam_id = spec.udyam_id
    business.industry_type = spec.industry_type
    business.state = spec.state
    business.city = spec.city
    business.business_age_years = spec.business_age_years
    business.turnover_range = spec.turnover_range
    db.add(business)
    db.commit()
    db.refresh(business)
    return business, created


def _clear_demo_child_records(db: Session, business_id: int) -> None:
    for model in (
        BankabilityReport,
        SchemeMatch,
        LRIScore,
        AuditFinding,
        MOU,
        Document,
    ):
        db.query(model).filter(model.business_id == business_id).delete(
            synchronize_session=False,
        )
    db.commit()


def _seed_documents(
    db: Session,
    business: Business,
    spec: DemoBusinessSpec,
) -> int:
    count = 0
    for document_type, status in spec.documents.items():
        stored_filename, file_path, file_size_bytes = build_demo_pdf(
            business_slug=spec.slug,
            document_type=document_type,
            title=f"Demo {document_type.replace('_', ' ').title()}",
            lines=_document_lines(spec, document_type, status),
        )
        document = Document(
            business_id=business.id,
            document_type=document_type,
            status=status,
            original_filename=stored_filename,
            stored_filename=stored_filename,
            file_path=file_path,
            mime_type="application/pdf",
            file_size_bytes=file_size_bytes,
        )
        db.add(document)
        count += 1
    db.commit()
    return count


def _seed_audit_findings(
    db: Session,
    business: Business,
    spec: DemoBusinessSpec,
) -> None:
    for finding in spec.audit_findings:
        create_audit_finding(
            db,
            AuditFindingCreate(
                business_id=business.id,
                document_id=None,
                finding_type=str(finding["finding_type"]),
                severity=finding["severity"],  # type: ignore[arg-type]
                title=str(finding["title"]),
                description=str(finding["description"]),
                recommendation=str(finding["recommendation"]),
                field_name=finding.get("field_name"),
                expected_value=finding.get("expected_value"),
                actual_value=finding.get("actual_value"),
            ),
            commit=False,
        )
    db.commit()


def _seed_mou(db: Session, business: Business, spec: DemoBusinessSpec) -> None:
    if spec.mou is None:
        return
    draft_text = (
        "Demo collaboration MOU for textile cluster readiness.\n\n"
        "This deterministic demo draft is not legal certification and should be "
        "reviewed by a qualified legal professional before signing."
    )
    db.add(
        MOU(
            business_id=business.id,
            draft_text=draft_text,
            status="GENERATED",
            **spec.mou,
        ),
    )
    db.commit()


def _seed_report(db: Session, business: Business) -> None:
    latest_lri = (
        db.query(LRIScore)
        .filter(LRIScore.business_id == business.id)
        .order_by(LRIScore.created_at.desc(), LRIScore.id.desc())
        .first()
    )
    top_match = (
        db.query(SchemeMatch)
        .filter(SchemeMatch.business_id == business.id)
        .order_by(SchemeMatch.match_score.desc(), SchemeMatch.id.asc())
        .first()
    )
    high_findings = (
        db.query(AuditFinding)
        .filter(
            AuditFinding.business_id == business.id,
            AuditFinding.severity == "HIGH",
            AuditFinding.is_resolved.is_(False),
        )
        .count()
    )
    total_findings = (
        db.query(AuditFinding)
        .filter(AuditFinding.business_id == business.id)
        .count()
    )
    summary = {
        "business_name": business.business_name,
        "lri_score": latest_lri.overall_score if latest_lri else None,
        "lri_band": latest_lri.band if latest_lri else None,
        "total_audit_findings": total_findings,
        "high_severity_findings": high_findings,
        "top_grant_match": top_match.scheme.name if top_match else None,
        "top_grant_match_score": top_match.match_score if top_match else None,
        "recommendation": "Demo report summary for internal walkthrough only.",
        "disclaimer": (
            "The Bankability Report is informational and not a formal credit "
            "score, legal certification, loan approval, or government approval."
        ),
    }
    db.add(
        BankabilityReport(
            business_id=business.id,
            report_type="BANKABILITY",
            status="GENERATED",
            summary=summary,
            summary_text=(
                f"Demo Bankability Report for {business.business_name}. "
                "Generated from fake demo records only."
            ),
            pdf_path=None,
        ),
    )
    db.commit()


def _document_lines(
    spec: DemoBusinessSpec,
    document_type: str,
    status: str,
) -> list[str]:
    return [
        "DEMO DOCUMENT ONLY - NOT A REAL GOVERNMENT, BANK, TAX, OR ID RECORD.",
        f"Business: {spec.business_name}",
        f"Owner: {spec.owner_name}",
        f"PAN: {spec.pan or 'DEMO PAN MISSING'}",
        f"GSTIN: {spec.gstin or 'DEMO GSTIN MISSING'}",
        f"Udyam: {spec.udyam_id or 'DEMO UDYAM MISSING'}",
        f"Industry: {spec.industry_type}",
        f"Location: {spec.city}, {spec.state}",
        f"Document type: {document_type}",
        f"Demo extraction status: {status}",
        f"Scenario: {spec.scenario}",
    ]


def _demo_business_ids(db: Session) -> list[int]:
    user = _get_demo_user(db)
    if user is None:
        return []
    return [
        business.id
        for business in user.businesses
        if business.business_name in DEMO_BUSINESS_NAMES
    ]


def _count_for(db: Session, model: type[Any], business_ids: list[int]) -> int:
    return int(
        db.query(model)
        .filter(model.business_id.in_(business_ids))
        .count(),
    )
