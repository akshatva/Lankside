import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.migrations import run_startup_migrations

SERVICE_NAME = "lankside-backend"

configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    run_startup_migrations()
    yield


app = FastAPI(
    title=settings.project_name,
    version="0.1",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_, exc: SQLAlchemyError) -> JSONResponse:
    logger.error(
        "Database operation failed",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=503,
        content={
            "detail": (
                "Database is unavailable or not migrated. Verify DATABASE_URL "
                "and ensure startup migrations have run."
            ),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception) -> JSONResponse:
    logger.error(
        "Unhandled backend error",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."},
    )


@app.get("/health")
def root_health_check() -> dict[str, str]:
    return {"status": "ok", "service": SERVICE_NAME}


app.include_router(api_router, prefix="/api/v1")
