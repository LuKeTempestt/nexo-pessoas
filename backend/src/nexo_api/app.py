"""Aplicação FastAPI do Nexo Pessoas."""

import logging
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import RequestResponseEndpoint
from starlette.middleware.trustedhost import TrustedHostMiddleware
from starlette.responses import Response

from nexo_api.config import Settings, get_settings
from nexo_api.container import Container, create_container
from nexo_api.database import ping_database
from nexo_api.errors import AppError, RateLimitUnavailableError
from nexo_api.http_auth import create_auth_dependencies
from nexo_api.routes.audit import create_audit_router
from nexo_api.routes.auth import create_auth_router
from nexo_api.routes.operators import create_operator_router
from nexo_api.routes.users import create_user_router

LOGGER = logging.getLogger("nexo_api")

SWAGGER_CSP = (
    "default-src 'none'; script-src 'self' https://cdn.jsdelivr.net; "
    "style-src https://cdn.jsdelivr.net; connect-src 'self'; img-src 'self' data:; "
    "frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
)


def create_app(settings: Settings | None = None) -> FastAPI:
    """Cria uma instância completa, permitindo configuração isolada em testes."""
    container = create_container(settings or get_settings())

    @asynccontextmanager
    async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
        yield
        await container.rate_store.close()
        await container.engine.dispose()

    application = FastAPI(
        title="Nexo Pessoas API",
        version="5.1.0",
        docs_url=None,
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )
    _install_middleware(application, container.settings)
    _install_error_handlers(application)
    _install_routes(application, container)
    return application


def _install_routes(application: FastAPI, container: Container) -> None:
    auth_dependencies = create_auth_dependencies(container.auth)

    @application.get("/api/saude")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @application.get("/api/saude/prontidao")
    async def readiness() -> JSONResponse:
        try:
            await ping_database(container.engine)
            await container.rate_store.ping()
        except (SQLAlchemyError, RateLimitUnavailableError):
            return JSONResponse({"status": "indisponivel"}, status_code=503)
        return JSONResponse({"status": "pronto"})

    @application.get("/api/docs", include_in_schema=False)
    async def api_docs() -> HTMLResponse:
        return HTMLResponse(
            """<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nexo Pessoas API</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head><body><div id="swagger-ui"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script src="/api/docs-init.js"></script></body></html>"""
        )

    @application.get("/api/docs-init.js", include_in_schema=False)
    async def api_docs_script() -> Response:
        script = (
            "window.ui=SwaggerUIBundle({url:'/api/openapi.json',dom_id:'#swagger-ui',"
            "deepLinking:true,presets:[SwaggerUIBundle.presets.apis],layout:'BaseLayout'});"
        )
        return Response(script, media_type="application/javascript")

    application.include_router(
        create_auth_router(
            container.auth,
            container.setup,
            auth_dependencies,
            container.limiter,
            container.settings,
        )
    )
    application.include_router(create_user_router(container.users, auth_dependencies))
    application.include_router(create_operator_router(container.operators, auth_dependencies))
    application.include_router(create_audit_router(container.audit, auth_dependencies))


def _install_middleware(application: FastAPI, settings: Settings) -> None:
    application.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.allowed_hosts or ["*"])

    @application.middleware("http")
    async def secure_headers(
        request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > 32_768:
            return JSONResponse({"erro": "O corpo da requisição é muito grande."}, status_code=413)
        response = await call_next(request)
        content_security_policy = (
            SWAGGER_CSP if request.url.path in {"/api/docs", "/api/docs-init.js"}
            else "default-src 'none'; frame-ancestors 'none'"
        )
        response.headers.update(
            {
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "Referrer-Policy": "no-referrer",
                "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
                "Content-Security-Policy": content_security_policy,
            }
        )
        return response


def _install_error_handlers(application: FastAPI) -> None:
    @application.exception_handler(AppError)
    async def app_error(_: Request, error: AppError) -> JSONResponse:
        return JSONResponse({"erro": error.message}, status_code=error.status_code)

    @application.exception_handler(RequestValidationError)
    async def validation_error(_: Request, error: RequestValidationError) -> JSONResponse:
        field = ".".join(str(item) for item in error.errors()[0].get("loc", ["dados"])[1:])
        return JSONResponse(
            {"erro": f"O campo {field or 'dados'} contém um valor inválido."}, status_code=400
        )

    @application.exception_handler(IntegrityError)
    async def integrity_error(_: Request, error: IntegrityError) -> JSONResponse:
        value = str(error.orig)
        conflicts = {
            "uq_usuarios_email": "Já existe um usuário com este e-mail.",
            "uq_usuarios_cpf": "Já existe um usuário com este CPF.",
            "uq_operadores_email": "Já existe uma conta de acesso com este e-mail.",
            "operadores_email_key": "Já existe uma conta de acesso com este e-mail.",
        }
        message = next(
            (text for constraint, text in conflicts.items() if constraint in value),
            "Já existe um registro com esses dados.",
        )
        return JSONResponse({"erro": message}, status_code=409)

    @application.exception_handler(StarletteHTTPException)
    async def http_error(_: Request, error: StarletteHTTPException) -> JSONResponse:
        message = "Rota da API não encontrada." if error.status_code == 404 else str(error.detail)
        return JSONResponse({"erro": message}, status_code=error.status_code)


app = create_app()
