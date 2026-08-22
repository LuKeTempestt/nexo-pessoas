"""Configuração validada por variáveis de ambiente."""

from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import Field, SecretStr, computed_field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração única do processo da API."""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        extra="ignore",
        case_sensitive=False,
    )

    app_env: Literal["development", "test", "production"] = "development"
    database_url: str | None = None
    db_host: str = "127.0.0.1"
    db_port: int = 5433
    db_name: str = "crud_usuarios"
    db_user: str = "crud_app"
    db_password: SecretStr = SecretStr("crud_dev_password")
    redis_url: str | None = None
    upstash_redis_rest_url: str | None = None
    upstash_redis_rest_token: SecretStr | None = None
    setup_mode: Literal["local", "token"] = "token"
    setup_token: SecretStr | None = None
    session_cookie_secure: bool = True
    trusted_host: str = "*"
    vercel: bool = Field(default=False, validation_alias="VERCEL")

    @model_validator(mode="after")
    def validate_environment(self) -> Self:
        """Recusa produção sem os controles necessários para autenticação."""
        token = self.upstash_redis_rest_token
        upstash_token_value = token.get_secret_value().strip() if token else ""
        setup_token_value = self.setup_token.get_secret_value().strip() if self.setup_token else ""
        has_upstash_token = bool(upstash_token_value)
        if bool(self.upstash_redis_rest_url) != has_upstash_token:
            msg = "UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN devem ser definidos juntos."
            raise ValueError(msg)
        is_managed_deployment = self.app_env == "production" or self.vercel
        if not is_managed_deployment:
            return self

        trusted_hosts = self.allowed_hosts
        missing: list[str] = []
        if not self.database_url:
            missing.append("DATABASE_URL")
        if not (self.redis_url or (self.upstash_redis_rest_url and has_upstash_token)):
            missing.append("Redis ou Upstash")
        if self.setup_mode != "token" or len(setup_token_value) < 32:
            missing.append("SETUP_MODE=token e SETUP_TOKEN com pelo menos 32 caracteres")
        if not self.session_cookie_secure:
            missing.append("SESSION_COOKIE_SECURE=true")
        if not trusted_hosts or "*" in trusted_hosts:
            missing.append("TRUSTED_HOST sem curingas globais")
        if missing:
            msg = f"Configuração de produção incompleta: {', '.join(missing)}."
            raise ValueError(msg)
        self.trusted_host = ",".join(trusted_hosts)
        return self

    @property
    def allowed_hosts(self) -> list[str]:
        """Normaliza a lista de hosts usada pelo middleware HTTP."""
        return [host.strip() for host in self.trusted_host.split(",") if host.strip()]

    @computed_field
    @property
    def resolved_database_url(self) -> str:
        """Retorna a URL explícita ou monta a conexão local."""
        if self.database_url:
            return self.database_url
        password = self.db_password.get_secret_value()
        return (
            f"postgresql://{self.db_user}:{password}@{self.db_host}:"
            f"{self.db_port}/{self.db_name}"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Carrega a configuração uma vez por processo quente."""
    return Settings()
