"""Entrypoint reconhecido pela Vercel e pelo Uvicorn."""

from nexo_api.app import app

__all__ = ["app"]
