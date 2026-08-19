-- Migração DOWN: remove autenticação e auditoria.
BEGIN;
DROP TABLE IF EXISTS auditoria;
DROP TABLE IF EXISTS sessoes;
DROP TABLE IF EXISTS operadores;
COMMIT;
