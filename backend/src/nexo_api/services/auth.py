"""Autenticação, sessões e proteção CSRF."""

import hashlib
import hmac
import secrets
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta

from nexo_api.domain import LoginResult, Session
from nexo_api.errors import AppError
from nexo_api.permissions import Permission, can
from nexo_api.repositories.auth import AuthRepository
from nexo_api.security.passwords import verify_password
from nexo_api.validation import EMAIL_PATTERN


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


class AuthService:
    """Coordena credenciais sem expor tokens persistidos."""

    def __init__(self, repository: AuthRepository) -> None:
        self._repository = repository

    async def login(self, raw: Mapping[str, str]) -> LoginResult:
        """Valida credenciais e cria uma sessão de oito horas."""
        email = str(raw.get("email", "")).strip().lower()
        password = str(raw.get("password", ""))
        if EMAIL_PATTERN.fullmatch(email) is None or len(password) < 8:
            raise AppError("E-mail ou senha inválidos.", 401)
        operator = await self._repository.find_operator_by_email(email)
        valid = bool(
            operator
            and operator.ativo
            and operator.password_hash
            and await verify_password(password, operator.password_hash)
        )
        if not valid or operator is None:
            raise AppError("E-mail ou senha inválidos.", 401)
        token = secrets.token_urlsafe(32)
        csrf = secrets.token_urlsafe(24)
        expires = datetime.now(UTC) + timedelta(hours=8)
        await self._repository.create_session(
            _digest(token), _digest(csrf), operator.id, expires
        )
        return LoginResult(operator.actor(), token, csrf, expires)

    async def get_session(self, token: str | None) -> Session:
        """Exige uma sessão válida e uma conta ativa."""
        if not token:
            raise AppError("Autenticação necessária.", 401)
        session = await self._repository.find_session(_digest(token))
        if session is None or not session.operator.ativo:
            raise AppError("Sessão inválida ou expirada.", 401)
        return session

    async def issue_csrf(self, token: str | None) -> tuple[Session, str]:
        """Rotaciona e devolve o token CSRF da sessão."""
        session = await self.get_session(token)
        csrf = secrets.token_urlsafe(24)
        await self._repository.update_csrf(session.token_hash, _digest(csrf))
        return session, csrf

    @staticmethod
    def verify_csrf(session: Session, csrf_token: str | None) -> bool:
        """Compara o CSRF recebido com o hash persistido."""
        return bool(csrf_token) and hmac.compare_digest(
            _digest(csrf_token or ""), session.csrf_hash
        )

    async def logout(self, token: str | None) -> None:
        """Revoga uma sessão se o cookie existir."""
        if token:
            await self._repository.delete_session(_digest(token))

    @staticmethod
    def authorized(session: Session, permission: Permission) -> bool:
        """Aplica a matriz de permissões ao perfil autenticado."""
        return can(session.operator.role, permission)
