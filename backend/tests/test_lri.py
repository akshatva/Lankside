from app.services.lri_engine import _band_for, calculate_lri_for_business


def test_lri_unknown_business_returns_404(client):
    response = client.post("/api/v1/lri/999999/calculate")
    assert response.status_code == 404


def test_lri_band_logic():
    assert _band_for(49.99) == "RED"
    assert _band_for(50) == "YELLOW"
    assert _band_for(79.99) == "YELLOW"
    assert _band_for(80) == "GREEN"


def test_lri_calculation_is_deterministic(db_session, created_business):
    first = calculate_lri_for_business(db_session, created_business["id"])
    second = calculate_lri_for_business(db_session, created_business["id"])

    assert first.document_integrity_score == second.document_integrity_score
    assert first.collaboration_score == second.collaboration_score
    assert first.financial_consistency_score == second.financial_consistency_score
    assert first.overall_score == second.overall_score
    assert first.band == second.band
