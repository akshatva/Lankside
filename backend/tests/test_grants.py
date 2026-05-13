from app.schemas.scheme import GRANT_SCOUT_DISCLAIMER


def test_seed_schemes_and_list(client):
    seed_response = client.post("/api/v1/grants/seed-schemes")
    assert seed_response.status_code == 200
    assert seed_response.json()["total_seeded"] == 5

    list_response = client.get("/api/v1/grants/schemes")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 5


def test_grant_matching_unknown_business_returns_404(client):
    response = client.post("/api/v1/grants/999999/match")
    assert response.status_code == 404


def test_grant_matching_response_contains_disclaimer(client, created_business):
    client.post("/api/v1/grants/seed-schemes")
    response = client.post(f"/api/v1/grants/{created_business['id']}/match")
    assert response.status_code == 200
    assert response.json()["disclaimer"] == GRANT_SCOUT_DISCLAIMER
