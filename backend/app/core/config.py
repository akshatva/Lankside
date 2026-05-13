from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    project_name: str = Field(default="Lankside API", alias="PROJECT_NAME")
    version: str = "0.1.0"
    environment: str = Field(default="local", alias="ENVIRONMENT")
    database_url: Optional[str] = Field(
        default="postgresql://lankside:lankside_password@postgres:5432/lankside_db",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS_URL")
    celery_broker_url: str = Field(
        default="redis://redis:6379/0",
        alias="CELERY_BROKER_URL",
    )
    celery_result_backend: str = Field(
        default="redis://redis:6379/0",
        alias="CELERY_RESULT_BACKEND",
    )
    gemini_api_key: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-2.5-flash", alias="GEMINI_MODEL")
    extraction_use_ai: bool = Field(default=False, alias="EXTRACTION_USE_AI")
    pinecone_api_key: Optional[str] = Field(default=None, alias="PINECONE_API_KEY")
    pinecone_index_name: Optional[str] = Field(
        default="lankside-schemes",
        alias="PINECONE_INDEX_NAME",
    )
    pinecone_environment: Optional[str] = Field(
        default=None,
        alias="PINECONE_ENVIRONMENT",
    )
    grant_scout_use_vector: bool = Field(
        default=False,
        alias="GRANT_SCOUT_USE_VECTOR",
    )
    backend_cors_origins: str = Field(
        default="http://localhost:3000",
        alias="BACKEND_CORS_ORIGINS",
    )
    upload_dir: str = Field(default="/app/uploads", alias="UPLOAD_DIR")
    mou_pdf_dir: str = Field(default="/app/uploads/mous", alias="MOU_PDF_DIR")
    report_output_dir: str = Field(
        default="/app/uploads/reports",
        alias="REPORT_OUTPUT_DIR",
    )
    report_pdf_dir: str = Field(default="/app/uploads/reports", alias="REPORT_PDF_DIR")
    max_upload_size_mb: int = Field(default=10, alias="MAX_UPLOAD_SIZE_MB")
    admin_demo_enabled: bool = Field(default=True, alias="ADMIN_DEMO_ENABLED")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
