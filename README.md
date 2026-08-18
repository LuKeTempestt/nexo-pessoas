# Cadastro Cívico — CRUD de Usuários

Aplicação web acadêmica para cadastrar, listar, consultar, editar e excluir
usuários. O projeto separa interface, API REST e banco de dados e contém testes
automatizados da validação, das regras de negócio e das rotas HTTP.

## Tecnologias

- Front-end: HTML semântico, CSS responsivo e JavaScript modular.
- Back-end: Node.js, Express, `pg`, CORS e dotenv.
- Banco de dados: PostgreSQL 17 em Docker.
- Testes: `node:test` e Supertest.
- Controle de versão: Git.

## Funcionalidades

- Cadastro com validação de nome, e-mail, CPF, telefone e nascimento.
- Listagem responsiva em tabela no desktop e cartões no celular.
- Consulta individual por ID.
- Edição no mesmo formulário.
- Exclusão com diálogo de confirmação.
- E-mail e CPF únicos no PostgreSQL.
- Respostas HTTP `200`, `201`, `204`, `400`, `404`, `409` e `500`.
- Mensagens acessíveis e navegação por teclado.

## Estrutura

```text
crud-usuarios/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexão com o PostgreSQL
│   │   ├── controllers/     # Entrada e saída HTTP
│   │   ├── errors/          # Erros conhecidos da aplicação
│   │   ├── middlewares/     # Tratamento central de erros
│   │   ├── repositories/    # Consultas SQL
│   │   ├── routes/          # Endereços da API
│   │   ├── services/        # Regras de negócio
│   │   ├── validation/      # Normalização e validação
│   │   ├── app.js
│   │   └── server.js
│   ├── test/
│   ├── .env.example
│   └── package.json
├── database/
│   ├── 00_criar_banco.sql
│   └── 01_criar_tabela.sql
├── frontend/
│   ├── css/style.css
│   ├── js/
│   └── index.html
├── compose.yaml
├── DESIGN.md
└── GUIA_PASSO_A_PASSO.md
```

## Como executar

### Pré-requisitos

- Node.js 22 ou superior.
- Docker Desktop.
- Git.

### 1. Inicie o PostgreSQL

Na raiz do projeto:

```powershell
docker compose up -d database
```

O banco deste projeto usa a porta `5433`, pois a porta padrão `5432` já estava
ocupada neste computador.

### 2. Configure o back-end

```powershell
cd backend
Copy-Item .env.example .env
npm install
```

No ambiente local já preparado, o arquivo `.env` está configurado. Em outro
computador, confira a senha e os demais valores antes de iniciar.

Se o npm mostrar `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, mantenha a verificação TLS e
use os certificados confiáveis do Windows:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm install
```

Nunca resolva esse erro com `strict-ssl=false`.

### 3. Inicie a aplicação

```powershell
npm start
```

Abra no navegador:

```text
http://localhost:3000
```

Durante o desenvolvimento, use:

```powershell
npm run dev
```

### 4. Execute os testes

```powershell
npm test
```

### 5. Pare o banco

Na raiz do projeto:

```powershell
docker compose down
```

Esse comando para os contêineres sem apagar o volume com os dados.

## Execução sem Docker

Se já houver um PostgreSQL configurado:

1. Execute `database/00_criar_banco.sql` conectado ao banco `postgres`.
2. Conecte-se ao banco `crud_usuarios`.
3. Execute `database/01_criar_tabela.sql`.
4. Ajuste `backend/.env` com host, porta, usuário e senha corretos.

## Rotas da API

| Método | Rota | Sucesso | Descrição |
|---|---|---:|---|
| `GET` | `/api/saude` | `200` | Verifica a API |
| `GET` | `/api/usuarios` | `200` | Lista usuários |
| `GET` | `/api/usuarios/:id` | `200` | Consulta por ID |
| `POST` | `/api/usuarios` | `201` | Cadastra usuário |
| `PUT` | `/api/usuarios/:id` | `200` | Atualiza usuário |
| `DELETE` | `/api/usuarios/:id` | `204` | Exclui usuário |

Exemplo de corpo JSON:

```json
{
  "nome": "Maria da Silva",
  "email": "maria@exemplo.com",
  "cpf": "52998224725",
  "telefone": "11999999999",
  "dataNascimento": "1995-03-15"
}
```

O CPF acima é um exemplo público usado somente em testes.

## Regras de negócio

- Nome: entre 3 e 120 caracteres.
- E-mail: formato válido e no máximo 254 caracteres.
- CPF: 11 dígitos e verificadores válidos.
- Telefone: 10 ou 11 dígitos.
- Nascimento: data existente e não futura.
- CPF e e-mail: não podem se repetir.

## Segurança e integridade

- SQL parametrizado com `$1`, `$2` etc.
- Senha do banco fora do Git.
- Restrições `PRIMARY KEY`, `NOT NULL`, `UNIQUE` e `CHECK`.
- Erros internos não são expostos ao navegador.
- Dados inseridos pelo usuário são renderizados com `textContent`.

## Repositório

O repositório Git local está inicializado e contém o histórico do projeto. O link
remoto deve ser adicionado depois da publicação na conta Git do estudante.

## Autor

Preencha com seu nome antes da entrega.

