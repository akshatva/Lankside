def test_create_list_get_and_update_business(client, business_payload):
    create_response = client.post("/api/v1/businesses", json=business_payload)
    assert create_response.status_code == 201
    business = create_response.json()

    list_response = client.get("/api/v1/businesses")
    assert list_response.status_code == 200
    assert any(item["id"] == business["id"] for item in list_response.json())

    get_response = client.get(f"/api/v1/businesses/{business['id']}")
    assert get_response.status_code == 200
    assert get_response.json()["business_name"] == business_payload["business_name"]

    update_response = client.put(
        f"/api/v1/businesses/{business['id']}",
        json={"city": "Lucknow"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["city"] == "Lucknow"


def test_business_create_requires_business_name(client):
    response = client.post(
        "/api/v1/businesses",
        json={"owner_name": "Demo Owner"},
    )
    assert response.status_code == 422
