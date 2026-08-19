-- Migração UP: autenticação, perfis, sessões e trilha de auditoria.
BEGIN;

CREATE TABLE IF NOT EXISTS operadores (
    id UUID PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(12) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_operadores_email UNIQUE (email),
    CONSTRAINT ck_operadores_perfil CHECK (perfil IN ('ADMIN', 'OPERADOR', 'AUDITOR'))
);

CREATE TABLE IF NOT EXISTS sessoes (
    token_hash CHAR(64) PRIMARY KEY,
    csrf_hash CHAR(64) NOT NULL,
    operador_id UUID NOT NULL REFERENCES operadores(id) ON DELETE CASCADE,
    criada_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_uso_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessoes_operador ON sessoes (operador_id);
CREATE INDEX IF NOT EXISTS idx_sessoes_expiracao ON sessoes (expira_em);

CREATE TABLE IF NOT EXISTS auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    operador_id UUID REFERENCES operadores(id) ON DELETE SET NULL,
    operador_email VARCHAR(254) NOT NULL,
    acao VARCHAR(64) NOT NULL,
    entidade VARCHAR(32) NOT NULL DEFAULT 'USUARIO',
    entidade_id BIGINT,
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    data_evento TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria (data_evento DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_operador ON auditoria (operador_id);

COMMIT;
