def test_health_routes(client):
    for path in ("/health", "/api/v1/health", "/api/v1/status"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json()


def test_vercel_origin_is_allowed_by_cors(client):
    response = client.options(
        "/api/v1/businesses",
        headers={
            "Origin": "https://lankside.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert (
        response.headers["access-control-allow-origin"]
        == "https://lankside.vercel.app"
    )
