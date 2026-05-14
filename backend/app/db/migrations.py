from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine

BACKEND_ROOT = Path(__file__).resolve().parents[2]
MIGRATION_LOCK_ID = 202605120007


def run_startup_migrations() -> None:
    if settings.environment != "production":
        return

    alembic_config = Config(str(BACKEND_ROOT / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))

    with engine.begin() as connection:
        use_postgres_lock = engine.dialect.name == "postgresql"
        if use_postgres_lock:
            connection.execute(
                text("SELECT pg_advisory_lock(:lock_id)"),
                {"lock_id": MIGRATION_LOCK_ID},
            )

        try:
            alembic_config.attributes["connection"] = connection
            command.upgrade(alembic_config, "head")
        finally:
            if use_postgres_lock:
                connection.execute(
                    text("SELECT pg_advisory_unlock(:lock_id)"),
                    {"lock_id": MIGRATION_LOCK_ID},
                )
