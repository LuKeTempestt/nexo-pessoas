"""Limitador compartilhado para login e configuração inicial."""

from dataclasses import dataclass
from time import monotonic
from typing import Protocol

from redis.asyncio import Redis as RedisClient
from redis.exceptions import RedisError
from upstash_redis.asyncio import Redis as UpstashClient
from upstash_redis.errors import UpstashError

from nexo_api.config import Settings
from nexo_api.errors import AppError, RateLimitUnavailableError


class RateLimitStore(Protocol):
    """Contrato mínimo compartilhado por Redis local e Upstash."""

    async def increment(self, key: str, window_ms: int) -> int: ...
    async def reset(self, key: str) -> None: ...
    async def ping(self) -> None: ...
    async def close(self) -> None: ...


@dataclass(slots=True)
class _MemoryEntry:
    count: int
    reset_at: float


class MemoryRateLimitStore:
    """Fallback de desenvolvimento; não deve ser usado entre instâncias."""

    def __init__(self) -> None:
        self._entries: dict[str, _MemoryEntry] = {}

    async def increment(self, key: str, window_ms: int) -> int:
        """Incrementa uma janela monotônica no processo."""
        now = monotonic()
        current = self._entries.get(key)
        if current is None or current.reset_at <= now:
            self._entries[key] = _MemoryEntry(1, now + window_ms / 1000)
            return 1
        current.count += 1
        return current.count

    async def reset(self, key: str) -> None:
        """Remove a janela após uma operação válida."""
        _ = self._entries.pop(key, None)

    async def ping(self) -> None:
        """O armazenamento em memória está sempre pronto."""

    async def close(self) -> None:
        """Não há conexões para encerrar."""


class RedisRateLimitStore:
    """Redis TCP usado no Docker e em infraestrutura tradicional."""

    def __init__(self, url: str) -> None:
        self._client: RedisClient = RedisClient.from_url(url, decode_responses=True)

    async def increment(self, key: str, window_ms: int) -> int:
        """Incrementa uma chave com expiração na primeira tentativa."""
        namespaced = _key(key)
        try:
            count = await self._client.incr(namespaced)
            if count == 1:
                _ = await self._client.pexpire(namespaced, window_ms)
        except RedisError as error:
            raise RateLimitUnavailableError from error
        return int(count)

    async def reset(self, key: str) -> None:
        """Apaga uma janela de tentativas."""
        try:
            _ = await self._client.delete(_key(key))
        except RedisError as error:
            raise RateLimitUnavailableError from error

    async def ping(self) -> None:
        """Confirma a disponibilidade do Redis."""
        try:
            _ = await self._client.ping()
        except RedisError as error:
            raise RateLimitUnavailableError from error

    async def close(self) -> None:
        """Fecha o pool TCP."""
        await self._client.aclose()


class UpstashRateLimitStore:
    """Redis REST adequado às funções serverless da Vercel."""

    def __init__(self, url: str, token: str) -> None:
        self._client = UpstashClient(url=url, token=token, allow_telemetry=False)

    async def increment(self, key: str, window_ms: int) -> int:
        """Incrementa a janela no Upstash."""
        namespaced = _key(key)
        try:
            count = await self._client.incr(namespaced)
            if count == 1:
                _ = await self._client.pexpire(namespaced, window_ms)
        except UpstashError as error:
            raise RateLimitUnavailableError from error
        return count

    async def reset(self, key: str) -> None:
        """Remove uma janela no Upstash."""
        try:
            _ = await self._client.delete(_key(key))
        except UpstashError as error:
            raise RateLimitUnavailableError from error

    async def ping(self) -> None:
        """Confirma acesso ao endpoint REST."""
        try:
            _ = await self._client.ping()
        except UpstashError as error:
            raise RateLimitUnavailableError from error

    async def close(self) -> None:
        """O cliente REST não mantém conexão Redis persistente."""


class LoginRateLimiter:
    """Aplica limite uniforme e falha fechada quando o store cai."""

    def __init__(self, store: RateLimitStore, *, limit: int = 5, window_ms: int = 900_000) -> None:
        self._store = store
        self._limit = limit
        self._window_ms = window_ms

    async def check(self, key: str) -> None:
        """Bloqueia a tentativa que excede o limite."""
        try:
            count = await self._store.increment(key, self._window_ms)
        except RateLimitUnavailableError as error:
            message = "O controle de acesso está temporariamente indisponível."
            raise AppError(message, 503) from error
        if count > self._limit:
            raise AppError("Muitas tentativas de acesso. Tente novamente mais tarde.", 429)

    async def reset(self, key: str) -> None:
        """Limpa o contador após sucesso."""
        try:
            await self._store.reset(key)
        except RateLimitUnavailableError:
            return


def create_rate_limit_store(settings: Settings) -> RateLimitStore:
    """Seleciona Upstash, Redis TCP ou memória, nessa ordem."""
    token = settings.upstash_redis_rest_token
    if settings.upstash_redis_rest_url and token:
        return UpstashRateLimitStore(
            settings.upstash_redis_rest_url,
            token.get_secret_value(),
        )
    if settings.redis_url:
        return RedisRateLimitStore(settings.redis_url)
    return MemoryRateLimitStore()


def _key(value: str) -> str:
    return f"nexo:rate-limit:{value}"
