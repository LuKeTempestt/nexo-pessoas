"""Persistência PostgreSQL de autenticação e onboarding."""

from datetime import datetime
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from nexo_api.domain import OperatorId, Session
from nexo_api.records import OperatorRecord
from nexo_api.repositories.operator_mapping import OPERATOR_FIELDS, operator_from_row


class AuthRepository:
    """Mantém credenciais, sessões e o primeiro administrador."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def has_administrator(self) -> bool:
        """Informa se o onboarding já foi concluído."""
        async with self._engine.connect() as connection:
            result = await connection.execute(
                text("SELECT EXISTS (SELECT 1 FROM operadores WHERE perfil='ADMIN')")
            )
        return bool(result.scalar_one())

    async def create_first_administrator(
        self,
        operator_id: OperatorId,
        nome: str,
        email: str,
        password_hash: str,
    ) -> OperatorRecord | None:
        """Cria exatamente um primeiro administrador sob lock transacional."""
        async with self._engine.begin() as connection:
            _ = await connection.execute(
                text("SELECT pg_advisory_xact_lock(hashtext('nexo_operator_admin'))")
            )
            configured = await connection.execute(
                text("SELECT EXISTS (SELECT 1 FROM operadores WHERE perfil='ADMIN')")
            )
            if bool(configured.scalar_one()):
                return None
            row = (
                await connection.execute(
                    text(f"""
                        INSERT INTO operadores (id, nome, email, senha_hash, perfil)
                        VALUES (:id, :nome, :email, :password_hash, 'ADMIN')
                        RETURNING {OPERATOR_FIELDS}
                    """),
                    {
                        "id": UUID(operator_id),
                        "nome": nome,
                        "email": email,
                        "password_hash": password_hash,
                    },
                )
            ).mappings().one()
        return operator_from_row(row)

    async def find_operator_by_email(self, email: str) -> OperatorRecord | None:
        """Busca credenciais apenas durante o login."""
        query = text(f"SELECT {OPERATOR_FIELDS}, senha_hash FROM operadores WHERE email=:email")
        async with self._engine.connect() as connection:
            row = (await connection.execute(query, {"email": email})).mappings().first()
        return operator_from_row(row, with_password=True) if row else None

    async def create_session(
        self,
        token_hash: str,
        csrf_hash: str,
        operator_id: OperatorId,
        expires_at: datetime,
    ) -> None:
        """Persiste apenas os hashes dos tokens."""
        query = text("""
            INSERT INTO sessoes (token_hash, csrf_hash, operador_id, expira_em)
            VALUES (:token, :csrf, :operator_id, :expires_at)
        """)
        async with self._engine.begin() as connection:
            _ = await connection.execute(
                query,
                {
                    "token": token_hash,
                    "csrf": csrf_hash,
                    "operator_id": operator_id,
                    "expires_at": expires_at,
                },
            )

    async def find_session(self, token_hash: str) -> Session | None:
        """Recupera uma sessão ainda válida e sua conta."""
        query = text("""
            SELECT s.token_hash, s.csrf_hash, o.id, o.nome, o.email, o.perfil, o.ativo
            FROM sessoes s JOIN operadores o ON o.id=s.operador_id
            WHERE s.token_hash=:token AND s.expira_em>CURRENT_TIMESTAMP
        """)
        async with self._engine.connect() as connection:
            row = (await connection.execute(query, {"token": token_hash})).mappings().first()
        if not row:
            return None
        actor = operator_from_row(row).actor()
        return Session(str(row["token_hash"]), str(row["csrf_hash"]), actor)

    async def update_csrf(self, token_hash: str, csrf_hash: str) -> None:
        """Rotaciona o token CSRF e registra uso da sessão."""
        query = text("""
            UPDATE sessoes SET csrf_hash=:csrf, ultimo_uso_em=CURRENT_TIMESTAMP
            WHERE token_hash=:token
        """)
        async with self._engine.begin() as connection:
            _ = await connection.execute(query, {"token": token_hash, "csrf": csrf_hash})

    async def delete_session(self, token_hash: str) -> None:
        """Encerra uma sessão."""
        async with self._engine.begin() as connection:
            _ = await connection.execute(
                text("DELETE FROM sessoes WHERE token_hash=:token"), {"token": token_hash}
            )
