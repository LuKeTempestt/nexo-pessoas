# Arquitetura do Nexo Pessoas

## Visão geral

O repositório é um monorepo poliglota. React e FastAPI evoluem de forma
independente, mas mantêm um contrato HTTP único. PostgreSQL guarda estado de
negócio; Redis guarda somente contadores temporários de segurança.

```text
Navegador
   |
   +-- / --------> frontend (React/Vite ou Nginx)
   |
   +-- /api/* ---> backend (Python/FastAPI)
                         |-- PostgreSQL
                         |-- Redis/Upstash
```

## Separação por ambiente

| Ambiente | Frontend | Backend | PostgreSQL | Redis |
|---|---|---|---|---|
| Docker | Nginx não privilegiado | Uvicorn/FastAPI não privilegiado | contêiner com volume | contêiner sem persistência |
| Vercel | serviço Vite em `/` | serviço FastAPI em `/api` | Neon externo | Upstash REST externo |

O navegador continua em uma única origem. Isso mantém cookies e CSRF simples,
evita CORS e não transforma separação técnica em complexidade para o usuário.

## Camadas do backend

```text
routes -> services -> repositories -> PostgreSQL
   |          |
 schemas   domain + validation
              |
          audit + permissions
```

| Camada | Faz | Não faz |
|---|---|---|
| Routes | traduz HTTP e aplica dependências de acesso | escrever SQL |
| Services | coordena casos de uso e auditoria | conhecer React |
| Validation | normaliza CPF, telefone, datas, IDs e perfis | acessar banco |
| Repositories | executa SQL parametrizado e transações | escolher código HTTP |
| PostgreSQL | integridade, unicidade, histórico e sessões | controlar interface |
| Redis | limite temporário de tentativas | guardar pessoas ou senhas |

## Autenticação e autorização

Contas de acesso estão em `operadores`; pessoas gerenciadas estão em `usuarios`.
Essa separação evita confundir quem opera o sistema com quem aparece no cadastro.

| Perfil | Consulta | Altera | Exclusão definitiva | Auditoria | Equipe |
|---|---:|---:|---:|---:|---:|
| ADMIN | sim | sim | sim | sim | sim |
| OPERADOR | sim | sim | não | não | não |
| AUDITOR | sim | não | não | sim | não |

O token de sessão fica em cookie `HttpOnly`; o banco recebe apenas SHA-256 do
token. Escritas exigem um token CSRF separado. Senhas usam `scrypt` com salt
aleatório. Alterar perfil, desativar conta ou redefinir senha revoga sessões.

Locks transacionais impedem auto-rebaixamento e a remoção do último
administrador ativo. O primeiro administrador também é criado sob lock, portanto
duas requisições concorrentes não conseguem concluir o onboarding duas vezes.

## Ciclo de vida de uma pessoa

```text
Ativa <-> Desativada
  |           |
  +---- ocultar ----> Oculta ---- restaurar ----> estado anterior visível
                         |
                         +---- apagar definitivamente (ADMIN)
```

Ocultar atualiza `data_exclusao`; não executa `DELETE`. A remoção física só
aceita um registro já oculto. `ativo` e `data_desativacao` possuem uma constraint
que impede estados contraditórios.

## Banco e migrações

- `01_criar_tabela.sql`: estado completo para instalação nova;
- `02_adicionar_exclusao_logica.sql`: exclusão reversível;
- `03_adicionar_status_usuario.sql`: ativação e desativação;
- `04_adicionar_seguranca_e_auditoria.sql`: contas, sessões e auditoria.

Os scripts de schema `01` a `04` são idempotentes. O serviço `migrate` os aplica
antes do FastAPI no Docker. O script `00_criar_banco.sql` é apenas um auxiliar
administrativo e não participa desse fluxo. No Neon, a sequência `01` a `04` é
executada pelo SQL Editor antes do primeiro deploy.

## Decisões operacionais

- SQLAlchemy assíncrono e `asyncpg` evitam bloquear o servidor durante I/O.
- A URL pooled do Neon é usada pela API; migrações usam conexão direta.
- Redis TCP atende o Docker; Upstash REST evita conexões persistentes em funções.
- Nginx serve assets imutáveis e encaminha `/api` ao contêiner Python.
- Vercel Services constrói React e FastAPI separadamente sob um domínio.
- Healthchecks distinguem processo ativo de dependências prontas.
