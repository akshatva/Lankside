from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.crud.report import create_report, update_report
from app.db.session import SessionLocal
from app.schemas.report import ReportCreate, ReportUpdate
from app.services.report_aggregator import aggregate_bankability_report_data
from app.services.report_generator import generate_report_pdf
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="lankside.reports.generate_bankability_report")
def generate_bankability_report_task(business_id: int) -> dict[str, int | str]:
    db = SessionLocal()
    report = None
    try:
        logger.info("Starting Bankability Report generation business_id=%s", business_id)
        report_data = aggregate_bankability_report_data(db, business_id)
        report = create_report(
            db,
            ReportCreate(
                business_id=business_id,
                status="GENERATING",
                summary=report_data["summary"],
                summary_text=report_data["executive_summary"]["summary_text"],
            ),
        )
        pdf_path = generate_report_pdf(report_data, report_id=report.id)
        report = update_report(
            db,
            report,
            ReportUpdate(
                status="GENERATED",
                pdf_path=pdf_path,
                generated_at=datetime.now(timezone.utc),
            ),
        )
        logger.info("Completed Bankability Report generation report_id=%s", report.id)
        return {"report_id": report.id, "status": report.status}
    except Exception:
        if report is not None:
            update_report(db, report, ReportUpdate(status="FAILED"))
        logger.exception("Bankability Report generation task failed.")
        raise
    finally:
        db.close()
