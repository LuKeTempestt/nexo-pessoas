"""Modelos HTTP do FastAPI, separados do domínio e do banco."""

from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from nexo_api.domain import Role

TextField = Annotated[str, Field(max_length=254)]


class ApiModel(BaseModel):
    """Configuração comum de serialização camelCase."""

    model_config = ConfigDict(frozen=True, from_attributes=True, populate_by_name=True)


class UserPayload(ApiModel):
    """Corpo de criação e edição de pessoa."""

    nome: TextField = ""
    email: TextField = ""
    cpf: TextField = ""
    telefone: TextField = ""
    data_nascimento: TextField = Field(default="", alias="dataNascimento")


class UserOut(ApiModel):
    """Pessoa exposta pela API."""

    id: str
    nome: str
    email: str
    cpf: str
    telefone: str
    data_nascimento: date = Field(alias="dataNascimento")
    data_cadastro: datetime = Field(alias="dataCadastro")
    ativo: bool
    data_desativacao: datetime | None = Field(alias="dataDesativacao")
    data_exclusao: datetime | None = Field(alias="dataExclusao")


class UserPageOut(ApiModel):
    """Página de pessoas e metadados de navegação."""

    items: tuple[UserOut, ...]
    page: int
    page_size: int = Field(alias="pageSize")
    total: int
    total_pages: int = Field(alias="totalPages")


class UserSummaryOut(ApiModel):
    """Indicadores do cadastro."""

    total: int
    active: int
    hidden: int


class OperatorPayload(ApiModel):
    """Corpo de criação de conta de acesso."""

    nome: TextField = ""
    email: TextField = ""
    password: TextField = ""
    role: str = ""


class SetupPayload(ApiModel):
    """Corpo da configuração inicial."""

    nome: TextField = ""
    email: TextField = ""
    password: TextField = ""
    setup_token: TextField | None = Field(default=None, alias="setupToken")


class LoginPayload(ApiModel):
    """Credenciais de autenticação."""

    email: TextField = ""
    password: TextField = ""


class RolePayload(ApiModel):
    """Novo perfil de uma conta."""

    role: str = ""


class PasswordPayload(ApiModel):
    """Nova senha de uma conta."""

    password: TextField = ""


class OperatorOut(ApiModel):
    """Conta sem informações secretas."""

    id: str
    nome: str
    email: str
    role: Role
    ativo: bool
    data_cadastro: datetime | None = Field(default=None, alias="dataCadastro")


class SessionOut(ApiModel):
    """Sessão devolvida ao frontend."""

    operator: OperatorOut
    csrf_token: str = Field(alias="csrfToken")


class SetupStatusOut(ApiModel):
    """Estado do onboarding visual."""

    available: bool
    requires_token: bool = Field(alias="requiresToken")
    configured: bool


class HealthOut(ApiModel):
    """Estado simples de saúde."""

    status: Literal["ok", "pronto", "indisponivel"]


class ErrorOut(ApiModel):
    """Erro público e estável."""

    erro: str


class AuditOut(ApiModel):
    """Evento de auditoria exposto a perfis autorizados."""

    id: int
    operador_email: str = Field(alias="operadorEmail")
    acao: str
    entidade_id: int | None = Field(alias="entidadeId")
    detalhes: dict[str, str]
    data_evento: datetime = Field(alias="dataEvento")


class AuditPageOut(ApiModel):
    """Página de auditoria."""

    items: tuple[AuditOut, ...]
    page: int
    page_size: int = Field(alias="pageSize")
    total: int
    total_pages: int = Field(alias="totalPages")
