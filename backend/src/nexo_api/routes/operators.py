"""Rotas administrativas de contas de acesso."""

from typing import Annotated

from fastapi import APIRouter, Depends, status

from nexo_api.domain import Session
from nexo_api.http_auth import AuthDependencies
from nexo_api.schemas import OperatorOut, OperatorPayload, PasswordPayload, RolePayload
from nexo_api.services.operators import OperatorService


def create_operator_router(service: OperatorService, auth: AuthDependencies) -> APIRouter:
    """Monta a gestão de equipe, exclusiva de administradores."""
    router = APIRouter(prefix="/api/operadores", tags=["Operadores"])
    manage = auth.require("team:manage")

    @router.get("", response_model=tuple[OperatorOut, ...])
    async def list_operators(
        session: Annotated[Session, Depends(manage)],
    ) -> tuple[OperatorOut, ...]:
        del session
        return tuple(OperatorOut.model_validate(item) for item in await service.list_all())

    @router.post("", response_model=OperatorOut, status_code=status.HTTP_201_CREATED)
    async def create_operator(
        payload: OperatorPayload,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(manage)],
    ) -> OperatorOut:
        del permission
        operator = await service.create(
            {
                "nome": payload.nome,
                "email": payload.email,
                "password": payload.password,
                "role": payload.role,
            },
            write_session.operator,
        )
        return OperatorOut.model_validate(operator)

    @router.patch("/{operator_id}/perfil", response_model=OperatorOut)
    async def change_role(
        operator_id: str,
        payload: RolePayload,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(manage)],
    ) -> OperatorOut:
        del permission
        changed = await service.change_role(
            operator_id, payload.role, write_session.operator
        )
        return OperatorOut.model_validate(changed)

    @router.patch("/{operator_id}/ativar", response_model=OperatorOut)
    async def activate_operator(
        operator_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(manage)],
    ) -> OperatorOut:
        del permission
        return OperatorOut.model_validate(
            await service.set_active(operator_id, True, write_session.operator)
        )

    @router.patch("/{operator_id}/desativar", response_model=OperatorOut)
    async def deactivate_operator(
        operator_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(manage)],
    ) -> OperatorOut:
        del permission
        return OperatorOut.model_validate(
            await service.set_active(operator_id, False, write_session.operator)
        )

    @router.patch("/{operator_id}/senha", response_model=OperatorOut)
    async def reset_password(
        operator_id: str,
        payload: PasswordPayload,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(manage)],
    ) -> OperatorOut:
        del permission
        changed = await service.reset_password(
            operator_id, payload.password, write_session.operator
        )
        return OperatorOut.model_validate(changed)

    @router.delete("/{operator_id}/sessoes", status_code=status.HTTP_204_NO_CONTENT)
    async def revoke_sessions(
        operator_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(manage)],
    ) -> None:
        del permission
        await service.revoke_sessions(operator_id, write_session.operator)

    return router
