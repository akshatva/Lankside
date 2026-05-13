from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.crud.business import get_business
from app.crud.report import (
    create_report,
    delete_report,
    get_report,
    get_reports,
    update_report,
)
from app.db.session import get_db
from app.schemas.report import (
    ReportCreate,
    ReportGenerateResponse,
    ReportRead,
    ReportSummaryRead,
    ReportUpdate,
)
from app.services.report_aggregator import aggregate_bankability_report_data
from app.services.report_generator import generate_report_pdf

router = APIRouter(prefix="/reports")

ALLOWED_REPORT_STATUSES = {"GENERATING", "GENERATED", "FAILED"}


def _normalize_status(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    normalized = value.strip().upper()
    if normalized not in ALLOWED_REPORT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="status must be one of GENERATING, GENERATED, or FAILED.",
        )
    return normalized


def _get_existing_report(db: Session, report_id: int):
    report = get_report(db, report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    return report


@router.post("/{business_id}/generate", response_model=ReportGenerateResponse)
def generate_report(
    business_id: int,
    db: Session = Depends(get_db),
) -> ReportGenerateResponse:
    business = get_business(db, business_id)
    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )

    report = None
    try:
        report_data = aggregate_bankability_report_data(db, business_id)
        report = create_report(
            db,
            ReportCreate(
                business_id=business_id,
                status="GENERATING",
                summary=report_data,
                summary_text=report_data["executive_summary"]["summary_text"],
            ),
        )
        pdf_path = generate_report_pdf(report_data, report_id=report.id)
        return update_report(
            db,
            report,
            ReportUpdate(status="GENERATED", pdf_path=pdf_path),
        )
    except (RuntimeError, ValueError) as exc:
        if report is not None:
            update_report(db, report, ReportUpdate(status="FAILED"))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc


@router.get("", response_model=list[ReportSummaryRead])
def list_reports(
    business_id: Optional[int] = Query(default=None),
    status: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
) -> list[ReportSummaryRead]:
    return get_reports(
        db,
        business_id=business_id,
        status=_normalize_status(status),
    )


@router.get("/{report_id}", response_model=ReportRead)
def read_report(
    report_id: int,
    db: Session = Depends(get_db),
) -> ReportRead:
    return _get_existing_report(db, report_id)


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
) -> FileResponse:
    report = _get_existing_report(db, report_id)
    if not report.pdf_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No PDF has been generated for this report.",
        )

    file_path = Path(report.pdf_path).expanduser().resolve()
    report_root = Path(settings.report_output_dir).expanduser().resolve()
    if report_root not in (file_path, *file_path.parents) or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Generated report PDF not found.",
        )

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"bankability-report-{report.id}.pdf",
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_report(
    report_id: int,
    db: Session = Depends(get_db),
) -> None:
    report = _get_existing_report(db, report_id)
    _remove_report_pdf(report.pdf_path)
    delete_report(db, report)


def _remove_report_pdf(pdf_path: Optional[str]) -> None:
    if not pdf_path:
        return
    file_path = Path(pdf_path).expanduser().resolve()
    report_root = Path(settings.report_output_dir).expanduser().resolve()
    if report_root not in (file_path, *file_path.parents):
        return
    file_path.unlink(missing_ok=True)
