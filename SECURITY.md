# Política de segurança

## Versões suportadas

| Versão | Suporte |
|---|---|
| `5.x` | Atualizações de segurança |
| `< 5.0` | Sem suporte |

## Relato responsável

Use o canal privado
[Report a vulnerability](https://github.com/LuKeTempestt/nexo-pessoas/security/advisories/new).
Não abra uma issue pública com credenciais, dados pessoais ou instruções de
exploração. Inclua impacto, passos mínimos, versão e evidências sanitizadas.

## Credenciais

O projeto não possui login, senha ou token padrão. O primeiro administrador é
criado pela interface. Segredos locais ficam em `backend/.env`; segredos de
produção ficam no painel do provedor.

Nunca publique `DATABASE_URL`, `SETUP_TOKEN`, cookies, hashes ou tokens Upstash.
Se um segredo aparecer em commit, revogue-o no provedor; apagá-lo apenas do
arquivo não remove o histórico Git.

## Dados pessoais

A instância pública é uma demonstração e deve receber apenas dados fictícios.
CPF, telefone e nascimento exigem definição de finalidade, base legal,
retenção, controle de acesso e atendimento ao titular antes de uso real. A
licença do código não equivale a conformidade LGPD.

## Controles implementados

- hash `scrypt` com salt aleatório;
- sessão `HttpOnly`, `Secure` em produção e proteção CSRF;
- autorização por perfil no backend;
- SQL parametrizado e constraints no PostgreSQL;
- rate limit compartilhado via Redis, obrigatório em produção;
- configuração produtiva validada antes de a API iniciar;
- hosts permitidos validados pelo backend;
- exclusão definitiva restrita e auditada;
- contêineres não privilegiados e filesystem somente leitura;
- mensagens de erro sem stack trace ou detalhes de infraestrutura;
- CodeQL e atualização automatizada de dependências no GitHub.

## Escopo atual

Este é um produto de portfólio, não um serviço de identidade certificado. Uma
implantação real ainda deve definir backup, retenção, observabilidade, resposta
a incidentes, criptografia de campos e revisão periódica de acesso. As lacunas
técnicas conhecidas são mantidas em [docs/ROADMAP.md](./docs/ROADMAP.md).
