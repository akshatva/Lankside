from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.audit_finding import AuditFinding
from app.schemas.audit import AuditFindingCreate, AuditFindingUpdate


def create_audit_finding(
    db: Session,
    finding_in: AuditFindingCreate,
    *,
    commit: bool = True,
) -> AuditFinding:
    finding = AuditFinding(**finding_in.model_dump(), is_resolved=False)
    db.add(finding)
    if commit:
        db.commit()
        db.refresh(finding)
    return finding


def get_audit_finding(db: Session, finding_id: int) -> AuditFinding | None:
    return db.get(AuditFinding, finding_id)


def get_audit_findings(
    db: Session,
    *,
    business_id: int | None = None,
    severity: str | None = None,
    is_resolved: bool | None = None,
) -> list[AuditFinding]:
    query = db.query(AuditFinding)

    if business_id is not None:
        query = query.filter(AuditFinding.business_id == business_id)
    if severity is not None:
        query = query.filter(AuditFinding.severity == severity)
    if is_resolved is not None:
        query = query.filter(AuditFinding.is_resolved == is_resolved)

    return query.order_by(AuditFinding.created_at.desc()).all()


def delete_or_clear_findings_for_business(db: Session, business_id: int) -> int:
    deleted_count = (
        db.query(AuditFinding)
        .filter(
            AuditFinding.business_id == business_id,
            AuditFinding.is_resolved.is_(False),
        )
        .delete(synchronize_session=False)
    )
    db.commit()
    return int(deleted_count)


def resolve_audit_finding(
    db: Session,
    finding: AuditFinding,
    finding_in: AuditFindingUpdate | None = None,
) -> AuditFinding:
    finding.is_resolved = (
        finding_in.is_resolved
        if finding_in and finding_in.is_resolved is not None
        else True
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding


def delete_audit_finding(db: Session, finding: AuditFinding) -> None:
    db.delete(finding)
    db.commit()


def get_audit_summary(db: Session, business_id: int) -> dict[str, int]:
    findings = get_audit_findings(db, business_id=business_id, is_resolved=False)
    return {
        "business_id": business_id,
        "total_findings": len(findings),
        "high_count": sum(1 for finding in findings if finding.severity == "HIGH"),
        "medium_count": sum(
            1 for finding in findings if finding.severity == "MEDIUM"
        ),
        "low_count": sum(1 for finding in findings if finding.severity == "LOW"),
        "missing_documents_count": sum(
            1 for finding in findings if finding.finding_type == "MISSING_DOCUMENT"
        ),
    }
