"""Administração de contas e perfis."""

from collections.abc import Mapping
from uuid import uuid4

from nexo_api.domain import Actor, OperatorId
from nexo_api.errors import AppError
from nexo_api.records import OperatorMutation, OperatorRecord
from nexo_api.repositories.audit import AuditRepository
from nexo_api.repositories.operators import OperatorRepository
from nexo_api.security.passwords import hash_password
from nexo_api.validation import (
    parse_operator_id,
    parse_role,
    validate_name_email_password,
)


class OperatorService:
    """Aplica invariantes antes de administrar contas de acesso."""

    def __init__(self, repository: OperatorRepository, audit: AuditRepository) -> None:
        self._repository = repository
        self._audit = audit

    async def list_all(self) -> tuple[OperatorRecord, ...]:
        """Lista contas para gestão da equipe."""
        return await self._repository.find_all_operators()

    async def create(self, raw: Mapping[str, str], actor: Actor) -> OperatorRecord:
        """Cria uma conta com senha individual."""
        nome, email, password = validate_name_email_password(raw)
        role = parse_role(str(raw.get("role", "")))
        operator = await self._repository.create_operator(
            OperatorId(str(uuid4())), nome, email, await hash_password(password), role
        )
        await self._audit_operator(actor, "OPERADOR_CRIADO", operator, {"role": role})
        return operator

    async def change_role(self, raw_id: str, role_value: str, actor: Actor) -> OperatorRecord:
        """Altera perfil sem violar a administração mínima."""
        operator_id = parse_operator_id(raw_id)
        role = parse_role(role_value)
        result = await self._repository.update_role_safely(operator_id, role, actor.id)
        operator = self._result_or_error(result)
        await self._audit_operator(actor, "OPERADOR_PERFIL_ALTERADO", operator, {"role": role})
        return operator

    async def set_active(self, raw_id: str, active: bool, actor: Actor) -> OperatorRecord:
        """Ativa ou desativa uma conta."""
        operator_id = parse_operator_id(raw_id)
        if operator_id == actor.id and not active:
            raise AppError("Você não pode desativar a própria conta.", 409)
        result = await self._repository.set_active_safely(operator_id, active, actor.id)
        operator = self._result_or_error(result)
        action = "OPERADOR_ATIVADO" if active else "OPERADOR_DESATIVADO"
        await self._audit_operator(actor, action, operator)
        return operator

    async def reset_password(
        self, raw_id: str, password: str, actor: Actor
    ) -> OperatorRecord:
        """Troca a senha e encerra sessões existentes."""
        operator_id = parse_operator_id(raw_id)
        if len(password) < 12:
            raise AppError("A senha deve ter pelo menos 12 caracteres.", 400)
        operator = await self._repository.update_password(
            operator_id, await hash_password(password)
        )
        if operator is None:
            raise AppError("Conta de acesso não encontrada.", 404)
        await self._audit_operator(actor, "OPERADOR_SENHA_REDEFINIDA", operator)
        return operator

    async def revoke_sessions(self, raw_id: str, actor: Actor) -> None:
        """Revoga sessões de outra conta."""
        operator_id = parse_operator_id(raw_id)
        if operator_id == actor.id:
            raise AppError("Use a opção Sair para encerrar a sua própria sessão.", 409)
        operator = await self._repository.revoke_sessions(operator_id)
        if operator is None:
            raise AppError("Conta de acesso não encontrada.", 404)
        await self._audit_operator(actor, "OPERADOR_SESSOES_REVOGADAS", operator)

    @staticmethod
    def _result_or_error(result: OperatorMutation) -> OperatorRecord:
        messages = {
            "not_found": ("Conta de acesso não encontrada.", 404),
            "last_admin": ("Não é possível remover o último administrador ativo.", 409),
            "self": ("Você não pode bloquear ou rebaixar a própria conta.", 409),
        }
        if result.status != "ok" or result.operator is None:
            message, status = messages[result.status]
            raise AppError(message, status)
        return result.operator

    async def _audit_operator(
        self,
        actor: Actor,
        action: str,
        operator: OperatorRecord,
        details: Mapping[str, str] | None = None,
    ) -> None:
        await self._audit.record(
            actor,
            action,
            None,
            entity="OPERADOR",
            details={
                "operatorId": operator.id,
                "operatorEmail": operator.email,
                **dict(details or {}),
            },
        )
