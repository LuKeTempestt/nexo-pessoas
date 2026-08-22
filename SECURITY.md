# Segurança

## Credenciais

O projeto não possui login, senha ou token padrão. O primeiro administrador é
criado pela interface. Segredos locais ficam em `backend/.env`; segredos de
produção ficam no painel do provedor.

Nunca publique `DATABASE_URL`, `SETUP_TOKEN`, cookies, hashes ou tokens Upstash.
Se um segredo aparecer em commit, revogue-o no provedor; apagá-lo apenas do
arquivo não remove o histórico Git.

## Relato responsável

Não abra uma issue pública com dados pessoais, credenciais ou instruções de
exploração. Use o canal privado de reporte de segurança do GitHub quando
habilitado no repositório.

## Controles implementados

- hash `scrypt` com salt aleatório;
- sessão `HttpOnly`, `Secure` em produção e proteção CSRF;
- autorização por perfil no backend;
- SQL parametrizado e constraints no PostgreSQL;
- limite de tentativas compartilhado via Redis;
- exclusão definitiva restrita e auditada;
- contêineres não privilegiados e filesystem somente leitura;
- mensagens de erro sem stack trace ou detalhes de infraestrutura.
