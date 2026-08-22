"""Testes da compatibilidade e proteção de senhas."""

import pytest
from nexo_api.security.passwords import hash_password, verify_password


@pytest.mark.anyio
async def test_hash_round_trip() -> None:
    """Given a password, when hashed, then only the same password validates."""
    stored = await hash_password("uma-senha-forte-123")

    assert stored.startswith("scrypt$16384$")
    assert await verify_password("uma-senha-forte-123", stored)
    assert not await verify_password("senha-incorreta", stored)


@pytest.mark.anyio
async def test_verify_rejects_malformed_hash() -> None:
    """Given a malformed hash, when verifying, then it fails closed."""
    assert not await verify_password("uma-senha-forte-123", "texto-invalido")
