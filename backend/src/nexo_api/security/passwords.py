"""Hash de senha compatível com a versão Node anterior."""

import hashlib
import hmac
import secrets
from functools import partial
from typing import Final

from anyio import to_thread

KEY_LENGTH: Final = 64
COST: Final = 16_384


def _derive(password: str, salt: str, length: int) -> bytes:
    return hashlib.scrypt(
        password.encode(),
        salt=salt.encode(),
        n=COST,
        r=8,
        p=1,
        dklen=length,
    )


async def hash_password(password: str) -> str:
    """Cria um hash scrypt salgado fora da thread do servidor web."""
    salt = secrets.token_hex(16)
    derived = await to_thread.run_sync(partial(_derive, password, salt, KEY_LENGTH))
    return f"scrypt${COST}${salt}${derived.hex()}"


async def verify_password(password: str, stored_hash: str) -> bool:
    """Compara uma senha em tempo constante e falha fechada para hashes inválidos."""
    parts = stored_hash.split("$")
    if len(parts) != 4 or parts[0] != "scrypt" or parts[1] != str(COST):
        return False
    salt, expected_hex = parts[2], parts[3]
    try:
        expected = bytes.fromhex(expected_hex)
    except ValueError:
        return False
    actual = await to_thread.run_sync(partial(_derive, password, salt, len(expected)))
    return hmac.compare_digest(expected, actual)
