# Guia de estudo passo a passo

Este guia ensina o projeto na ordem em que os dados viajam. A explicação fica
aqui; a interface do produto fica livre para fazer o trabalho dela.

## Evolução para a versão 4

O **front-end** está em `frontend/`: é a parte visível no navegador. O
**back-end** está em `backend/`: autentica, verifica permissões, aplica regras e
fala com o PostgreSQL. A pasta `database/` guarda tabelas e migrações.

1. `database/04_adicionar_seguranca_e_auditoria.sql` cria operadores, sessões e auditoria.
2. `backend/src/services/authService.js` valida credenciais e cria sessões.
3. `backend/src/middlewares/auth.js` protege rotas e verifica perfil e CSRF.
4. Busca, ordenação e página chegam à API e viram SQL com `LIMIT` e `OFFSET`.
5. Ocultar é reversível. Apagar definitivamente exige usuário oculto, confirmação
   textual e perfil `ADMIN`.
6. `.github/workflows/ci.yml` valida cada atualização antes do gancho de deploy.

7. `compose.yaml` inicia aplicação, PostgreSQL, migrações e Redis.
8. A própria tela inicial cria o primeiro administrador. Não há credenciais
   padrão, e senhas reais nunca devem entrar no código ou no Git.

## 1. Execute e observe

Para o caminho mais simples, execute `docker compose up --build -d`, abra
`http://localhost:3000`, crie o primeiro administrador e faça as operações:

1. cadastre um usuário;
2. busque esse usuário;
3. edite o telefone;
4. desative e reative o usuário;
5. oculte o registro e depois o restaure;
6. como ADMIN, crie uma conta em “Equipe e acessos” e altere seu perfil.

O caminho do cadastro é:

```text
Componente React
  -> TanStack Query mutation
  -> POST /api/usuarios
  -> controller
  -> service
  -> validator
  -> repository
  -> PostgreSQL
  -> HTTP 201
  -> cache invalidado
  -> lista renderizada novamente
```

## 2. Entenda os dados antes da tela

Abra `database/01_criar_tabela.sql`.

- `id` identifica cada linha.
- `NOT NULL` impede dados obrigatórios ausentes.
- `UNIQUE` impede CPF e e-mail duplicados.
- `DEFAULT CURRENT_TIMESTAMP` registra quando a linha nasceu.

Experimente no PostgreSQL:

```sql
SELECT * FROM usuarios ORDER BY data_cadastro DESC;
```

## 3. Siga o back-end por camadas

Leia nesta ordem:

1. `backend/src/routes/usuarioRoutes.js` — associa método e endereço;
2. `backend/src/controllers/usuarioController.js` — traduz HTTP;
3. `backend/src/services/usuarioService.js` — aplica regras de negócio;
4. `backend/src/validation/usuarioValidator.js` — normaliza e valida;
5. `backend/src/repositories/postgresUsuarioRepository.js` — executa SQL;
6. `backend/src/middlewares/tratadorErros.js` — converte falhas em respostas.

As camadas existem para evitar um arquivo gigante que saiba HTTP, regra e SQL ao
mesmo tempo. Arquivo gigante parece produtivo até precisar ser testado.

## 4. Entenda a API REST

| Ação | Método | Rota | Resposta |
|---|---|---|---:|
| Listar | `GET` | `/api/usuarios` | `200` |
| Consultar | `GET` | `/api/usuarios/:id` | `200` |
| Cadastrar | `POST` | `/api/usuarios` | `201` |
| Atualizar | `PUT` | `/api/usuarios/:id` | `200` |
| Ocultar | `DELETE` | `/api/usuarios/:id` | `204` |
| Listar ocultos | `GET` | `/api/usuarios/ocultos` | `200` |
| Restaurar | `PATCH` | `/api/usuarios/:id/restaurar` | `200` |
| Desativar | `PATCH` | `/api/usuarios/:id/desativar` | `200` |
| Ativar | `PATCH` | `/api/usuarios/:id/ativar` | `200` |

O método continua sendo `DELETE` porque essa é a operação do contrato REST. A
implementação usa `UPDATE data_exclusao = CURRENT_TIMESTAMP`: a API oculta o
recurso sem destruir a linha.

Desativar é diferente de ocultar. O usuário desativado permanece na listagem com
um status visível. A operação atualiza `ativo` e `data_desativacao`; a restrição
do PostgreSQL impede combinações incoerentes entre esses campos.

Abra o navegador, pressione `F12`, entre em **Network** e repita uma operação.
Inspecione `Request Payload`, `Status Code` e `Response`.

## 5. Comece o React pelo ponto de entrada

Leia:

