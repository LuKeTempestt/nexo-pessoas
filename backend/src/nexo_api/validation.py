"""Validação explícita das regras do CRUD."""

import re
from collections.abc import Mapping
from datetime import date, datetime
from typing import Final
from uuid import UUID
from zoneinfo import ZoneInfo

from nexo_api.domain import ListOptions, OperatorId, Role, SortOption, UserId, UserInput
from nexo_api.errors import AppError

EMAIL_PATTERN: Final = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
ROLES: Final[tuple[Role, ...]] = ("ADMIN", "OPERADOR", "AUDITOR")
SORTS: Final[dict[str, SortOption]] = {
    "recent": "recent",
    "oldest": "oldest",
    "name-asc": "name-asc",
    "name-desc": "name-desc",
}


def _cpf_digit(part: str) -> int:
    total = sum(int(digit) * (len(part) + 1 - index) for index, digit in enumerate(part))
    remainder = (total * 10) % 11
    return 0 if remainder == 10 else remainder


def validate_cpf(cpf: str) -> bool:
    """Valida os dígitos verificadores de um CPF sem consultar serviço externo."""
    if not re.fullmatch(r"\d{11}", cpf) or len(set(cpf)) == 1:
        return False
    return _cpf_digit(cpf[:9]) == int(cpf[9]) and _cpf_digit(cpf[:10]) == int(cpf[10])


def validate_user(raw: Mapping[str, str], *, today: date | None = None) -> UserInput:
    """Normaliza e valida a entrada do cadastro."""
    nome = str(raw.get("nome", "")).strip()
    email = str(raw.get("email", "")).strip().lower()
    cpf = re.sub(r"\D", "", str(raw.get("cpf", "")))
    telefone = re.sub(r"\D", "", str(raw.get("telefone", "")))
    birth_text = str(raw.get("dataNascimento", "")).strip()
    if not 3 <= len(nome) <= 120:
        raise AppError("O nome deve ter entre 3 e 120 caracteres.", 400)
    if len(email) > 254 or EMAIL_PATTERN.fullmatch(email) is None:
        raise AppError("Informe um e-mail válido.", 400)
    if not validate_cpf(cpf):
        raise AppError("Informe um CPF válido.", 400)
    if re.fullmatch(r"\d{10,11}", telefone) is None:
        raise AppError("O telefone deve ter 10 ou 11 números.", 400)
    try:
        data_nascimento = date.fromisoformat(birth_text)
    except ValueError as error:
        raise AppError("Informe uma data de nascimento válida.", 400) from error
    current_date = today or datetime.now(tz=ZoneInfo("America/Sao_Paulo")).date()
    if data_nascimento > current_date:
        raise AppError("A data de nascimento não pode estar no futuro.", 400)
    return UserInput(nome, email, cpf, telefone, data_nascimento)


def parse_user_id(value: str) -> UserId:
    """Converte um identificador positivo."""
    try:
        parsed = int(value)
    except ValueError as error:
        raise AppError("O ID informado é inválido.", 400) from error
    if parsed <= 0 or str(parsed) != value.strip():
        raise AppError("O ID informado é inválido.", 400)
    return UserId(parsed)


def parse_operator_id(value: str) -> OperatorId:
    """Valida um UUID de operador."""
    try:
        parsed = UUID(value)
    except ValueError as error:
        raise AppError("Identificador da conta inválido.", 400) from error
    return OperatorId(str(parsed))


def validate_name_email_password(raw: Mapping[str, str]) -> tuple[str, str, str]:
    """Valida os dados comuns às contas de acesso."""
    nome = str(raw.get("nome", "")).strip()
    email = str(raw.get("email", "")).strip().lower()
    password = str(raw.get("password", ""))
    if not 3 <= len(nome) <= 120:
        raise AppError("O nome deve ter entre 3 e 120 caracteres.", 400)
    if len(email) > 254 or EMAIL_PATTERN.fullmatch(email) is None:
        raise AppError("Informe um e-mail válido.", 400)
    if len(password) < 12:
        raise AppError("A senha deve ter pelo menos 12 caracteres.", 400)
    return nome, email, password


def parse_role(value: str) -> Role:
    """Valida um perfil de acesso."""
    role = value.upper()
    if role not in ROLES:
        raise AppError("Selecione um perfil de acesso válido.", 400)
    return role


def parse_list_options(page: int, page_size: int, query: str, sort: str) -> ListOptions:
    """Valida paginação, busca e ordenação."""
    if page < 1:
        raise AppError("A página informada é inválida.", 400)
    if not 1 <= page_size <= 100:
        raise AppError("O tamanho da página deve ficar entre 1 e 100.", 400)
    selected = SORTS.get(sort, "recent")
    return ListOptions(page, page_size, query.strip()[:120], selected)
