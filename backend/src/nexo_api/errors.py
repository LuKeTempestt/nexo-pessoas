"""Erros esperados da aplicação."""


class AppError(Exception):
    """Erro seguro para apresentação ao cliente da API."""

    def __init__(self, message: str, status_code: int) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class RateLimitUnavailableError(Exception):
    """Indica indisponibilidade do armazenamento do limitador."""
