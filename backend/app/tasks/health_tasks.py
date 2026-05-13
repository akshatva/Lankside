from app.worker import celery_app


@celery_app.task(name="lankside.health.ping_worker")
def ping_worker() -> str:
    return "pong"
