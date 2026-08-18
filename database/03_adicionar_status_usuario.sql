-- Migração UP: adiciona ativação e desativação sem ocultar o usuário.
BEGIN;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS data_desativacao TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_usuarios_status_ativo'
    ) THEN
        ALTER TABLE usuarios
            ADD CONSTRAINT ck_usuarios_status_ativo
            CHECK (
                (ativo = TRUE AND data_desativacao IS NULL)
                OR
                (ativo = FALSE AND data_desativacao IS NOT NULL)
            );
    END IF;
END $$;

COMMIT;
