"""Rota paginada da trilha de auditoria."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query

from nexo_api.domain import Session
from nexo_api.http_auth import AuthDependencies
from nexo_api.repositories.audit import AuditRepository
from nexo_api.schemas import AuditOut, AuditPageOut


def create_audit_router(repository: AuditRepository, auth: AuthDependencies) -> APIRouter:
    """Monta a consulta de eventos para administradores e auditores."""
    router = APIRouter(prefix="/api/auditoria", tags=["Auditoria"])
    read_audit = auth.require("audit:read")

    @router.get("", response_model=AuditPageOut)
    async def list_audit(
        session: Annotated[Session, Depends(read_audit)],
        page: int = Query(1, ge=1),
    ) -> AuditPageOut:
        del session
        page_size = 20
        items, total = await repository.find_page(page_size, (page - 1) * page_size)
        return AuditPageOut(
            items=tuple(AuditOut.model_validate(item) for item in items),
            page=page,
            pageSize=page_size,
            total=total,
            totalPages=max(1, -(-total // page_size)),
        )

    return router
