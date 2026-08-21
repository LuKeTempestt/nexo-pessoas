# Nexo Pessoas

Produto full stack para gerenciamento seguro de usuários. A aplicação oferece
interface React responsiva, API REST em camadas, autenticação por sessão,
perfis de acesso, auditoria e persistência PostgreSQL.

## Funcionalidades

- Cadastro, consulta, edição e exclusão lógica de usuários.
- Busca por nome, e-mail, CPF, telefone ou ID.
- Ordenação por data ou nome e paginação no cliente.
- Exportação dos resultados filtrados em CSV.
- Métricas reais de total e usuários ativos.
- Máscaras brasileiras de CPF e telefone.
- Validação compartilhada no formulário com Zod e validação independente na API.
- Estados de carregamento, erro, vazio e ausência de resultados.
- Área de usuários ocultos com restauração do cadastro.
- Ativação e desativação sem retirar o usuário da lista principal.
- Exclusão permanente opcional, restrita a administradores e somente após ocultação.
- Login seguro e perfis `ADMIN`, `OPERADOR` e `AUDITOR`.
- Configuração inicial guiada pela própria aplicação, sem credenciais padrão.
- Área administrativa para criar contas individuais, trocar perfil, ativar ou
  desativar acessos, redefinir senhas e revogar sessões.
- Paginação, busca e ordenação executadas no servidor.
- Trilha de auditoria para todas as alterações de usuários.
- Redis para limitar tentativas de autenticação de forma compartilhada.
- Ambiente Docker completo com aplicação, PostgreSQL, Redis, migrações e healthchecks.
- Pipeline no GitHub Actions com tipos, testes, build e gancho de deploy.
- Confirmação para ocultação, mensagens de retorno e navegação por teclado.
- Layout responsivo em tabela no desktop e cartões no celular.

## Tecnologias

### Front-end

- React 19 e TypeScript.
- Vite 7 para desenvolvimento e build.
- TanStack Query para cache e sincronização com a API.
- React Hook Form e Zod para formulários tipados.
- Lucide React para ícones.
- Vitest e Testing Library para testes.

### Back-end e banco

- Node.js 22 e Express 5.
- PostgreSQL 17 e driver `pg`.
- Redis 8 para controles temporários de segurança.
- Docker Compose para executar toda a solução localmente.
- `node:test` e Supertest para testes de unidade e integração.

## Qual é o front-end e qual é o back-end?

- **Front-end:** a pasta `frontend/`. É a aplicação React/TypeScript que aparece
  no navegador: login, formulário, tabela, botões e confirmações.
- **Back-end:** a pasta `backend/`. É a API Node.js/Express que autentica,
  verifica permissões, valida dados, registra auditoria e executa operações no banco.
- **Banco de dados:** a pasta `database/` contém a estrutura e as migrações do PostgreSQL.

O navegador nunca acessa o banco diretamente. Toda operação atravessa a API.

## Arquitetura

```mermaid
flowchart LR
    UI[React + TypeScript] -->|HTTPS / JSON| AUTH[Autenticação e permissões]
    AUTH --> API[Express REST]
    API --> C[Controllers]
    C --> S[Services]
    S --> V[Validação]
    S --> R[Repositories]
    R --> DB[(PostgreSQL)]
    S --> AUD[(Auditoria)]
```

A interface não contém explicações acadêmicas. O estudo do código está no
[Guia passo a passo](./GUIA_PASSO_A_PASSO.md), e as decisões estruturais estão
em [Arquitetura](./docs/ARQUITETURA.md).

## Estrutura

```text
crud-usuarios/
├── backend/
│   ├── src/
│   │   ├── config/          # Conexão com PostgreSQL
│   │   ├── controllers/     # Entrada e saída HTTP
│   │   ├── errors/          # Erros conhecidos
│   │   ├── middlewares/     # Tratamento central de erros
│   │   ├── infrastructure/  # Integrações, como o limitador Redis
│   │   ├── repositories/    # Consultas SQL
│   │   ├── routes/          # Rotas REST
│   │   ├── services/        # Regras de negócio
│   │   └── validation/      # Normalização e validação
│   └── test/
├── database/                # Criação e migrações SQL reversíveis
├── docs/                    # Documentação técnica
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── lib/             # API, validação e utilitários
│   │   ├── test/            # Configuração de testes
│   │   ├── types/           # Tipos do domínio
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── vite.config.ts
├── compose.yaml
├── DESIGN.md
└── package.json
```

## Execução mais simples: Docker

