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
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"


def test_trusted_host_rejects_unknown_domain() -> None:
    """Given a host allowlist, requests from another domain are rejected."""
    settings = Settings(
        app_env="test",
        database_url="postgresql://crud_app:test@127.0.0.1:5433/crud_usuarios",
        setup_mode="local",
        session_cookie_secure=False,
        trusted_host="nexo.example",
    )
    with TestClient(create_app(settings)) as client:
        response = client.get("/api/saude", headers={"Host": "malicioso.example"})

    assert response.status_code == 400


def test_preview_wildcard_accepts_only_vercel_subdomains() -> None:
    """O curinga de Preview não se transforma em um curinga global."""
    settings = Settings(
        app_env="test",
        database_url="postgresql://crud_app:test@127.0.0.1:5433/crud_usuarios",
        setup_mode="local",
        session_cookie_secure=False,
        trusted_host="*.vercel.app",
    )
    with TestClient(create_app(settings), base_url="https://branch.vercel.app") as client:
        accepted = client.get("/api/saude")
        rejected = client.get("/api/saude", headers={"Host": "branch.example"})

    assert accepted.status_code == 200
    assert rejected.status_code == 400


def test_openapi_documents_crud_and_auth_routes() -> None:
    """Given the app, when OpenAPI is read, then key product routes exist."""
    with _client() as client:
        response = client.get("/api/openapi.json")

    paths = response.json()["paths"]
    assert "/api/auth/login" in paths
    assert "/api/usuarios" in paths
    assert "/api/usuarios/{user_id}/permanente" in paths
    assert "/api/operadores/{operator_id}/perfil" in paths


def test_interactive_docs_avoid_inline_scripts() -> None:
    """Given the docs page, scripts stay external so the CSP remains effective."""
    with _client() as client:
        response = client.get("/api/docs")
        script = client.get("/api/docs-init.js")

    assert response.status_code == 200
    assert '<script src="/api/docs-init.js"></script>' in response.text
    assert "unsafe-inline" not in response.headers["content-security-policy"]
    assert script.status_code == 200
    assert script.headers["content-type"].startswith("application/javascript")


def test_unknown_api_route_uses_stable_error_shape() -> None:
    """Given an unknown API path, when requested, then erro remains stable."""
    with _client() as client:
        response = client.get("/api/inexistente")

    assert response.status_code == 404
    assert response.json() == {"erro": "Rota da API não encontrada."}
