import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.exc import SQLAlchemyError
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
logger = logging.getLogger(__name__)

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
    try:
        business = get_business(db, business_id)
    except SQLAlchemyError:
        db.rollback()
        logger.exception(
            "Report generation business lookup failed",
            extra={"business_id": business_id},
        )
        raise

    if business is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found.",
        )

    report = None
    report_id: Optional[int] = None
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
        report_id = report.id
        pdf_path = generate_report_pdf(report_data, report_id=report_id)
        return update_report(
            db,
            report,
            ReportUpdate(status="GENERATED", pdf_path=pdf_path),
        )
    except ValueError as exc:
        db.rollback()
        if report_id is not None:
            _mark_report_failed(db, report_id, business_id)
        logger.warning(
            "Report generation rejected",
            extra={"business_id": business_id, "report_id": report_id},
            exc_info=exc,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to generate report from the current business data.",
        ) from exc
    except SQLAlchemyError:
        db.rollback()
        logger.exception(
            "Report generation database operation failed",
            extra={"business_id": business_id, "report_id": report_id},
        )
        raise
    except (OSError, RuntimeError) as exc:
        db.rollback()
        if report_id is not None:
            _mark_report_failed(db, report_id, business_id)
        logger.exception(
            "Report PDF generation failed",
            extra={"business_id": business_id, "report_id": report_id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate report PDF. Please try again.",
        ) from exc
    except Exception as exc:
        db.rollback()
        if report_id is not None:
            _mark_report_failed(db, report_id, business_id)
        logger.exception(
            "Unexpected report generation failure",
            extra={"business_id": business_id, "report_id": report_id},
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to generate report. Please try again.",
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


def _mark_report_failed(db: Session, report_id: int, business_id: int) -> None:
    try:
        failed_report = get_report(db, report_id)
        if failed_report is not None:
            update_report(db, failed_report, ReportUpdate(status="FAILED"))
    except SQLAlchemyError:
        db.rollback()
        logger.exception(
            "Failed to mark report as FAILED",
            extra={"business_id": business_id, "report_id": report_id},
        )
