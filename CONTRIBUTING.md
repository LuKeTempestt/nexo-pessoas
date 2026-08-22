# Contribuindo com o Nexo Pessoas

Contribuições são bem-vindas quando preservam o foco do produto: gestão segura
do ciclo de vida de usuários. Antes de começar, confira as issues existentes e
descreva mudanças maiores em uma proposta curta.

## Ambiente de desenvolvimento

1. Faça um fork e crie uma branch a partir de `main`.
2. Instale Node.js 22.13+, Python 3.12+, `uv` e Docker Desktop.
3. Execute `npm install` e `uv sync --project backend`.
4. Copie `backend/.env.example` para `backend/.env`.
5. Execute `npm run dev:infra` e, depois, `npm run dev`.

Use apenas dados fictícios. Não inclua credenciais, dumps, CPFs reais, arquivos
`.env` ou capturas com informações pessoais.

## Antes do pull request

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

Inclua testes para mudanças de comportamento. Commits devem ser pequenos,
descritivos e não misturar refatorações sem relação com a proposta.

## Pull request

Explique o problema, a solução, como validou e qualquer risco de banco,
segurança ou compatibilidade. Mudanças no schema precisam de migração e caminho
de reversão. O envio de uma contribuição indica concordância com a licença MIT.
