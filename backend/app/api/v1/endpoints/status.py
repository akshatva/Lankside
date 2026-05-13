from fastapi import APIRouter
from typing import Union

from app.core.config import settings

router = APIRouter()


@router.get("/status")
def status_check() -> dict[str, Union[bool, str]]:
    return {
        "api_status": "ok",
        "environment": settings.environment,
        "database_url_present": bool(settings.database_url),
        "redis_url_present": bool(settings.redis_url),
    }
