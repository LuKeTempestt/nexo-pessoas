"""Testes das regras de entrada do domínio."""

from datetime import date

import pytest
from nexo_api.errors import AppError
from nexo_api.validation import parse_user_id, validate_cpf, validate_user


def test_validate_cpf_accepts_valid_number() -> None:
    """Given a known CPF, when validating, then it is accepted."""
    assert validate_cpf("52998224725")


def test_validate_cpf_rejects_repeated_digits() -> None:
    """Given repeated digits, when validating, then CPF is rejected."""
    assert not validate_cpf("11111111111")


def test_validate_user_normalizes_fields() -> None:
    """Given formatted input, when parsing, then domain data is normalized."""
    user = validate_user(
        {
            "nome": "  Maria da Silva  ",
            "email": "  MARIA@EXEMPLO.COM ",
            "cpf": "529.982.247-25",
            "telefone": "(11) 99999-9999",
            "dataNascimento": "1995-03-15",
        },
        today=date(2026, 8, 21),
    )

    assert user.email == "maria@exemplo.com"
    assert user.cpf == "52998224725"
    assert user.telefone == "11999999999"


def test_validate_user_rejects_future_birth_date() -> None:
    """Given a future birth date, when parsing, then a client error is raised."""
    with pytest.raises(AppError, match="futuro") as captured:
        _ = validate_user(
            {
                "nome": "Maria da Silva",
                "email": "maria@exemplo.com",
                "cpf": "52998224725",
                "telefone": "11999999999",
                "dataNascimento": "2027-01-01",
            },
            today=date(2026, 8, 21),
        )

    assert captured.value.status_code == 400


@pytest.mark.parametrize("raw_id", ["0", "-1", "abc", "1.5"])
def test_parse_user_id_rejects_invalid_values(raw_id: str) -> None:
    """Given an invalid id, when parsing, then a client error is raised."""
    with pytest.raises(AppError) as captured:
        _ = parse_user_id(raw_id)

    assert captured.value.status_code == 400
