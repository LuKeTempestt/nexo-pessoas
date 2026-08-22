"""Autenticação, CSRF e RBAC exercitados na fronteira HTTP."""

import hashlib
from typing import TYPE_CHECKING, cast

import pytest
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.testclient import TestClient
from nexo_api.domain import Actor, OperatorId, Role, Session
from nexo_api.errors import AppError
from nexo_api.http_auth import COOKIE_NAME, create_auth_dependencies
from nexo_api.routes.audit import create_audit_router
from nexo_api.routes.users import create_user_router
from nexo_api.services.auth import AuthService

if TYPE_CHECKING:
    from nexo_api.repositories.audit import AuditRepository
    from nexo_api.repositories.auth import AuthRepository
    from nexo_api.services.users import UserService

CSRF_TOKEN = "csrf-de-teste"  # noqa: S105
USER_PAYLOAD = {
    "nome": "Pessoa Teste",
    "email": "pessoa@nexo.local",
    "cpf": "16899535009",
    "telefone": "11999999999",
    "dataNascimento": "1995-03-15",
}


class _SessionRepository:
    def __init__(self, session: Session) -> None:
        self._session = session

    async def find_session(self, token_hash: str) -> Session | None:
        del token_hash
        return self._session


class _AuditRepository:
    async def find_page(
        self, limit: int, offset: int
    ) -> tuple[list[dict[str, object]], int]:
        del limit, offset
        return [], 0


def _session(role: Role) -> Session:
    actor = Actor(OperatorId("1"), "Pessoa Teste", "pessoa@nexo.local", role, True)
    csrf_hash = hashlib.sha256(CSRF_TOKEN.encode()).hexdigest()
    return Session("session-hash", csrf_hash, actor)


def _client(role: Role) -> TestClient:
    repository = cast(
        "AuthRepository", cast("object", _SessionRepository(_session(role)))
    )
    dependencies = create_auth_dependencies(AuthService(repository))
    app = FastAPI()

    @app.exception_handler(AppError)
    async def app_error(_: Request, error: AppError) -> JSONResponse:
        return JSONResponse({"erro": error.message}, status_code=error.status_code)

    app.include_router(create_user_router(cast("UserService", object()), dependencies))
    app.include_router(
        create_audit_router(
            cast("AuditRepository", cast("object", _AuditRepository())), dependencies
        )
    )
    return TestClient(app, cookies={COOKIE_NAME: "session-token"})


def test_read_requires_authentication() -> None:
    """Rotas protegidas recusam requisições sem cookie de sessão."""
    with _client("ADMIN") as client:
        client.cookies.clear()
        response = client.get("/api/usuarios")

    assert response.status_code == 401


def test_write_requires_csrf() -> None:
    """Uma sessão válida não basta para mutações sem o cabeçalho CSRF."""
    with _client("ADMIN") as client:
        response = client.post("/api/usuarios", json=USER_PAYLOAD)

    assert response.status_code == 403
    assert response.json() == {"erro": "Token de segurança inválido."}


@pytest.mark.parametrize(
    ("role", "method", "path"),
    [
        ("OPERADOR", "DELETE", "/api/usuarios/42/permanente"),
        ("OPERADOR", "GET", "/api/auditoria"),
        ("AUDITOR", "POST", "/api/usuarios"),
    ],
)
def test_role_cannot_cross_privilege_boundary(role: Role, method: str, path: str) -> None:
    """Operador e auditor permanecem limitados à matriz de permissões."""
    with _client(role) as client:
        response = client.request(
            method,
            path,
            headers={"X-CSRF-Token": CSRF_TOKEN},
            json=USER_PAYLOAD if method == "POST" else None,
        )

    assert response.status_code == 403
    assert response.json() == {"erro": "Você não tem permissão para esta ação."}


def test_auditor_can_read_audit_trail() -> None:
    """O perfil de auditor recebe somente a consulta que lhe pertence."""
    with _client("AUDITOR") as client:
        response = client.get("/api/auditoria")

    assert response.status_code == 200
    assert response.json()["items"] == []
