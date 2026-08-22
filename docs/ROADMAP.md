# Roadmap técnico

O roadmap registra melhorias verificáveis sem apresentar proposta como recurso
pronto. A prioridade permanece no domínio de gestão de usuários.

## Próximas prioridades

- [ ] Tornar mutação e evento de auditoria uma única transação PostgreSQL.
- [ ] Adotar ledger de migrações e testar upgrade e rollback do schema.
- [ ] Definir política configurável de retenção e anonimização da auditoria.
- [ ] Adicionar testes de integração para serviços, repositórios e permissões.
- [ ] Medir cobertura de testes e estabelecer limite depois de cobrir os fluxos críticos.
- [ ] Adicionar IDs de correlação e logs estruturados sem dados pessoais.
- [ ] Documentar backup, restauração e exercício de recuperação do Neon.

## Fora do escopo deliberadamente

- folha de pagamento, ponto ou recrutamento;
- cobrança, assinatura ou serviços pagos;
- integração com provedores de IA;
- armazenamento de arquivos ou documentos pessoais.

Esses itens aumentariam custo e complexidade sem fortalecer o objetivo central
do projeto: demonstrar um CRUD de usuários seguro, operável e bem testado.
