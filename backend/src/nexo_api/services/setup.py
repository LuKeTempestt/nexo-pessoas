"""Onboarding seguro do primeiro administrador."""

import hmac
from collections.abc import Mapping
from uuid import uuid4

from nexo_api.config import Settings
from nexo_api.domain import OperatorId
from nexo_api.errors import AppError
from nexo_api.records import OperatorRecord
from nexo_api.repositories.auth import AuthRepository
from nexo_api.security.passwords import hash_password
from nexo_api.validation import validate_name_email_password


class SetupService:
    """Permite uma única configuração inicial, local ou protegida por token."""

    def __init__(self, repository: AuthRepository, settings: Settings) -> None:
        self._repository = repository
        self._settings = settings

    async def status(self) -> tuple[bool, bool, bool]:
        """Informa disponibilidade, exigência de token e configuração."""
        configured = await self._repository.has_administrator()
        requires_token = self._settings.setup_mode == "token"
        return not configured, requires_token, configured

    async def create_administrator(self, raw: Mapping[str, str]) -> OperatorRecord:
        """Cria a primeira conta sob a proteção transacional do repositório."""
        if await self._repository.has_administrator():
            raise AppError("A configuração inicial já foi concluída.", 409)
        self._verify_setup_token(raw.get("setupToken"))
        nome, email, password = validate_name_email_password(raw)
        created = await self._repository.create_first_administrator(
            OperatorId(str(uuid4())), nome, email, await hash_password(password)
        )
        if created is None:
            raise AppError("A configuração inicial já foi concluída.", 409)
        return created

    def _verify_setup_token(self, received: str | None) -> None:
        if self._settings.setup_mode == "local":
            return
        configured = self._settings.setup_token
        expected = configured.get_secret_value() if configured else ""
        if not expected or not hmac.compare_digest(received or "", expected):
            raise AppError("Código de configuração inválido.", 403)
