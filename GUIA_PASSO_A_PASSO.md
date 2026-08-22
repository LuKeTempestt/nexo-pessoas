# Guia de estudo passo a passo

Este guia explica o código na ordem em que uma ação atravessa o produto. A
interface permanece limpa; a aula fica na documentação.

## 1. Entenda as quatro partes

```text
frontend -> backend -> PostgreSQL
                |
                +----> Redis
```

- `frontend/`: React e TypeScript. É o que aparece no navegador.
- `backend/`: Python e FastAPI. Valida, autoriza e executa os casos de uso.
- `database/`: SQL. Define tabelas, constraints, índices e migrações.
- Redis: limita tentativas de acesso; não armazena pessoas.

O frontend nunca executa SQL. O PostgreSQL nunca decide qual botão mostrar. A
API é a fronteira entre esses mundos.

## 2. Rode antes de estudar

Na raiz do projeto:

```powershell
docker compose up --build -d
docker compose ps
```

Abra `http://localhost:3000`. Crie o primeiro administrador pela tela e escolha
uma senha com pelo menos 12 caracteres. Não procure uma senha no README: ela não
existe, por decisão de segurança.

Faça este roteiro manual:

1. cadastre uma pessoa fictícia;
2. busque pelo nome;
3. edite o telefone;
4. desative e reative;
5. oculte e restaure;
6. oculte novamente e teste a exclusão definitiva;
7. crie um operador e um auditor na área de equipe.

Agora você conhece o comportamento antes de abrir a implementação. Ler código
sem saber o que ele deve fazer é arqueologia com pouca luz.

## 3. Comece pelo banco

Abra `database/01_criar_tabela.sql`.

Na tabela `usuarios`:

- `PRIMARY KEY` identifica cada registro;
- `NOT NULL` torna campos obrigatórios;
- `UNIQUE` impede CPF e e-mail duplicados;
- `CHECK` protege formato e coerência do status;
- `data_exclusao` implementa a exclusão lógica;
- `ativo` e `data_desativacao` representam o estado operacional.

Depois leia as tabelas `operadores`, `sessoes` e `auditoria`. Note que a senha
fica em `senha_hash`; o texto original nunca é salvo.

Pergunta para verificar seu entendimento: por que `usuarios` e `operadores` são
tabelas diferentes? Porque uma pessoa cadastrada não precisa ter acesso ao
sistema, e quem opera o sistema não precisa ser um registro gerenciado pelo CRUD.

## 4. Siga um cadastro completo

No React, `frontend/src/lib/api.ts` envia:

```typescript
create: (user) => request("/usuarios", {
  method: "POST",
  body: JSON.stringify(user)
})
```

O helper acrescenta `/api`, o cookie acompanha a requisição e o cabeçalho CSRF
protege a escrita.

No backend, o caminho é:

```text
routes/users.py
  -> services/users.py
  -> validation.py
  -> repositories/users.py
  -> PostgreSQL
```

### Rota

`backend/src/nexo_api/routes/users.py` traduz HTTP. Ela lê o corpo, exige sessão,
CSRF e permissão `users:write`, chama o serviço e devolve `201`.

### Serviço

`backend/src/nexo_api/services/users.py` coordena o caso de uso:

```python
created = await self._users.create(validate_user(raw))
await self._audit.record(actor, "USUARIO_CRIADO", created.id)
return created
```

Aqui estão a regra e a auditoria. Não há SQL nem detalhe de React.

### Validação

`backend/src/nexo_api/validation.py` remove pontuação de CPF e telefone,
normaliza e-mail, confirma data real e futura e calcula os dígitos do CPF.

O frontend também valida para responder rápido, mas a API repete a validação.
Dados enviados por outra ferramenta não passam pelo formulário React.

### Repositório

`backend/src/nexo_api/repositories/users.py` usa SQL parametrizado:

```sql
INSERT INTO usuarios (nome, email, cpf, telefone, data_nascimento)
VALUES (:nome, :email, :cpf, :telefone, :data_nascimento)
RETURNING ...
```

Os valores não são colados na string SQL. Isso reduz risco de injeção e deixa a
responsabilidade da consulta clara.

## 5. Diferencie desativar, ocultar e apagar

- Desativar: mantém a pessoa visível, mas marca `ativo = FALSE`.
- Ocultar: registra `data_exclusao`; a lista principal deixa de mostrar.
- Apagar definitivamente: executa `DELETE` somente sobre registro já oculto e
  somente para `ADMIN`.

Leia, nesta ordem:

