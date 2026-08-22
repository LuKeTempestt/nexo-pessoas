"""Validação das fronteiras entre desenvolvimento e produção."""

import pytest
from nexo_api.config import Settings
from pydantic import SecretStr, ValidationError

STRONG_SETUP_TOKEN = "setup-token-seguro-com-mais-de-32-caracteres"  # noqa: S105


def test_development_can_use_local_services() -> None:
    """Desenvolvimento pode montar URLs para os serviços locais."""
    settings = Settings(app_env="development", setup_mode="local", session_cookie_secure=False)

    assert settings.resolved_database_url.startswith("postgresql://")


def test_production_rejects_missing_security_services() -> None:
    """Produção não inicia quando faltam controles obrigatórios."""
    with pytest.raises(ValidationError, match="Configuração de produção incompleta"):
        _ = Settings(app_env="production")


def test_production_accepts_complete_configuration() -> None:
    """Produção aceita banco, Redis, setup, cookie e host protegidos."""
    settings = Settings(
        app_env="production",
        database_url="postgresql://user:password@database.example/nexo",
        upstash_redis_rest_url="https://redis.example",
        upstash_redis_rest_token=SecretStr("token"),
        setup_mode="token",
        setup_token=SecretStr(STRONG_SETUP_TOKEN),
        session_cookie_secure=True,
        trusted_host=" nexo.example, api.nexo.example ",
    )

    assert settings.app_env == "production"
    assert settings.allowed_hosts == ["nexo.example", "api.nexo.example"]


@pytest.mark.parametrize("trusted_host", ["", "   ", ",", "*", "*,nexo.example"])
def test_production_rejects_invalid_trusted_hosts(trusted_host: str) -> None:
    """Produção rejeita listas vazias e qualquer curinga global."""
    with pytest.raises(ValidationError, match="TRUSTED_HOST"):
        _ = Settings(
            app_env="production",
            database_url="postgresql://user:password@database.example/nexo",
            redis_url="redis://redis.example",
            setup_mode="token",
            setup_token=SecretStr(STRONG_SETUP_TOKEN),
            trusted_host=trusted_host,
        )


@pytest.mark.parametrize("setup_token", ["", "   ", "curto"])
def test_production_rejects_weak_setup_token(setup_token: str) -> None:
    """O segredo que libera o primeiro administrador não pode ser trivial."""
    with pytest.raises(ValidationError, match="32 caracteres"):
        _ = Settings(
            app_env="production",
            database_url="postgresql://user:password@database.example/nexo",
            redis_url="redis://redis.example",
            setup_mode="token",
            setup_token=SecretStr(setup_token),
            trusted_host="nexo.example",
        )


def test_vercel_enforces_managed_deployment_controls() -> None:
    """A Vercel não pode cair silenciosamente nas permissões de desenvolvimento."""
    with pytest.raises(ValidationError, match="Configuração de produção incompleta"):
        _ = Settings(vercel=True)
