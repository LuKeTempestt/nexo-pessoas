"""Persistência PostgreSQL do CRUD de pessoas."""

from datetime import date, datetime

from sqlalchemy import text
from sqlalchemy.engine import RowMapping
from sqlalchemy.ext.asyncio import AsyncEngine

from nexo_api.domain import ListOptions, UserId, UserInput
from nexo_api.records import UserRecord

FIELDS = """
id, nome, email, cpf, telefone, data_nascimento, data_cadastro,
ativo, data_desativacao, data_exclusao
"""


def _user(row: RowMapping) -> UserRecord:
    birth = row["data_nascimento"]
    created = row["data_cadastro"]
    deactivated = row["data_desativacao"]
    deleted = row["data_exclusao"]
    if not isinstance(birth, date) or not isinstance(created, datetime):
        msg = "O PostgreSQL retornou datas em formato inesperado."
        raise TypeError(msg)
    return UserRecord(
        UserId(int(str(row["id"]))),
        str(row["nome"]),
        str(row["email"]),
        str(row["cpf"]),
        str(row["telefone"]),
        birth,
        created,
        bool(row["ativo"]),
        deactivated if isinstance(deactivated, datetime) else None,
        deleted if isinstance(deleted, datetime) else None,
    )


class UserRepository:
    """Executa consultas parametrizadas sobre a tabela usuarios."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def find_page(
        self,
        options: ListOptions,
        *,
        hidden: bool,
    ) -> tuple[tuple[UserRecord, ...], int]:
        """Lista pessoas com busca, ordenação e paginação no servidor."""
        hidden_clause = "data_exclusao IS NOT NULL" if hidden else "data_exclusao IS NULL"
        orders = {
            "recent": "data_exclusao DESC" if hidden else "id DESC",
            "oldest": "data_exclusao ASC" if hidden else "id ASC",
            "name-asc": "nome ASC, id DESC",
            "name-desc": "nome DESC, id DESC",
        }
        where = f"""{hidden_clause} AND (
            nome ILIKE :pattern OR email ILIKE :pattern OR cpf ILIKE :pattern
            OR telefone ILIKE :pattern OR id::text ILIKE :pattern
        )"""
        values = {
            "pattern": f"%{options.query}%",
            "limit": options.page_size,
            "offset": (options.page - 1) * options.page_size,
        }
        async with self._engine.connect() as connection:
            count_result = await connection.execute(
                text(f"SELECT COUNT(*)::int AS total FROM usuarios WHERE {where}"), values
            )
            page_result = await connection.execute(
                text(
                    f"SELECT {FIELDS} FROM usuarios WHERE {where} "
                    f"ORDER BY {orders[options.sort]} LIMIT :limit OFFSET :offset"
                ),
                values,
            )
        total = int(str(count_result.scalar_one()))
        return tuple(_user(row) for row in page_result.mappings()), total

    async def summary(self) -> tuple[int, int, int]:
        """Conta cadastros visíveis, ativos e ocultos."""
        query = text("""
            SELECT COUNT(*) FILTER (WHERE data_exclusao IS NULL)::int AS total,
                   COUNT(*) FILTER (WHERE data_exclusao IS NULL AND ativo)::int AS active,
                   COUNT(*) FILTER (WHERE data_exclusao IS NOT NULL)::int AS hidden
            FROM usuarios
        """)
        async with self._engine.connect() as connection:
            row = (await connection.execute(query)).mappings().one()
        return int(str(row["total"])), int(str(row["active"])), int(str(row["hidden"]))

    async def find_by_id(self, user_id: UserId) -> UserRecord | None:
        """Busca uma pessoa que ainda não foi ocultada."""
        async with self._engine.connect() as connection:
            result = await connection.execute(
                text(f"SELECT {FIELDS} FROM usuarios WHERE id = :id AND data_exclusao IS NULL"),
                {"id": user_id},
            )
        row = result.mappings().first()
        return _user(row) if row else None

    async def create(self, user: UserInput) -> UserRecord:
        """Insere e devolve uma pessoa."""
        query = text(f"""
            INSERT INTO usuarios (nome, email, cpf, telefone, data_nascimento)
            VALUES (:nome, :email, :cpf, :telefone, :data_nascimento)
            RETURNING {FIELDS}
        """)
        async with self._engine.begin() as connection:
            row = (
                await connection.execute(query, _user_values(user))
            ).mappings().one()
        return _user(row)

    async def update(self, user_id: UserId, user: UserInput) -> UserRecord | None:
        """Atualiza uma pessoa visível."""
        query = text(f"""
            UPDATE usuarios SET nome=:nome, email=:email, cpf=:cpf,
              telefone=:telefone, data_nascimento=:data_nascimento
            WHERE id=:id AND data_exclusao IS NULL RETURNING {FIELDS}
        """)
        values = {**_user_values(user), "id": user_id}
        async with self._engine.begin() as connection:
            row = (await connection.execute(query, values)).mappings().first()
        return _user(row) if row else None

    async def soft_delete(self, user_id: UserId) -> bool:
        """Oculta uma pessoa sem remover a linha."""
        return await self._boolean_change(
            "UPDATE usuarios SET data_exclusao=CURRENT_TIMESTAMP "
            "WHERE id=:id AND data_exclusao IS NULL",
            user_id,
        )

    async def permanent_delete(self, user_id: UserId) -> UserRecord | None:
        """Remove fisicamente somente uma pessoa previamente ocultada."""
        query = text(f"""
            DELETE FROM usuarios WHERE id=:id AND data_exclusao IS NOT NULL RETURNING {FIELDS}
        """)
        async with self._engine.begin() as connection:
            row = (await connection.execute(query, {"id": user_id})).mappings().first()
        return _user(row) if row else None

    async def restore(self, user_id: UserId) -> UserRecord | None:
        """Restaura uma pessoa ocultada."""
        return await self._returning_change(
            "UPDATE usuarios SET data_exclusao=NULL "
            "WHERE id=:id AND data_exclusao IS NOT NULL",
            user_id,
        )

    async def deactivate(self, user_id: UserId) -> UserRecord | None:
        """Desativa uma pessoa sem ocultá-la."""
        return await self._returning_change(
            "UPDATE usuarios SET ativo=FALSE, data_desativacao=CURRENT_TIMESTAMP "
            "WHERE id=:id AND data_exclusao IS NULL AND ativo=TRUE",
            user_id,
        )

    async def activate(self, user_id: UserId) -> UserRecord | None:
        """Reativa uma pessoa visível."""
        return await self._returning_change(
            "UPDATE usuarios SET ativo=TRUE, data_desativacao=NULL "
            "WHERE id=:id AND data_exclusao IS NULL AND ativo=FALSE",
            user_id,
        )

    async def _returning_change(self, statement: str, user_id: UserId) -> UserRecord | None:
        query = text(f"{statement} RETURNING {FIELDS}")
        async with self._engine.begin() as connection:
            row = (await connection.execute(query, {"id": user_id})).mappings().first()
        return _user(row) if row else None

    async def _boolean_change(self, statement: str, user_id: UserId) -> bool:
        async with self._engine.begin() as connection:
            result = await connection.execute(text(statement), {"id": user_id})
        return bool(result.rowcount)


def _user_values(user: UserInput) -> dict[str, object]:
    return {
        "nome": user.nome,
        "email": user.email,
        "cpf": user.cpf,
        "telefone": user.telefone,
        "data_nascimento": user.data_nascimento,
    }
