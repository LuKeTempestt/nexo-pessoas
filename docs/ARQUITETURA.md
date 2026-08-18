# Arquitetura do Nexo Pessoas

## Visão geral

O projeto é um monorepo npm com dois workspaces:

- `frontend`: aplicação React compilada pelo Vite;
- `backend`: API Express e servidor dos arquivos de produção.

O PostgreSQL permanece independente. Essa separação permite desenvolver o
front-end com recarga rápida e publicar uma única aplicação Node quando desejado.

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

### Paginação no cliente

É suficiente para o escopo atual. Em uma base grande, busca, ordenação e
paginação devem migrar para parâmetros da API e consultas SQL com `LIMIT` e
`OFFSET` ou cursor.

### Build servido pelo Express

Simplifica a primeira publicação: uma URL entrega interface e API, sem CORS entre
origens. Em escala maior, o front-end pode ir para uma CDN e a API permanecer em
serviço separado.

## Próximos passos de produto

1. autenticação e perfis de acesso;
2. paginação e filtros no servidor;
3. trilha de auditoria com autor de cada alteração;
4. observabilidade e logs estruturados;
5. testes end-to-end no fluxo crítico;
6. pipeline de integração e publicação contínua.
