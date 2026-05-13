import logging

from app.db.session import SessionLocal
from app.services.audit_engine import run_compliance_audit
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="lankside.audit.run_audit")
def run_audit_task(business_id: str) -> dict[str, int]:
    db = SessionLocal()
    try:
        parsed_business_id = int(business_id)
        logger.info("Starting compliance audit for business_id=%s", parsed_business_id)
        summary = run_compliance_audit(db, parsed_business_id)
        logger.info(
            "Completed compliance audit for business_id=%s findings=%s",
            parsed_business_id,
            summary.total_findings,
        )
        return {
            "business_id": summary.business_id,
            "total_findings": summary.total_findings,
            "high_count": summary.high_count,
            "medium_count": summary.medium_count,
            "low_count": summary.low_count,
            "missing_documents_count": summary.missing_documents_count,
        }
    except Exception:
        logger.exception("Compliance audit failed for business_id=%s", business_id)
        raise
    finally:
        db.close()