Esse é o caminho recomendado para conhecer o produto. Ele exige apenas o
[Docker Desktop](https://www.docker.com/products/docker-desktop/) e não requer
conta em nuvem, serviço pago, Node.js ou PostgreSQL instalados na máquina.

Na pasta do projeto, execute:

```powershell
docker compose up --build -d
```

Depois, abra [http://localhost:3000](http://localhost:3000). No primeiro acesso,
a própria aplicação solicitará nome, e-mail e senha do administrador. Não há
login ou senha padrão no repositório.

Para conferir a saúde dos serviços e encerrar a aplicação:

```powershell
docker compose ps
docker compose down
```

`docker compose down` preserva os dados. O volume PostgreSQL só é removido com
`docker compose down -v`; esse segundo comando apaga o banco local e não deve ser
usado quando houver dados importantes.

### O que o Docker inicia

| Serviço | Responsabilidade |
|---|---|
| `app` | Front-end React compilado e API Express, na porta `3000` |
| `database` | PostgreSQL persistente, disponível localmente na porta `5433` |
| `redis` | Limitação compartilhada de tentativas de login, sem porta pública |
| `migrate` | Aplica os scripts SQL e encerra após a conclusão |

Os serviços usam healthchecks e dependências explícitas. A aplicação roda como
usuário sem privilégios, sem capacidades Linux e com o sistema de arquivos do
contêiner em modo somente leitura.

Se a porta `3000` estiver ocupada, escolha outra sem editar arquivos:

```powershell
$env:APP_PORT=3001
docker compose up --build -d
```

## Desenvolvimento sem Docker para a aplicação

### Pré-requisitos

- Node.js 22 ou superior.
- Docker Desktop.
- Git.

### 1. Prepare o projeto

Na raiz:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
```

Se o npm apresentar `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, use os certificados
confiáveis do Windows sem desativar a verificação TLS:

```powershell
$env:NODE_OPTIONS='--use-system-ca'
npm install
```

### 2. Inicie as dependências

```powershell
docker compose up -d database redis
```

O PostgreSQL é publicado na porta `5433` para evitar conflito com instalações
locais que usam `5432`.

### 3. Inicie front-end e API

```powershell
npm run dev
```

- Interface Vite: `http://localhost:5173`
- API Express: `http://localhost:3000`

O Vite encaminha chamadas `/api` para o Express durante o desenvolvimento.
Abra a interface e crie o primeiro administrador pela tela. A senha é
transformada em hash com `scrypt`; ela não é salva em texto puro.

## Como executar o build de produção

```powershell
npm run build
npm start
```

Abra `http://localhost:3000`. Nesse modo, o Express entrega os arquivos
otimizados gerados em `frontend/dist`.

## Qualidade

```powershell
npm run typecheck
npm test
npm run build
```

No GitHub Actions, `npm run test:ci` usa o isolamento nativo do Linux. O comando
local mantém uma opção compatível com a restrição de criação de processos deste Windows.

Os comandos verificam tipos, regras de negócio, rotas HTTP, validadores,
formatadores, busca, ordenação e build de produção.

## Rotas da API

| Método | Rota | Sucesso | Descrição |
|---|---|---:|---|
| `GET` | `/api/saude` | `200` | Verifica a API |
| `GET` | `/api/saude/prontidao` | `200` | Verifica API, PostgreSQL e Redis |
| `GET` | `/api/setup/status` | `200` | Informa se falta criar o primeiro administrador |
| `POST` | `/api/setup/administrator` | `201` | Cria o primeiro ADMIN uma única vez |
| `POST` | `/api/auth/login` | `200` | Inicia sessão |
| `GET` | `/api/auth/me` | `200` | Consulta a sessão |
| `POST` | `/api/auth/logout` | `204` | Encerra a sessão |
| `GET` | `/api/usuarios` | `200` | Lista usuários |
| `GET` | `/api/usuarios/ocultos` | `200` | Lista usuários ocultos |
| `GET` | `/api/usuarios/:id` | `200` | Consulta por ID |
| `POST` | `/api/usuarios` | `201` | Cadastra usuário |
| `PUT` | `/api/usuarios/:id` | `200` | Atualiza usuário |
| `DELETE` | `/api/usuarios/:id` | `204` | Oculta usuário sem apagar |
| `PATCH` | `/api/usuarios/:id/restaurar` | `200` | Restaura usuário oculto |
| `PATCH` | `/api/usuarios/:id/desativar` | `200` | Desativa usuário visível |
| `PATCH` | `/api/usuarios/:id/ativar` | `200` | Reativa usuário desativado |
| `DELETE` | `/api/usuarios/:id/permanente` | `204` | Apaga usuário oculto; somente ADMIN |
| `GET` | `/api/auditoria` | `200` | Consulta eventos; ADMIN e AUDITOR |
| `GET` | `/api/operadores` | `200` | Lista contas de acesso; somente ADMIN |
| `POST` | `/api/operadores` | `201` | Cria conta individual; somente ADMIN |
| `PATCH` | `/api/operadores/:id/perfil` | `200` | Altera perfil e revoga sessões |
| `PATCH` | `/api/operadores/:id/ativar` | `200` | Ativa uma conta de acesso |
| `PATCH` | `/api/operadores/:id/desativar` | `200` | Desativa uma conta e revoga sessões |
| `PATCH` | `/api/operadores/:id/senha` | `200` | Redefine senha e revoga sessões |
| `DELETE` | `/api/operadores/:id/sessoes` | `204` | Encerra sessões da conta |

As listagens aceitam `page`, `pageSize`, `query` e `sort`. Operações de escrita
exigem sessão válida, permissão adequada e o cabeçalho de proteção CSRF.

Exemplo de corpo:

```json
{
  "nome": "Maria da Silva",
  "email": "maria@exemplo.com",
  "cpf": "52998224725",
  "telefone": "11999999999",
  "dataNascimento": "1995-03-15"
}
```

## Regras de negócio

- Nome entre 3 e 120 caracteres.
- E-mail válido com até 254 caracteres.
- CPF válido e único.
- Telefone brasileiro com DDD.
- Data de nascimento existente e não futura.
- E-mail normalizado e único.
- Exclusão é lógica: `data_exclusao` recebe a data da operação.
- Usuários ocultos não aparecem nas consultas normais e podem ser restaurados.
- Usuários desativados permanecem visíveis e podem ser reativados.
- Status e data de desativação obedecem a uma restrição de consistência no banco.

## Segurança e integridade

- Consultas SQL parametrizadas.
- Credenciais fora do Git.
- Restrições `PRIMARY KEY`, `NOT NULL`, `UNIQUE` e `CHECK`.
- Índices parciais separam consultas de usuários ativos e ocultos.
- A exclusão lógica preserva histórico, identidade e possibilidade de restauração.
- A exclusão permanente só aceita registros previamente ocultados e não pode ser desfeita.
- Cookies de sessão são `HttpOnly`, `SameSite=Lax` e `Secure` em produção.
- Senhas usam `scrypt`; tokens de sessão são aleatórios e persistidos apenas como hash.
- Não existem credenciais padrão, compartilhadas ou publicadas no GitHub.
- O primeiro administrador é criado uma única vez; em produção, o fluxo exige
  um `SETUP_TOKEN` secreto definido no ambiente da hospedagem.
- O último administrador ativo e a própria conta autenticada são protegidos
  contra desativação ou rebaixamento acidental.
- Escritas exigem token CSRF e permissões verificadas no servidor.
- Tentativas repetidas de login são limitadas no Redis entre instâncias.
- Cabeçalhos CSP, anti-clickjacking e `nosniff` são enviados pelo servidor.
- Mensagens internas não são expostas ao navegador.
- React escapa conteúdo textual renderizado por padrão.
- A API não confia apenas na validação do front-end.

## Publicação contínua

O workflow `.github/workflows/ci.yml` executa a validação em cada push e pull
request. Para publicar automaticamente após um push em `main`, configure no
GitHub o secret `DEPLOY_HOOK_URL` fornecido pela plataforma de hospedagem.

O `Dockerfile` permite publicar o mesmo artefato em serviços compatíveis com contêiner.

## Projeto de portfólio sem custo obrigatório

Todo o fluxo principal funciona localmente com software gratuito. Nenhuma conta
AWS, Vercel, Neon, Datadog ou outro fornecedor é necessária para executar ou
avaliar o projeto.

O projeto demonstra, dentro do domínio de um CRUD de usuários:

- API REST, HTTP, JSON, validação e códigos de resposta;
- PostgreSQL, SQL parametrizado, restrições e migrações;
- Redis aplicado a um problema real de autenticação;
- autenticação, autorização por perfil, CSRF e auditoria;
- React e TypeScript com interface responsiva;
- Docker multi-stage, Compose, healthchecks, redes e persistência;
- testes automatizados, Git, CI e build reproduzível.

Python é um requisito central de muitas vagas back-end e ainda não é a linguagem
desta API. Uma futura migração controlada do Express para FastAPI pode ser feita
sem mudar o front-end nem o contrato REST; ela deve ser tratada como evolução
separada, não como tecnologia adicionada apenas para constar.

## Repositório

[github.com/LuKeTempestt/nexo-pessoas](https://github.com/LuKeTempestt/nexo-pessoas)

## Autor

Preencha com seu nome antes da entrega.