1. `frontend/src/main.tsx`;
2. `frontend/src/App.tsx` — configuração, sessão e navegação;
3. `frontend/src/components/UsersWorkspace.tsx` — CRUD de usuários;
4. `frontend/src/components/TeamPage.tsx` — contas e permissões;
5. `frontend/src/types/user.ts`.

`main.tsx` cria a aplicação e fornece o `QueryClient`. `App.tsx` coordena os
estados da página. `user.ts` define o formato que TypeScript espera dos dados.

Quando o back-end muda um nome de campo, o tipo ajuda a encontrar no front-end
os pontos que precisam mudar.

## 6. Estude a comunicação com a API

Abra `frontend/src/lib/api.ts`.

A função `request` centraliza:

- cabeçalho JSON;
- tempo máximo de espera;
- leitura do corpo;
- mensagens de erro;
- tratamento da resposta `204`, que não possui corpo.

Depois procure `useQuery` e `useMutation` em `App.tsx`, `UsersWorkspace.tsx` e
`TeamPage.tsx`:

- `useQuery` busca e guarda a lista em cache;
- `useMutation` cria, atualiza, oculta ou restaura;
- `invalidateQueries` marca a lista como desatualizada e busca dados novos.

## 7. Estude o formulário tipado

Leia:

1. `frontend/src/lib/userSchema.ts`;
2. `frontend/src/components/UserFormDialog.tsx`.

O Zod descreve as regras do formulário. O React Hook Form registra os campos e
mostra os erros. Antes do envio, CPF e telefone perdem a máscara.

Importante: a API valida tudo novamente. Validação no navegador melhora a
experiência; validação no servidor protege o sistema.

## 8. Estude busca, ordenação e paginação

Abra `frontend/src/lib/userUtils.ts` e depois
`frontend/src/components/UserDataPanel.tsx`.

- A API valida os parâmetros de busca, ordenação e página.
- O repositório executa `LIMIT` e `OFFSET` no PostgreSQL.
- `useDeferredValue` mantém a digitação responsiva antes da nova consulta.

## 9. Estude os componentes visuais

Leia `frontend/src/components` nesta ordem:

1. `Button.tsx` — componente reutilizável e tipado;
2. `Topbar.tsx` e `Metrics.tsx` — componentes de apresentação;
3. `UserDataPanel.tsx` — tabela e controles;
4. `UserFormDialog.tsx` — criação e edição;
5. `SetupPage.tsx` e `TeamPage.tsx` — primeiro acesso e gestão da equipe;
6. `ConfirmDialog.tsx` e `Toast.tsx` — ocultação, restauração e retornos.

Os tokens, cores, espaçamentos e estados estão documentados em `DESIGN.md` e
implementados em `frontend/src/styles.css`.

## 10. Entenda os testes

Execute:

```powershell
npm test
```

No back-end:

- testes de validação provam entradas válidas e inválidas;
- testes do service isolam regras de negócio;
- testes da aplicação exercitam as rotas HTTP.

No front-end:

- formatadores provam máscaras e datas;
- `userSchema` prova o formulário;
- `userUtils` prova busca, ordenação e métricas.
- `operatorSchema` e `SetupPage` provam o primeiro acesso e as contas individuais.

O teste Docker é diferente: `docker compose up --build -d` prova a imagem,
as migrações, as dependências e os healthchecks trabalhando em conjunto.

Rode também:

```powershell
npm run typecheck
npm run build
```

Teste verifica comportamento. TypeScript verifica contratos. Build prova que a
versão de produção pode ser gerada. São verificações diferentes.

## 11. Exercícios para continuar aprendendo

Faça um por vez e escreva um teste antes da alteração:

1. adicione filtro por faixa de idade;
2. crie uma página de detalhes do usuário;
3. adicione paginação por cursor;
4. crie um painel de auditoria para ADMIN e AUDITOR;
5. adicione métricas e logs estruturados usando ferramentas gratuitas;
6. migre a API para Python/FastAPI preservando os mesmos testes de contrato.

## 12. Versione com intenção

```powershell
git add .
git commit -m "feat: adiciona filtro por faixa de idade"
```

O commit deve contar uma mudança compreensível. “Final agora vai 3” conta apenas
uma história de sofrimento; o Git merece fatos.

## 13. Checklist de entrega

- preencha autor e link do repositório no `README.md`;
- confirme que `backend/.env` não aparece no Git;
- execute `npm run typecheck`, `npm test` e `npm run build`;
- teste primeiro acesso, gestão de equipe, cadastro, busca, edição, exportação,
  ativação, desativação, ocultação, restauração e exclusão permanente;
- confira desktop e celular;
- publique apenas depois de testar o build de produção.
