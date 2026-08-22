"""Rotas de login, sessão e onboarding."""

from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response, status

from nexo_api.config import Settings
from nexo_api.domain import Session
from nexo_api.http_auth import COOKIE_NAME, AuthDependencies
from nexo_api.rate_limit import LoginRateLimiter
from nexo_api.schemas import (
    LoginPayload,
    OperatorOut,
    SessionOut,
    SetupPayload,
    SetupStatusOut,
)
from nexo_api.services.auth import AuthService
from nexo_api.services.setup import SetupService


def create_auth_router(
    auth: AuthService,
    setup: SetupService,
    dependencies: AuthDependencies,
    limiter: LoginRateLimiter,
    settings: Settings,
) -> APIRouter:
    """Monta endpoints públicos e endpoints de sessão."""
    router = APIRouter(prefix="/api")

    @router.get("/setup/status", response_model=SetupStatusOut)
    async def setup_status() -> SetupStatusOut:
        available, requires_token, configured = await setup.status()
        return SetupStatusOut(
            available=available,
            requiresToken=requires_token,
            configured=configured,
        )

    @router.post(
        "/setup/administrator",
        response_model=OperatorOut,
        status_code=status.HTTP_201_CREATED,
    )
    async def create_administrator(payload: SetupPayload, request: Request) -> OperatorOut:
        key = _limit_key(request, "/setup/administrator", settings.vercel)
        await limiter.check(key)
        operator = await setup.create_administrator(
            {
                "nome": payload.nome,
                "email": payload.email,
                "password": payload.password,
                "setupToken": payload.setup_token or "",
            }
        )
        await limiter.reset(key)
        return OperatorOut.model_validate(operator)

    @router.post("/auth/login", response_model=SessionOut)
    async def login(payload: LoginPayload, request: Request, response: Response) -> SessionOut:
        key = _limit_key(request, "/auth/login", settings.vercel)
        await limiter.check(key)
        result = await auth.login({"email": payload.email, "password": payload.password})
        await limiter.reset(key)
        response.set_cookie(
            COOKIE_NAME,
            result.token,
            httponly=True,
            secure=settings.session_cookie_secure,
            samesite="lax",
            max_age=8 * 60 * 60,
            path="/",
        )
        return SessionOut(
            operator=OperatorOut.model_validate(result.operator),
            csrfToken=result.csrf_token,
        )

    @router.get("/auth/me", response_model=SessionOut)
    async def me(request: Request) -> SessionOut:
        session, csrf = await auth.issue_csrf(request.cookies.get(COOKIE_NAME))
        return SessionOut(
            operator=OperatorOut.model_validate(session.operator),
            csrfToken=csrf,
        )

    @router.post("/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
    async def logout(
        request: Request,
        response: Response,
        session: Annotated[Session, Depends(dependencies.write_session)],
    ) -> None:
        del session
        await auth.logout(request.cookies.get(COOKIE_NAME))
        response.delete_cookie(
            COOKIE_NAME,
            httponly=True,
            secure=settings.session_cookie_secure,
            samesite="lax",
            path="/",
        )

    return router


def _limit_key(request: Request, route: str, trust_proxy: bool) -> str:
    forwarded = request.headers.get("x-forwarded-for") if trust_proxy else None
    address = forwarded.split(",", maxsplit=1)[0].strip() if forwarded else ""
    if not address and request.client:
        address = request.client.host
    return f"{address or 'unknown'}:{route}"
