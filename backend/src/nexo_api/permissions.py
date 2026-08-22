"""Matriz central de autorização."""

from typing import Final, Literal

from nexo_api.domain import Role

Permission = Literal[
    "users:read",
    "users:write",
    "users:permanent-delete",
    "audit:read",
    "team:manage",
]

PERMISSIONS: Final[dict[Role, frozenset[Permission]]] = {
    "ADMIN": frozenset(
        {"users:read", "users:write", "users:permanent-delete", "audit:read", "team:manage"}
    ),
    "OPERADOR": frozenset({"users:read", "users:write"}),
    "AUDITOR": frozenset({"users:read", "audit:read"}),
}


def can(role: Role, permission: Permission) -> bool:
    """Informa se o perfil possui a permissão pedida."""
    return permission in PERMISSIONS[role]
