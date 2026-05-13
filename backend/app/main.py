from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging

SERVICE_NAME = "lankside-backend"

configure_logging()

app = FastAPI(
    title=settings.project_name,
    version="0.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def root_health_check() -> dict[str, str]:
    return {"status": "ok", "service": SERVICE_NAME}


app.include_router(api_router, prefix="/api/v1")
