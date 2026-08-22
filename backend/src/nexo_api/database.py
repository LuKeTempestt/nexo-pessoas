"""Criação e ciclo de vida do PostgreSQL assíncrono."""

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


def async_database_url(database_url: str) -> str:
    """Converte uma URL PostgreSQL comum para o driver asyncpg."""
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    parts = urlsplit(database_url)
    parameters = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        if key == "sslmode":
            parameters.append(("ssl", value))
        elif key != "channel_binding":
            parameters.append((key, value))
    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(parameters), parts.fragment)
    )


def create_database_engine(database_url: str) -> AsyncEngine:
    """Cria o pool usado pela API e pelo pooler do Neon."""
    return create_async_engine(
        async_database_url(database_url),
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=5,
        connect_args={"statement_cache_size": 0},
    )


async def ping_database(engine: AsyncEngine) -> None:
    """Confirma que uma conexão e uma consulta simples funcionam."""
    async with engine.connect() as connection:
        _ = await connection.execute(text("SELECT 1"))
