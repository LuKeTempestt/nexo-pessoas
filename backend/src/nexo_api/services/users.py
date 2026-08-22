"""Casos de uso do CRUD de pessoas."""

from collections.abc import Mapping

from nexo_api.domain import Actor, ListOptions
from nexo_api.errors import AppError
from nexo_api.records import UserRecord
from nexo_api.repositories.audit import AuditRepository
from nexo_api.repositories.users import UserRepository
from nexo_api.schemas import UserOut, UserPageOut, UserSummaryOut
from nexo_api.validation import parse_user_id, validate_user


class UserService:
    """Mantém regras do CRUD fora das rotas e do SQL."""

    def __init__(self, users: UserRepository, audit: AuditRepository) -> None:
        self._users = users
        self._audit = audit

    async def list_page(self, options: ListOptions, *, hidden: bool) -> UserPageOut:
        """Monta uma página estável para o frontend."""
        items, total = await self._users.find_page(options, hidden=hidden)
        return UserPageOut(
            items=tuple(UserOut.model_validate(_user_out(item)) for item in items),
            page=options.page,
            pageSize=options.page_size,
            total=total,
            totalPages=max(1, -(-total // options.page_size)),
        )

    async def summary(self) -> UserSummaryOut:
        """Retorna os indicadores principais."""
        total, active, hidden = await self._users.summary()
        return UserSummaryOut(total=total, active=active, hidden=hidden)

    async def find(self, raw_id: str) -> UserRecord:
        """Busca uma pessoa visível por ID."""
        user = await self._users.find_by_id(parse_user_id(raw_id))
        if user is None:
            raise AppError("Usuário não encontrado.", 404)
        return user

    async def create(self, raw: Mapping[str, str], actor: Actor) -> UserRecord:
        """Valida, persiste e audita um novo cadastro."""
        created = await self._users.create(validate_user(raw))
        await self._audit.record(actor, "USUARIO_CRIADO", created.id)
        return created

    async def update(self, raw_id: str, raw: Mapping[str, str], actor: Actor) -> UserRecord:
        """Atualiza um cadastro visível."""
        user_id = parse_user_id(raw_id)
        updated = await self._users.update(user_id, validate_user(raw))
        if updated is None:
            raise AppError("Usuário não encontrado.", 404)
        await self._audit.record(actor, "USUARIO_ATUALIZADO", user_id)
        return updated

    async def hide(self, raw_id: str, actor: Actor) -> None:
        """Executa exclusão lógica."""
        user_id = parse_user_id(raw_id)
        if not await self._users.soft_delete(user_id):
            raise AppError("Usuário não encontrado.", 404)
        await self._audit.record(actor, "USUARIO_OCULTADO", user_id)

    async def permanently_delete(self, raw_id: str, actor: Actor) -> None:
        """Apaga fisicamente somente depois da exclusão lógica."""
        user_id = parse_user_id(raw_id)
        removed = await self._users.permanent_delete(user_id)
        if removed is None:
            raise AppError("Usuário oculto não encontrado.", 404)
        await self._audit.record(
            actor,
            "USUARIO_APAGADO_PERMANENTEMENTE",
            user_id,
            details={"nome": removed.nome, "email": removed.email},
        )

    async def restore(self, raw_id: str, actor: Actor) -> UserRecord:
        """Restaura uma pessoa ocultada."""
        return await self._status_change(raw_id, actor, "restore")

    async def deactivate(self, raw_id: str, actor: Actor) -> UserRecord:
        """Desativa uma pessoa sem ocultá-la."""
        return await self._status_change(raw_id, actor, "deactivate")

    async def activate(self, raw_id: str, actor: Actor) -> UserRecord:
        """Reativa uma pessoa."""
        return await self._status_change(raw_id, actor, "activate")

    async def _status_change(self, raw_id: str, actor: Actor, operation: str) -> UserRecord:
        user_id = parse_user_id(raw_id)
        if operation == "restore":
            changed = await self._users.restore(user_id)
            message, action = "Usuário oculto não encontrado.", "USUARIO_RESTAURADO"
        elif operation == "deactivate":
            changed = await self._users.deactivate(user_id)
            message, action = "Usuário ativo não encontrado.", "USUARIO_DESATIVADO"
        else:
            changed = await self._users.activate(user_id)
            message, action = "Usuário desativado não encontrado.", "USUARIO_ATIVADO"
        if changed is None:
            raise AppError(message, 404)
        await self._audit.record(actor, action, user_id)
        return changed


def _user_out(user: UserRecord) -> dict[str, object]:
    return {
        "id": str(user.id),
        "nome": user.nome,
        "email": user.email,
        "cpf": user.cpf,
        "telefone": user.telefone,
        "dataNascimento": user.data_nascimento,
        "dataCadastro": user.data_cadastro,
        "ativo": user.ativo,
        "dataDesativacao": user.data_desativacao,
        "dataExclusao": user.data_exclusao,
    }


def user_out(user: UserRecord) -> dict[str, object]:
    """Converte registro interno no contrato público."""
    return _user_out(user)
