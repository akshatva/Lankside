from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.report import BankabilityReport
from app.schemas.report import ReportCreate, ReportUpdate


def create_report(db: Session, report_in: ReportCreate) -> BankabilityReport:
    report = BankabilityReport(**report_in.model_dump())
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_report(db: Session, report_id: int) -> BankabilityReport | None:
    return db.get(BankabilityReport, report_id)


def get_reports(
    db: Session,
    *,
    business_id: int | None = None,
    status: str | None = None,
) -> list[BankabilityReport]:
    query = db.query(BankabilityReport)

    if business_id is not None:
        query = query.filter(BankabilityReport.business_id == business_id)
    if status is not None:
        query = query.filter(BankabilityReport.status == status)

    return (
        query.order_by(
            BankabilityReport.created_at.desc(),
            BankabilityReport.id.desc(),
        )
        .all()
    )


def update_report(
    db: Session,
    report: BankabilityReport,
    report_in: ReportUpdate,
) -> BankabilityReport:
    update_data = report_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    if report.status == "GENERATED" and report.generated_at is None:
        report.generated_at = datetime.now(timezone.utc)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def delete_report(db: Session, report: BankabilityReport) -> None:
    db.delete(report)
    db.commit()


def update_report_status(
    db: Session,
    report: BankabilityReport,
    status: str,
) -> BankabilityReport:
    report.status = status
    if status == "GENERATED":
        report.generated_at = datetime.now(timezone.utc)
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def update_report_pdf_path(
    db: Session,
    report: BankabilityReport,
    pdf_path: str,
) -> BankabilityReport:
    report.pdf_path = pdf_path
    db.add(report)
    db.commit()
    db.refresh(report)
    return report
