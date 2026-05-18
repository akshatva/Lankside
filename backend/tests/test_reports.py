from app.schemas.report import BANKABILITY_REPORT_DISCLAIMER
from app.models.report import BankabilityReport


def test_report_generation_unknown_business_returns_404(client):
    response = client.post("/api/v1/reports/999999/generate")
    assert response.status_code == 404


def test_reports_list_route_works(client):
    response = client.get("/api/v1/reports")
    assert response.status_code == 200
    assert response.json() == []


def test_download_missing_report_returns_safe_error(client):
    response = client.get("/api/v1/reports/999999/download")
    assert response.status_code == 404


def test_generated_report_contains_disclaimer(client, created_business):
    response = client.post(f"/api/v1/reports/{created_business['id']}/generate")
    assert response.status_code == 200
    payload = response.json()
    assert payload["disclaimer"] == BANKABILITY_REPORT_DISCLAIMER
    assert payload["summary"]["disclaimer"] == BANKABILITY_REPORT_DISCLAIMER


def test_report_generation_pdf_failure_marks_report_failed(
    client,
    created_business,
    db_session,
    monkeypatch,
):
    def fail_pdf_generation(*_, **__):
        raise RuntimeError("disk is unavailable")

    monkeypatch.setattr(
        "app.api.v1.endpoints.reports.generate_report_pdf",
        fail_pdf_generation,
    )

    response = client.post(f"/api/v1/reports/{created_business['id']}/generate")

    assert response.status_code == 500
    assert response.json() == {
        "detail": "Unable to generate report PDF. Please try again.",
    }

    report = db_session.query(BankabilityReport).one()
    assert report.status == "FAILED"
