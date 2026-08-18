-- Migração DOWN: remove o suporte à exclusão lógica.
-- Use apenas em rollback planejado; as datas de exclusão serão perdidas.
BEGIN;

DROP INDEX IF EXISTS idx_usuarios_ocultos_data;
DROP INDEX IF EXISTS idx_usuarios_ativos_id;

ALTER TABLE usuarios
    DROP COLUMN IF EXISTS data_exclusao;

COMMIT;
