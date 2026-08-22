"""Dependências HTTP de autenticação e autorização."""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request

from nexo_api.domain import Session
from nexo_api.errors import AppError
from nexo_api.permissions import Permission
from nexo_api.services.auth import AuthService

COOKIE_NAME = "nexo_session"
SessionDependency = Callable[..., Awaitable[Session]]


@dataclass(frozen=True, slots=True)
class AuthDependencies:
    """Dependências prontas para composição nas rotas."""

    session: SessionDependency
    write_session: SessionDependency
    require: Callable[[Permission], SessionDependency]


def create_auth_dependencies(service: AuthService) -> AuthDependencies:
    """Cria dependências ligadas à instância de autenticação da aplicação."""

    async def current_session(request: Request) -> Session:
        return await service.get_session(request.cookies.get(COOKIE_NAME))

    async def write_session(
        request: Request,
        session: Annotated[Session, Depends(current_session)],
    ) -> Session:
        if not service.verify_csrf(session, request.headers.get("X-CSRF-Token")):
            raise AppError("Token de segurança inválido.", 403)
        return session

    def require(permission: Permission) -> SessionDependency:
        async def dependency(
            session: Annotated[Session, Depends(current_session)],
        ) -> Session:
            if not service.authorized(session, permission):
                raise AppError("Você não tem permissão para esta ação.", 403)
            return session

        return dependency

    return AuthDependencies(current_session, write_session, require)
