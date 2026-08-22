"""Registros tipados retornados pela persistência."""

from dataclasses import dataclass
from datetime import date, datetime
from typing import Literal

from nexo_api.domain import Actor, OperatorId, Role, UserId


@dataclass(frozen=True, slots=True)
class UserRecord:
    """Representação completa de uma pessoa cadastrada."""

    id: UserId
    nome: str
    email: str
    cpf: str
    telefone: str
    data_nascimento: date
    data_cadastro: datetime
    ativo: bool
    data_desativacao: datetime | None
    data_exclusao: datetime | None


@dataclass(frozen=True, slots=True)
class OperatorRecord:
    """Conta de acesso, com hash disponível apenas dentro do backend."""

    id: OperatorId
    nome: str
    email: str
    role: Role
    ativo: bool
    data_cadastro: datetime | None = None
    password_hash: str | None = None

    def actor(self) -> Actor:
        """Projeta o registro para a identidade segura de uma sessão."""
        return Actor(self.id, self.nome, self.email, self.role, self.ativo)


@dataclass(frozen=True, slots=True)
class AuditRecord:
    """Evento imutável da trilha de auditoria."""

    id: int
    operador_email: str
    acao: str
    entidade_id: int | None
    detalhes: dict[str, str]
    data_evento: datetime


MutationStatus = Literal["ok", "not_found", "last_admin", "self"]


@dataclass(frozen=True, slots=True)
class OperatorMutation:
    """Resultado explícito de uma mudança administrativa transacional."""

    status: MutationStatus
    operator: OperatorRecord | None = None
