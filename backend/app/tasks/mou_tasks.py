from __future__ import annotations

import logging

from app.crud.mou import create_mou
from app.db.session import SessionLocal
from app.schemas.mou import MOUCreate, MOUGenerateRequest
from app.services.mou_generator import generate_mou_draft
from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="lankside.mou.generate_mou")
def generate_mou_task(mou_input: dict) -> dict[str, int | str]:
    db = SessionLocal()
    try:
        parsed_input = MOUGenerateRequest.model_validate(mou_input)
        logger.info(
            "Starting MOU generation for business_id=%s party_a=%s party_b=%s",
            parsed_input.business_id,
            parsed_input.party_a_name,
            parsed_input.party_b_name,
        )
        draft_text = generate_mou_draft(db, parsed_input)
        mou = create_mou(
            db,
            MOUCreate(
                **parsed_input.model_dump(),
                draft_text=draft_text,
                status="GENERATED",
            ),
        )
        logger.info("Completed MOU generation mou_id=%s", mou.id)
        return {"mou_id": mou.id, "status": mou.status}
    except Exception:
        logger.exception("MOU generation task failed.")
        raise
    finally:
        db.close()
