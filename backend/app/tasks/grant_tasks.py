from __future__ import annotations

import logging

from app.db.session import SessionLocal
from app.services.grant_matcher import run_grant_matching
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="lankside.grants.match")
def run_grant_matching_task(business_id: str) -> dict[str, int | str]:
    db = SessionLocal()
    try:
        parsed_business_id = int(business_id)
        logger.info(
            "Starting Grant Scout matching for business_id=%s",
            parsed_business_id,
        )
        result = run_grant_matching(db, parsed_business_id)
        logger.info(
            "Completed Grant Scout matching for business_id=%s matches=%s",
            parsed_business_id,
            result.total_matches,
        )
        return {
            "business_id": result.business_id,
            "total_matches": result.total_matches,
        }
    except Exception:
        logger.exception("Grant Scout matching failed for business_id=%s", business_id)
        raise
    finally:
        db.close()
