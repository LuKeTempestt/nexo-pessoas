"""Testes de compatibilidade das URLs PostgreSQL."""

from nexo_api.database import async_database_url


def test_neon_url_is_compatible_with_asyncpg() -> None:
    """Given a Neon URL, when normalized, then unsupported options are adapted."""
    raw = (
        "postgresql://user:secret@host-pooler.neon.tech/database"
        "?sslmode=require&channel_binding=require"
    )

    normalized = async_database_url(raw)

    assert normalized.startswith("postgresql+asyncpg://")
    assert "ssl=require" in normalized
    assert "sslmode" not in normalized
    assert "channel_binding" not in normalized
