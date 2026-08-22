"""Testes do contrato HTTP público da API."""

from fastapi.testclient import TestClient
from nexo_api.app import create_app
from nexo_api.config import Settings


def _client() -> TestClient:
    settings = Settings(
        app_env="test",
        database_url="postgresql://crud_app:test@127.0.0.1:5433/crud_usuarios",
        setup_mode="local",
        session_cookie_secure=False,
    )
    return TestClient(create_app(settings))


def test_health_exposes_python_api() -> None:
    """Given the app, when health is requested, then FastAPI answers safely."""
    with _client() as client:
        response = client.get("/api/saude")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    assert response.headers["x-content-type-options"] == "nosniff"


def test_openapi_documents_crud_and_auth_routes() -> None:
    """Given the app, when OpenAPI is read, then key product routes exist."""
    with _client() as client:
        response = client.get("/api/openapi.json")

    paths = response.json()["paths"]
    assert "/api/auth/login" in paths
    assert "/api/usuarios" in paths
    assert "/api/usuarios/{user_id}/permanente" in paths
    assert "/api/operadores/{operator_id}/perfil" in paths


def test_unknown_api_route_uses_stable_error_shape() -> None:
    """Given an unknown API path, when requested, then erro remains stable."""
    with _client() as client:
        response = client.get("/api/inexistente")

    assert response.status_code == 404
    assert response.json() == {"erro": "Rota da API não encontrada."}
