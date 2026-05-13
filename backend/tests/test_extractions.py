from tests.conftest import create_uploaded_document


def test_extraction_unknown_document_returns_404(client):
    response = client.post("/api/v1/extractions/999999/run")
    assert response.status_code == 404


def test_extraction_listing_route_works(client, created_business):
    document = create_uploaded_document(client, created_business["id"])
    run_response = client.post(f"/api/v1/extractions/{document['id']}/run")
    assert run_response.status_code == 200

    list_response = client.get(
        f"/api/v1/extractions?business_id={created_business['id']}",
    )
    assert list_response.status_code == 200
    extractions = list_response.json()["extractions"]
    assert len(extractions) == 1
    assert extractions[0]["extraction_status"] == "COMPLETED"


def test_extraction_fallback_does_not_expose_secret_values(client, created_business):
    document = create_uploaded_document(client, created_business["id"])
    response = client.post(f"/api/v1/extractions/{document['id']}/run")
    assert response.status_code == 200
    payload = response.json()
    assert payload["extracted_fields"]["sensitive_values_redacted"] is True
    assert "GEMINI" not in str(payload).upper()
    assert "PINECONE" not in str(payload).upper()
