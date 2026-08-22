# Deploy pelo painel: Vercel, Neon e Upstash

Este roteiro mantém frontend e backend separados dentro do mesmo projeto e não
exige compra de servidor. Confirme os limites atuais dos planos gratuitos antes
de publicar; provedores podem alterar regras.

## Resultado esperado

```text
Projeto Vercel Nexo Pessoas
├── frontend: React/Vite em /
└── backend: Python/FastAPI em /api
       ├── DATABASE_URL -> Neon PostgreSQL
       └── UPSTASH_*    -> Upstash Redis
```

Configuração pública atual: Vercel Hobby, Neon Free em São Paulo
(`AWS sa-east-1`) e Upstash Free conectado pela integração da Vercel. Nenhum ID,
token ou endereço de banco deve ser documentado no repositório.

## 1. Criar o PostgreSQL no Neon

1. Entre no painel do Neon e crie um projeto no plano gratuito.
2. Abra **SQL Editor**.
3. Execute, nesta ordem, o conteúdo dos arquivos:
   `01_criar_tabela.sql`, `02_adicionar_exclusao_logica.sql`,
   `03_adicionar_status_usuario.sql` e
   `04_adicionar_seguranca_e_auditoria.sql`.
4. Em **Connect**, copie a connection string com pooler. Ela será a
   `DATABASE_URL` da aplicação.
5. Guarde também a conexão direta apenas para futuras migrações. Não coloque
   nenhuma das duas no GitHub.

## 2. Criar o Redis no Upstash

1. Entre no console do Upstash e crie um banco Redis gratuito.
2. Escolha uma região próxima da região usada pelos outros serviços.
3. Copie `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`.
4. Não use o token `READ_ONLY`; o limitador precisa incrementar e excluir chaves.

### Alternativa: integração pelo Marketplace da Vercel

A integração pode criar o recurso gratuito e injetar variáveis `KV_*` e
`REDIS_URL`. O backend usa a API REST do Upstash, portanto crie aliases sensíveis
em Production e Preview:

| Variável do backend | Valor fornecido pela integração |
|---|---|
| `UPSTASH_REDIS_REST_URL` | URL REST do recurso conectado |
| `UPSTASH_REDIS_REST_TOKEN` | token REST de leitura e escrita |

Não copie esses valores para Development ou para o GitHub. O Docker local usa
Redis TCP e não precisa dos segredos da nuvem.

O Redis não guarda usuários nem senhas. Ele contém apenas contadores com prazo de
expiração para limitar tentativas de login e onboarding.

## 3. Importar o GitHub na Vercel

1. No painel da Vercel, selecione **Add New > Project**.
2. Importe `LuKeTempestt/nexo-pessoas`.
3. Mantenha o diretório raiz do repositório.
4. A configuração de `vercel.json` criará:
   - `frontend`, framework Vite, prefixo `/`;
   - `backend`, framework FastAPI, prefixo `/api`.

As regras `rewrites` enviam `/api/*` ao serviço Python e todo o restante ao
serviço React. Não é necessário transformar o backend em JavaScript nem criar
dois projetos Vercel independentes.

## 4. Configurar variáveis na Vercel

Em **Project Settings > Environment Variables**, adicione segredos apenas para
Production e Preview. O ambiente local continua usando Docker:

| Variável | Valor |
|---|---|
| `APP_ENV` | `production` |
| `DATABASE_URL` | conexão pooled copiada do Neon |
| `UPSTASH_REDIS_REST_URL` | URL REST copiada do Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | token REST copiado do Upstash |
| `SESSION_COOKIE_SECURE` | `true` |
| `SETUP_MODE` | `token` |
| `SETUP_TOKEN` | código aleatório com pelo menos 32 caracteres |
| `TRUSTED_HOST` | domínios exatos separados por vírgula em Production; `*.vercel.app` apenas em Preview, cujas URLs mudam por branch |

Não existe login pronto no GitHub. `SETUP_TOKEN` protege somente a criação da
primeira conta. Depois do deploy, a própria tela pedirá nome, e-mail, senha e
esse código. A senha escolhida será o login real do primeiro `ADMIN`.

## 5. Publicar e validar

A integração Git da Vercel cria um Preview para o pull request. O GitHub Actions
executa qualidade, testes, build e o fluxo Docker; após a aprovação desses
checks, o merge em `main` aciona o deploy de Production sem um segundo deploy
hook.

1. Abra a URL de Preview gerada pela Vercel.
2. Confira `/api/saude/prontidao`; a resposta esperada é `{"status":"pronto"}`.
3. Abra `/api/docs` para confirmar o OpenAPI do FastAPI.
4. Na tela principal, crie o primeiro administrador com o `SETUP_TOKEN`.
5. Faça o fluxo: cadastrar, editar, desativar, ativar, ocultar e restaurar.
6. Apague definitivamente somente um cadastro fictício criado para o teste.
7. Faça o merge somente depois de CI, CodeQL e Preview aprovados.

## Custos e limites

O desenho cabe nos planos gratuitos para demonstração pessoal, mas gratuito não
significa infinito. Acompanhe uso nos três painéis e não habilite add-ons pagos,
upgrades automáticos ou serviços fora desta arquitetura. O plano Hobby da
Vercel é destinado a uso pessoal e não comercial.
