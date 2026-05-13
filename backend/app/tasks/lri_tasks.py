from __future__ import annotations

import logging

from app.db.session import SessionLocal
from app.services.lri_engine import calculate_lri_for_business
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="lankside.lri.calculate")
def calculate_lri_task(business_id: str) -> dict[str, float | int | str]:
    db = SessionLocal()
    try:
        parsed_business_id = int(business_id)
        logger.info("Starting LRI calculation for business_id=%s", parsed_business_id)
        score = calculate_lri_for_business(db, parsed_business_id)
        logger.info(
            "Completed LRI calculation for business_id=%s score_id=%s overall=%s",
            parsed_business_id,
            score.id,
            score.overall_score,
        )
        return {
            "id": score.id,
            "business_id": score.business_id,
            "overall_score": score.overall_score,
            "band": score.band,
        }
    except Exception:
        logger.exception("LRI calculation failed for business_id=%s", business_id)
        raise
    finally:
        db.close()
