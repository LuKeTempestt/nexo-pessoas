"""Configuração validada por variáveis de ambiente."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuração única do processo da API."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

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
