"""Composição explícita das dependências da API."""

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncEngine

from nexo_api.config import Settings
from nexo_api.database import create_database_engine
from nexo_api.rate_limit import LoginRateLimiter, RateLimitStore, create_rate_limit_store
from nexo_api.repositories.audit import AuditRepository
from nexo_api.repositories.auth import AuthRepository
from nexo_api.repositories.operators import OperatorRepository
from nexo_api.repositories.users import UserRepository
from nexo_api.services.auth import AuthService
from nexo_api.services.operators import OperatorService
from nexo_api.services.setup import SetupService
from nexo_api.services.users import UserService


@dataclass(frozen=True, slots=True)
class Container:
    """Grafo de objetos da aplicação, sem localizador global de serviços."""

    settings: Settings
    engine: AsyncEngine
    rate_store: RateLimitStore
    limiter: LoginRateLimiter
    auth: AuthService
    setup: SetupService
    users: UserService
    operators: OperatorService
    audit: AuditRepository


def create_container(settings: Settings) -> Container:
    """Liga infraestrutura, repositórios e casos de uso."""
    engine = create_database_engine(settings.resolved_database_url)
    rate_store = create_rate_limit_store(settings)
    audit = AuditRepository(engine)
    auth_repository = AuthRepository(engine)
    operator_repository = OperatorRepository(engine)
    users_repository = UserRepository(engine)
    return Container(
        settings=settings,
        engine=engine,
        rate_store=rate_store,
        limiter=LoginRateLimiter(rate_store),
        auth=AuthService(auth_repository),
        setup=SetupService(auth_repository, settings),
        users=UserService(users_repository, audit),
        operators=OperatorService(operator_repository, audit),
        audit=audit,
    )
