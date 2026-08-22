"""Conversão central de linhas PostgreSQL em contas tipadas."""

from datetime import datetime

from sqlalchemy.engine import RowMapping

from nexo_api.domain import OperatorId
from nexo_api.records import OperatorRecord
from nexo_api.validation import parse_role

OPERATOR_FIELDS = "id, nome, email, perfil, ativo, data_cadastro"


def operator_from_row(row: RowMapping, *, with_password: bool = False) -> OperatorRecord:
    """Converte uma linha selecionada da tabela operadores."""
    created = row.get("data_cadastro")
    return OperatorRecord(
        OperatorId(str(row["id"])),
        str(row["nome"]),
        str(row["email"]),
        parse_role(str(row["perfil"])),
        bool(row["ativo"]),
        created if isinstance(created, datetime) else None,
        str(row["senha_hash"]) if with_password else None,
    )
