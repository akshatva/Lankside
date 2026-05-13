from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "lankside_worker",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    imports=(
        "app.tasks.health_tasks",
        "app.tasks.audit_tasks",
        "app.tasks.lri_tasks",
        "app.tasks.mou_tasks",
        "app.tasks.grant_tasks",
        "app.tasks.report_tasks",
    ),
)
