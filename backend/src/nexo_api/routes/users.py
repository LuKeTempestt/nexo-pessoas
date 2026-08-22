"""Rotas protegidas do CRUD de pessoas."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from nexo_api.domain import Session
from nexo_api.http_auth import AuthDependencies
from nexo_api.schemas import UserOut, UserPageOut, UserPayload, UserSummaryOut
from nexo_api.services.users import UserService, user_out
from nexo_api.validation import parse_list_options


def create_user_router(service: UserService, auth: AuthDependencies) -> APIRouter:
    """Monta todas as operações de leitura e escrita de pessoas."""
    router = APIRouter(prefix="/api/usuarios", tags=["Usuários"])
    read = auth.require("users:read")
    write = auth.require("users:write")
    permanent = auth.require("users:permanent-delete")

    @router.get("", response_model=UserPageOut)
    async def list_users(
        session: Annotated[Session, Depends(read)],
        page: int = Query(1),
        page_size: int = Query(10, alias="pageSize"),
        query: str = Query("", max_length=120),
        sort: str = Query("recent"),
    ) -> UserPageOut:
        del session
        return await service.list_page(
            parse_list_options(page, page_size, query, sort), hidden=False
        )

    @router.get("/ocultos", response_model=UserPageOut)
    async def list_hidden(
        session: Annotated[Session, Depends(read)],
        page: int = Query(1),
        page_size: int = Query(10, alias="pageSize"),
        query: str = Query("", max_length=120),
        sort: str = Query("recent"),
    ) -> UserPageOut:
        del session
        return await service.list_page(
            parse_list_options(page, page_size, query, sort), hidden=True
        )

    @router.get("/resumo", response_model=UserSummaryOut)
    async def summary(session: Annotated[Session, Depends(read)]) -> UserSummaryOut:
        del session
        return await service.summary()

    @router.get("/{user_id}", response_model=UserOut)
    async def find_user(
        user_id: str, session: Annotated[Session, Depends(read)]
    ) -> UserOut:
        del session
        return UserOut.model_validate(user_out(await service.find(user_id)))

    @router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
    async def create_user(
        payload: UserPayload,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(write)],
    ) -> UserOut:
        del permission
        created = await service.create(_user_payload(payload), write_session.operator)
        return UserOut.model_validate(user_out(created))

    @router.put("/{user_id}", response_model=UserOut)
    async def update_user(
        user_id: str,
        payload: UserPayload,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(write)],
    ) -> UserOut:
        del permission
        updated = await service.update(user_id, _user_payload(payload), write_session.operator)
        return UserOut.model_validate(user_out(updated))

    @router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
    async def hide_user(
        user_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(write)],
    ) -> None:
        del permission
        await service.hide(user_id, write_session.operator)

    @router.delete("/{user_id}/permanente", status_code=status.HTTP_204_NO_CONTENT)
    async def permanently_delete_user(
        user_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(permanent)],
    ) -> None:
        del permission
        await service.permanently_delete(user_id, write_session.operator)

    @router.patch("/{user_id}/restaurar", response_model=UserOut)
    async def restore_user(
        user_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(write)],
    ) -> UserOut:
        del permission
        return UserOut.model_validate(
            user_out(await service.restore(user_id, write_session.operator))
        )

    @router.patch("/{user_id}/desativar", response_model=UserOut)
    async def deactivate_user(
        user_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(write)],
    ) -> UserOut:
        del permission
        return UserOut.model_validate(
            user_out(await service.deactivate(user_id, write_session.operator))
        )

    @router.patch("/{user_id}/ativar", response_model=UserOut)
    async def activate_user(
        user_id: str,
        write_session: Annotated[Session, Depends(auth.write_session)],
        permission: Annotated[Session, Depends(write)],
    ) -> UserOut:
        del permission
        return UserOut.model_validate(
            user_out(await service.activate(user_id, write_session.operator))
        )

    return router


def _user_payload(payload: UserPayload) -> dict[str, str]:
    return {
        "nome": payload.nome,
        "email": payload.email,
        "cpf": payload.cpf,
        "telefone": payload.telefone,
        "dataNascimento": payload.data_nascimento,
    }
