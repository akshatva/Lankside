from app.services.mou_generator import LEGAL_REVIEW_DISCLAIMER


def _mou_payload(business_id: int) -> dict[str, object]:
    return {
        "business_id": business_id,
        "party_a_name": "Phase 14 Demo Business",
        "party_b_name": "Demo Cluster Partner",
        "purpose": "Joint procurement and shared distribution readiness",
        "duration_months": 12,
        "contribution_details": "Both parties contribute operational records.",
        "revenue_sharing": "Revenue sharing to be mutually agreed in writing.",
        "dispute_resolution": "Good-faith discussion followed by mediation.",
        "cluster_purpose": "Shared MSME cluster documentation readiness",
    }


def test_mou_generation_fallback_includes_legal_disclaimer(client, created_business):
    response = client.post(
        "/api/v1/mous/generate",
        json=_mou_payload(created_business["id"]),
    )
    assert response.status_code == 201
    assert LEGAL_REVIEW_DISCLAIMER in response.json()["draft_text"]


def test_mou_pdf_export_missing_mou_returns_safe_error(client):
    response = client.post("/api/v1/mous/999999/export-pdf")
    assert response.status_code == 404
