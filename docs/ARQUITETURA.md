# Arquitetura do Nexo Pessoas

## Visão geral

O projeto é um monorepo npm com dois workspaces:

- `frontend`: aplicação React compilada pelo Vite;
- `backend`: API Express e servidor dos arquivos de produção.

PostgreSQL e Redis permanecem serviços independentes. Essa separação permite
desenvolver o front-end com recarga rápida e executar a solução inteira com
Docker Compose, sem conta em nuvem.

## Ambiente Docker

```text
Navegador -> app (React compilado + Express)
                 |-> PostgreSQL (usuários, operadores, sessões, auditoria)
                 |-> Redis (limitação temporária de tentativas)

migrate -> PostgreSQL -> encerra com sucesso
```

O Compose só inicia `app` depois de PostgreSQL, migrações e Redis estarem
saudáveis. O banco usa volume persistente; o Redis guarda apenas estado
temporário de segurança e não precisa persistir em disco.

## Fluxo de produção

```text
npm run build
  -> TypeScript verifica o front-end
  -> Vite gera frontend/dist
  -> Express serve frontend/dist
  -> /api continua atendida pelos controllers
```

## Responsabilidades

| Camada | Responsabilidade | Não deve fazer |
|---|---|---|
| React | interação e apresentação | executar SQL |
| API client | traduzir HTTP para funções | renderizar interface |
| Controller | receber e responder HTTP | decidir regra de negócio |
| Service | coordenar regras | conhecer elementos HTML |
| Validator | normalizar e validar | acessar o banco |
| Repository | persistir com SQL | escolher códigos HTTP |
| PostgreSQL | integridade e armazenamento | controlar a interface |
| Redis | estado temporário compartilhado | guardar usuários ou senhas |

## Segurança e perfis

Contas de operação ficam em `operadores`; usuários gerenciados permanecem em
`usuarios`. Sessões usam token aleatório em cookie `HttpOnly`, enquanto o banco
guarda somente seu hash. Escritas também exigem token CSRF.

| Perfil | Consulta | Altera | Apaga definitivamente | Auditoria |
|---|---:|---:|---:|---:|
| ADMIN | sim | sim | sim | sim |
| OPERADOR | sim | sim | não | não |
| AUDITOR | sim | não | não | sim |

Somente `ADMIN` gerencia contas de operação. A API impede que uma pessoa
desative ou rebaixe a própria conta e protege o último administrador ativo. Uma
troca de perfil, desativação ou redefinição de senha revoga sessões anteriores.

## Configuração inicial

`GET /api/setup/status` informa se já existe administrador. Quando não existe,
a interface oferece o cadastro inicial. O repositório usa transação e lock
consultivo no PostgreSQL para impedir que duas requisições criem dois primeiros
administradores ao mesmo tempo.

No Compose local, a aplicação é publicada apenas em `127.0.0.1` e o fluxo não
exige código. Em produção, `SETUP_MODE=token` exige um `SETUP_TOKEN` secreto que
nunca é incorporado ao JavaScript do navegador.

## Exclusão lógica

O endpoint `DELETE /api/usuarios/:id` não executa `DELETE FROM`. Ele registra
`data_exclusao = CURRENT_TIMESTAMP`. As consultas comuns filtram
`data_exclusao IS NULL`; a área de ocultos usa o filtro inverso.

Essa decisão preserva histórico e permite restauração. Os índices parciais
`idx_usuarios_ativos_id` e `idx_usuarios_ocultos_data` atendem os dois padrões de
consulta sem indexar linhas desnecessárias.

A migração está em `database/02_adicionar_exclusao_logica.sql`, com rollback em
`database/02_reverter_exclusao_logica.sql`.

## Ativação e desativação

Usuários visíveis possuem `ativo` e `data_desativacao`. Desativar não oculta o
registro: apenas altera seu estado operacional. A constraint
`ck_usuarios_status_ativo` garante que usuário ativo não tenha data de
desativação e que usuário desativado tenha essa data.

A mudança reversível está em `database/03_adicionar_status_usuario.sql` e
`database/03_reverter_status_usuario.sql`.

## Decisões principais

### React Query

Centraliza carregamento, cache, erros e atualização da lista. Depois de uma
mutação, a consulta `users` é invalidada, evitando sincronização manual frágil.

### React Hook Form e Zod

Mantêm o formulário tipado e reduzem renderizações desnecessárias. O schema do
front-end melhora o retorno imediato, mas não substitui o validador do servidor.

### Paginação no servidor

Busca, ordenação e paginação chegam como parâmetros validados. O PostgreSQL usa
`LIMIT` e `OFFSET`, e a resposta inclui total de registros e páginas.

### Build servido pelo Express

Simplifica a primeira publicação: uma URL entrega interface e API, sem CORS entre
origens. Em escala maior, o front-end pode ir para uma CDN e a API permanecer em
serviço separado.

## Próximos passos de produto

1. logs estruturados e métricas com ferramentas locais e gratuitas;
2. recuperação de senha por e-mail quando houver provedor configurado;
3. autenticação multifator;
4. paginação por cursor para bases muito grandes;
5. migração controlada da API para Python/FastAPI como evolução separada.
