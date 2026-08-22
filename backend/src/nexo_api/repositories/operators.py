"""Persistência PostgreSQL da administração de contas."""

from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine

from nexo_api.domain import OperatorId, Role
from nexo_api.records import OperatorMutation, OperatorRecord
from nexo_api.repositories.operator_mapping import OPERATOR_FIELDS, operator_from_row


class OperatorRepository:
    """Mantém contas e invariantes administrativas transacionais."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def find_all_operators(self) -> tuple[OperatorRecord, ...]:
        """Lista as contas sem expor hashes."""
        async with self._engine.connect() as connection:
            result = await connection.execute(
                text(f"SELECT {OPERATOR_FIELDS} FROM operadores ORDER BY nome, email")
            )
        return tuple(operator_from_row(row) for row in result.mappings())

    async def create_operator(
        self,
        operator_id: OperatorId,
        nome: str,
        email: str,
        password_hash: str,
        role: Role,
    ) -> OperatorRecord:
        """Cria uma conta individual."""
        query = text(f"""
            INSERT INTO operadores (id, nome, email, senha_hash, perfil)
            VALUES (:id, :nome, :email, :password_hash, :role)
            RETURNING {OPERATOR_FIELDS}
        """)
        async with self._engine.begin() as connection:
            row = (
                await connection.execute(
                    query,
                    _operator_values(operator_id, nome, email, password_hash, role),
                )
            ).mappings().one()
        return operator_from_row(row)

    async def update_role_safely(
        self,
        operator_id: OperatorId,
        role: Role,
        actor_id: OperatorId,
    ) -> OperatorMutation:
        """Altera perfil sem permitir auto-rebaixamento ou perder o último admin."""
        async with self._engine.begin() as connection:
            await self._administration_lock(connection)
            current = await self._find_for_update(connection, operator_id)
            blocked = await self._role_guard(connection, current, role, actor_id)
            if blocked:
                return blocked
            row = (
                await connection.execute(
                    text(
                        f"UPDATE operadores SET perfil=:role WHERE id=:id "
                        f"RETURNING {OPERATOR_FIELDS}"
                    ),
                    {"role": role, "id": operator_id},
                )
            ).mappings().one()
            await self._delete_operator_sessions(connection, operator_id)
        return OperatorMutation("ok", operator_from_row(row))

    async def set_active_safely(
        self,
        operator_id: OperatorId,
        active: bool,
        actor_id: OperatorId,
    ) -> OperatorMutation:
        """Muda o status sem bloquear o último administrador."""
        async with self._engine.begin() as connection:
            await self._administration_lock(connection)
            current = await self._find_for_update(connection, operator_id)
            if current is None:
                return OperatorMutation("not_found")
            if operator_id == actor_id and not active:
                return OperatorMutation("self")
            if (
                current.ativo
                and current.role == "ADMIN"
                and not active
                and await self._active_admin_count(connection) <= 1
            ):
                return OperatorMutation("last_admin")
            row = (
                await connection.execute(
                    text(
                        f"UPDATE operadores SET ativo=:active WHERE id=:id "
                        f"RETURNING {OPERATOR_FIELDS}"
                    ),
                    {"active": active, "id": operator_id},
                )
            ).mappings().one()
            if not active:
                await self._delete_operator_sessions(connection, operator_id)
        return OperatorMutation("ok", operator_from_row(row))

    async def update_password(
        self, operator_id: OperatorId, password_hash: str
    ) -> OperatorRecord | None:
        """Troca a senha e revoga todas as sessões da conta."""
        async with self._engine.begin() as connection:
            row = (
                await connection.execute(
                    text(f"""
                        UPDATE operadores SET senha_hash=:password_hash WHERE id=:id
                        RETURNING {OPERATOR_FIELDS}
                    """),
                    {"password_hash": password_hash, "id": operator_id},
                )
            ).mappings().first()
            if row:
                await self._delete_operator_sessions(connection, operator_id)
        return operator_from_row(row) if row else None

    async def revoke_sessions(self, operator_id: OperatorId) -> OperatorRecord | None:
        """Revoga sessões de uma conta existente."""
        async with self._engine.begin() as connection:
            current = await self._find_for_update(connection, operator_id)
            if current:
                await self._delete_operator_sessions(connection, operator_id)
        return current

    async def _role_guard(
        self,
        connection: AsyncConnection,
        current: OperatorRecord | None,
        role: Role,
        actor_id: OperatorId,
    ) -> OperatorMutation | None:
        if current is None:
            return OperatorMutation("not_found")
        if current.id == actor_id and role != "ADMIN":
            return OperatorMutation("self")
        if (
            current.ativo
            and current.role == "ADMIN"
            and role != "ADMIN"
            and await self._active_admin_count(connection) <= 1
        ):
            return OperatorMutation("last_admin")
        return None

    async def _find_for_update(
        self, connection: AsyncConnection, operator_id: OperatorId
    ) -> OperatorRecord | None:
        row = (
            await connection.execute(
                text(f"SELECT {OPERATOR_FIELDS} FROM operadores WHERE id=:id FOR UPDATE"),
                {"id": operator_id},
            )
        ).mappings().first()
        return operator_from_row(row) if row else None

    @staticmethod
    async def _administration_lock(connection: AsyncConnection) -> None:
        _ = await connection.execute(
            text("SELECT pg_advisory_xact_lock(hashtext('nexo_operator_admin'))")
        )

    @staticmethod
    async def _active_admin_count(connection: AsyncConnection) -> int:
        result = await connection.execute(
            text("SELECT COUNT(*)::int FROM operadores WHERE perfil='ADMIN' AND ativo=TRUE")
        )
        return int(str(result.scalar_one()))

    @staticmethod
    async def _delete_operator_sessions(
        connection: AsyncConnection, operator_id: OperatorId
    ) -> None:
        _ = await connection.execute(
            text("DELETE FROM sessoes WHERE operador_id=:id"), {"id": operator_id}
        )


def _operator_values(
    operator_id: OperatorId,
    nome: str,
    email: str,
    password_hash: str,
    role: Role,
) -> dict[str, object]:
    return {
        "id": UUID(operator_id),
        "nome": nome,
        "email": email,
        "password_hash": password_hash,
        "role": role,
    }
