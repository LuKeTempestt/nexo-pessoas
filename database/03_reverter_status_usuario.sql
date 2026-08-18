-- Migração DOWN: remove ativação e desativação.
BEGIN;

ALTER TABLE usuarios
    DROP CONSTRAINT IF EXISTS ck_usuarios_status_ativo;

ALTER TABLE usuarios
    DROP COLUMN IF EXISTS data_desativacao,
    DROP COLUMN IF EXISTS ativo;

COMMIT;
