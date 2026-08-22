# Changelog

As mudanças relevantes deste produto seguem versionamento semântico.

## 5.0.0 - 2026-08-21

### Adicionado

- backend Python com FastAPI, Pydantic, SQLAlchemy assíncrono e asyncpg;
- serviços Vercel separados no mesmo projeto para React e FastAPI;
- imagens Docker independentes para frontend e backend;
- Redis REST via Upstash no ambiente serverless;
- tipagem estrita com BasedPyright e lint com Ruff;
- documentação profissional de arquitetura, segurança e deploy.

### Alterado

- Nginx passou a servir o React e encaminhar `/api` ao contêiner FastAPI;
- CI passou a validar Python e JavaScript antes do smoke test Docker;
- conexão PostgreSQL passou a aceitar URLs pooled do Neon;
- README reposicionado como apresentação de produto e portfólio.

### Preservado

- contrato HTTP do frontend;
- hashes `scrypt` existentes;
- CRUD, ativação, desativação, ocultação, restauração e exclusão definitiva;
- perfis, sessões, onboarding e auditoria.

## 4.0.0 - 2026-08-21

- onboarding visual do primeiro administrador;
- gestão de equipe e perfis;
- paginação no servidor, auditoria e Redis;
- ambiente Docker inicial e pipeline de integração contínua.
