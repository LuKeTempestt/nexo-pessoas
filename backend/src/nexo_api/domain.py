"""Tipos imutáveis usados pelo domínio."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal, NewType

UserId = NewType("UserId", int)
OperatorId = NewType("OperatorId", str)
Role = Literal["ADMIN", "OPERADOR", "AUDITOR"]
SortOption = Literal["recent", "oldest", "name-asc", "name-desc"]


@dataclass(frozen=True, slots=True)
class UserInput:
    """Dados normalizados para criar ou editar uma pessoa."""

    nome: str
    email: str
    cpf: str
    telefone: str
    data_nascimento: date


@dataclass(frozen=True, slots=True)
class ListOptions:
    """Filtros e paginação validados."""

    page: int
    page_size: int
    query: str
    sort: SortOption


@dataclass(frozen=True, slots=True)
class Actor:
    """Identidade mínima usada em autorização e auditoria."""

    id: OperatorId
    nome: str
    email: str
    role: Role
    ativo: bool


@dataclass(frozen=True, slots=True)
class Session:
    """Sessão autenticada recuperada do banco."""

    token_hash: str
    csrf_hash: str
    operator: Actor


@dataclass(frozen=True, slots=True)
class LoginResult:
    """Credenciais temporárias produzidas por um login válido."""

    operator: Actor
    token: str
    csrf_token: str
    expires_at: datetime
