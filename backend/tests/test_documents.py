from tests.conftest import create_uploaded_document


def test_list_documents_route_works(client):
    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    assert response.json() == {"documents": []}


def test_upload_rejects_unsupported_extension(client, created_business):
    response = client.post(
        "/api/v1/documents/upload",
        data={
            "business_id": str(created_business["id"]),
            "document_type": "GST_CERTIFICATE",
        },
        files={"file": ("demo.exe", b"demo", "application/octet-stream")},
    )
    assert response.status_code == 422


def test_upload_rejects_missing_business(client):
    response = client.post(
        "/api/v1/documents/upload",
        data={"business_id": "999999", "document_type": "GST_CERTIFICATE"},
        files={"file": ("demo.pdf", b"%PDF-1.4\n", "application/pdf")},
    )
    assert response.status_code == 404


def test_upload_returns_document_metadata(client, created_business):
    document = create_uploaded_document(client, created_business["id"])
    assert document["business_id"] == created_business["id"]
    assert document["document_type"] == "GST_CERTIFICATE"
    assert document["status"] == "PENDING"
    assert document["stored_filename"]
