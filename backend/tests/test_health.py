def test_health_routes(client):
    for path in ("/health", "/api/v1/health", "/api/v1/status"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json()
