from typing import Union

from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.session import engine

router = APIRouter()


@router.get("/status")
def status_check() -> dict[str, Union[bool, str]]:
    database_status = "ok"
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        database_status = "unavailable"

    return {
        "api_status": "ok",
        "environment": settings.environment,
        "database_url_present": bool(settings.database_url),
        "database_status": database_status,
        "redis_url_present": bool(settings.redis_url),
        "startup_migrations_enabled": settings.run_startup_migrations,
    }
