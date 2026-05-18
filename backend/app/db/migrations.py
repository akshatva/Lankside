import logging
from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.db.session import engine

BACKEND_ROOT = Path(__file__).resolve().parents[2]
MIGRATION_LOCK_ID = 202605120007
logger = logging.getLogger(__name__)


def run_startup_migrations() -> None:
    if not settings.run_startup_migrations or engine.dialect.name == "sqlite":
        return

    alembic_config = Config(str(BACKEND_ROOT / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(BACKEND_ROOT / "alembic"))

    try:
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
    except SQLAlchemyError:
        logger.exception(
            "Startup migrations failed; database-backed routes will return 503 "
            "until DATABASE_URL is reachable and migrations are applied."
        )
