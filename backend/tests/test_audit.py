def test_audit_unknown_business_returns_404(client):
    response = client.post("/api/v1/audit/999999/run")
    assert response.status_code == 404


def test_audit_findings_list_route_works(client):
    response = client.get("/api/v1/audit")
    assert response.status_code == 200
    assert response.json() == []


def test_audit_severity_filter_validation(client):
    response = client.get("/api/v1/audit?severity=critical")
    assert response.status_code == 422
