"""Validação das fronteiras entre desenvolvimento e produção."""

import pytest
from nexo_api.config import Settings
from pydantic import SecretStr, ValidationError


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
        setup_token=SecretStr("setup-secret"),
        session_cookie_secure=True,
        trusted_host="nexo.example",
    )

    assert settings.app_env == "production"
