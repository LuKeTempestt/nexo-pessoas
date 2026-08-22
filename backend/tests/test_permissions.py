"""Testes das permissões por perfil."""

from nexo_api.permissions import can


def test_only_admin_can_permanently_delete() -> None:
    """Given the three roles, then permanent deletion stays admin-only."""
    assert can("ADMIN", "users:permanent-delete")
    assert not can("OPERADOR", "users:permanent-delete")
    assert not can("AUDITOR", "users:permanent-delete")


def test_auditor_has_read_only_access() -> None:
    """Given an auditor, then reads are allowed and writes are denied."""
    assert can("AUDITOR", "users:read")
    assert can("AUDITOR", "audit:read")
    assert not can("AUDITOR", "users:write")
