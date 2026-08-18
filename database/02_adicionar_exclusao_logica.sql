-- Migração UP: preserva registros e passa a ocultá-los logicamente.
BEGIN;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS data_exclusao TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_usuarios_ativos_id
    ON usuarios (id DESC)
    WHERE data_exclusao IS NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_ocultos_data
    ON usuarios (data_exclusao DESC)
    WHERE data_exclusao IS NOT NULL;

COMMIT;
