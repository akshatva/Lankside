from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.crud.audit_finding import (
    delete_audit_finding,
    get_audit_finding,
    get_audit_findings,
    resolve_audit_finding,
)
from app.crud.business import get_business
from app.db.session import get_db
from app.schemas.audit import AuditFindingRead, AuditRunResponse
from app.services.audit_engine import run_compliance_audit

router = APIRouter(prefix="/audit")

ALLOWED_SEVERITIES = {"HIGH", "MEDIUM", "LOW"}


def _normalize_severity(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip().upper()
    if normalized not in ALLOWED_SEVERITIES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="severity must be one of HIGH, MEDIUM, or LOW.",
        )
    return normalized


@router.post("/{business_id}/run", response_model=AuditRunResponse)
def run_audit(
    business_id: int,
    db: Session = Depends(get_db),
) -> AuditRunResponse:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )
    return run_compliance_audit(db, business_id)


@router.get("", response_model=List[AuditFindingRead])
def list_audit_findings(
    business_id: Optional[int] = Query(default=None),
    severity: Optional[str] = Query(default=None),
    is_resolved: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
) -> List[AuditFindingRead]:
    return get_audit_findings(
        db,
        business_id=business_id,
        severity=_normalize_severity(severity),
        is_resolved=is_resolved,
    )


@router.get("/{finding_id}", response_model=AuditFindingRead)
def read_audit_finding(
    finding_id: int,
    db: Session = Depends(get_db),
) -> AuditFindingRead:
    finding = get_audit_finding(db, finding_id)
    if finding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit finding not found.",
        )
    return finding


@router.patch("/{finding_id}/resolve", response_model=AuditFindingRead)
def resolve_finding(
    finding_id: int,
    db: Session = Depends(get_db),
) -> AuditFindingRead:
    finding = get_audit_finding(db, finding_id)
    if finding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit finding not found.",
        )
    return resolve_audit_finding(db, finding)


@router.delete("/{finding_id}")
def remove_audit_finding(
    finding_id: int,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    finding = get_audit_finding(db, finding_id)
    if finding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit finding not found.",
        )
    delete_audit_finding(db, finding)
    return {"success": True}
