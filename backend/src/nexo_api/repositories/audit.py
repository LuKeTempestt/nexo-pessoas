"""Persistência da trilha de auditoria."""

from collections.abc import Mapping
from datetime import datetime
from json import dumps, loads

from sqlalchemy import text
from sqlalchemy.engine import RowMapping
from sqlalchemy.ext.asyncio import AsyncEngine

from nexo_api.domain import Actor
from nexo_api.records import AuditRecord


def _audit(row: RowMapping) -> AuditRecord:
    occurred = row["data_evento"]
    if not isinstance(occurred, datetime):
        msg = "O PostgreSQL retornou uma data de auditoria inválida."
        raise TypeError(msg)
    raw_details = row["detalhes"]
    if isinstance(raw_details, str):
        parsed = loads(raw_details)
        details = {str(key): str(value) for key, value in parsed.items()}
    elif isinstance(raw_details, Mapping):
        details = {str(key): str(value) for key, value in raw_details.items()}
    else:
        details = {}
    entity = row["entidade_id"]
    return AuditRecord(
        int(str(row["id"])),
        str(row["operador_email"]),
        str(row["acao"]),
        int(str(entity)) if entity is not None else None,
        details,
        occurred,
    )


class AuditRepository:
    """Grava e pagina eventos relevantes do produto."""

    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def record(
        self,
        actor: Actor | None,
        action: str,
        entity_id: int | None,
        *,
        entity: str = "USUARIO",
        details: Mapping[str, str] | None = None,
    ) -> None:
        """Registra autoria e contexto de uma alteração."""
        query = text("""
            INSERT INTO auditoria
              (operador_id, operador_email, acao, entidade, entidade_id, detalhes)
            VALUES (:operator_id, :email, :action, :entity, :entity_id, CAST(:details AS JSONB))
        """)
        values = {
            "operator_id": actor.id if actor else None,
            "email": actor.email if actor else "sistema",
            "action": action,
            "entity": entity,
            "entity_id": entity_id,
            "details": dumps(dict(details or {})),
        }
        async with self._engine.begin() as connection:
            _ = await connection.execute(query, values)

    async def find_page(self, limit: int, offset: int) -> tuple[tuple[AuditRecord, ...], int]:
        """Lista eventos do mais recente para o mais antigo."""
        async with self._engine.connect() as connection:
            count_result = await connection.execute(text("SELECT COUNT(*) FROM auditoria"))
            total = int(str(count_result.scalar_one()))
            result = await connection.execute(
                text("""
                    SELECT id, operador_email, acao, entidade_id, detalhes, data_evento
                    FROM auditoria ORDER BY id DESC LIMIT :limit OFFSET :offset
                """),
                {"limit": limit, "offset": offset},
            )
        return tuple(_audit(row) for row in result.mappings()), total
