def test_demo_summary_route_works(client):
    response = client.get("/api/v1/admin/demo-summary")
    assert response.status_code == 200
    assert "demo_businesses" in response.json()


def test_seed_demo_data_route_works(client):
    response = client.post("/api/v1/admin/seed-demo-data")
    assert response.status_code == 200
    payload = response.json()
    assert payload["success"] is True
    assert payload["summary"]["demo_businesses"] == 3


def test_reset_demo_data_does_not_delete_non_demo_business(client, business_payload):
    create_response = client.post(
        "/api/v1/businesses",
        json={**business_payload, "business_name": "Non Demo Safety Business"},
    )
    assert create_response.status_code == 201
    business_id = create_response.json()["id"]

    reset_response = client.post("/api/v1/admin/reset-demo-data")
    assert reset_response.status_code == 200

    read_response = client.get(f"/api/v1/businesses/{business_id}")
    assert read_response.status_code == 200
    assert read_response.json()["business_name"] == "Non Demo Safety Business"
