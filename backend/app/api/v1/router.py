from fastapi import APIRouter

from app.api.v1.endpoints import (
    admin,
    audit,
    businesses,
    documents,
    extractions,
    grants,
    health,
    lri,
    mous,
    reports,
    status,
)

api_router = APIRouter()
api_router.include_router(admin.router, tags=["admin"])
api_router.include_router(health.router, tags=["health"])
api_router.include_router(status.router, tags=["status"])
api_router.include_router(businesses.router, tags=["businesses"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(extractions.router, tags=["extractions"])
api_router.include_router(audit.router, tags=["audit"])
api_router.include_router(lri.router, tags=["lri"])
api_router.include_router(mous.router, tags=["mous"])
api_router.include_router(grants.router, tags=["grants"])
api_router.include_router(reports.router, tags=["reports"])