1. métodos `deactivate`, `soft_delete` e `permanent_delete` no repositório;
2. casos de uso correspondentes no serviço;
3. endpoints `PATCH` e `DELETE` no roteador;
4. diálogos de confirmação no frontend.

Esse desenho dá reversibilidade por padrão e torna a operação irreversível uma
decisão explícita.

## 6. Entenda o login

O fluxo fica em `backend/src/nexo_api/services/auth.py`:

1. normaliza o e-mail;
2. busca a conta em `operadores`;
3. verifica o hash `scrypt`;
4. gera token de sessão e token CSRF aleatórios;
5. grava somente os hashes dos tokens;
6. envia o token de sessão em cookie `HttpOnly`.

`backend/src/nexo_api/http_auth.py` transforma esse fluxo em dependências do
FastAPI: autenticar, exigir CSRF e exigir uma permissão.

A matriz em `permissions.py` é pequena de propósito. Procure
`users:permanent-delete`: ela aparece apenas no conjunto de `ADMIN`.

## 7. Entenda o primeiro acesso

`GET /api/setup/status` consulta se já existe administrador. Se não existe, o
React mostra `SetupPage.tsx`.

No Docker, `SETUP_MODE=local` aceita o cadastro porque a porta está publicada em
`127.0.0.1`. Em produção, `SETUP_MODE=token` exige `SETUP_TOKEN`. O código serve
para autorizar a criação da primeira conta; ele não vira a senha do usuário.

O repositório usa `pg_advisory_xact_lock`. Mesmo que duas pessoas cliquem ao
mesmo tempo, apenas uma transação cria o primeiro administrador.

## 8. Leia o frontend por responsabilidades

- `App.tsx`: decide entre onboarding, login e área autenticada.
- `UsersWorkspace.tsx`: coordena busca, página, filtros e mutações.
- `UserTable.tsx`: apresenta lista e ações.
- `UserFormDialog.tsx`: cria e edita.
- `TeamPage.tsx`: administra contas de acesso.
- `lib/api.ts`: único ponto de comunicação HTTP.
- `lib/userSchema.ts`: validação imediata do formulário.
- `types/user.ts`: contrato TypeScript esperado da API.

TanStack Query mantém cache e estados de carregamento. Depois de uma mutação, a
consulta é invalidada e os dados voltam do servidor; o componente não tenta
inventar uma cópia paralela do banco.

## 9. Entenda o Docker

`compose.yaml` inicia cinco unidades:

1. `database`: PostgreSQL e volume persistente;
2. `redis`: estado temporário;
3. `migrate`: aplica SQL e encerra;
4. `backend`: imagem Python, porta 8000;
5. `frontend`: imagem Nginx, porta 3000.

O Nginx serve os arquivos React e encaminha `/api` para `backend:8000`. Os dois
contêineres rodam sem privilégios, perdem capabilities Linux e usam filesystem
somente leitura com pequenos `tmpfs` onde necessário.

## 10. Entenda a Vercel

`vercel.json` descreve dois serviços do mesmo projeto:

```json
{
  "services": {
    "frontend": { "root": "frontend/", "framework": "vite" },
    "backend": {
      "root": "backend/",
      "framework": "fastapi",
      "entrypoint": "server:app"
    }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": { "service": "backend" } },
    { "source": "/(.*)", "destination": { "service": "frontend" } }
  ]
}
```

O arquivo `backend/server.py` exporta a instância FastAPI que a Vercel executa
como função Python. O Neon substitui o PostgreSQL local e o Upstash substitui o
Redis TCP. A regra de negócio não muda.

O procedimento pelo painel está em `docs/DEPLOY.md`.

## 11. Execute a qualidade

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

- Ruff verifica estilo e erros comuns do Python.
- BasedPyright verifica tipos do backend.
- Pytest testa regras e contrato HTTP.
- TypeScript verifica o frontend.
- Vitest e Testing Library testam funções e componentes.
- Vite produz o build otimizado.

Depois execute `docker compose up --build -d` e teste
`http://localhost:3000/api/saude/prontidao`. Teste unitário prova uma peça;
smoke test prova que as peças conseguem conversar.

## 12. Exercícios seguros

1. Adicione filtro por status ativo/desativado, começando pelo teste.
2. Exiba auditoria em uma tela somente para `ADMIN` e `AUDITOR`.
3. Troque paginação por offset por cursor e compare o SQL.
4. Crie teste que tente apagar definitivamente sem ocultar antes.
5. Crie teste que tente desativar o último administrador.

Para cada exercício: escreva um teste que falha, implemente o mínimo, faça o
teste passar e só então refatore.
