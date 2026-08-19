CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    cpf CHAR(11) NOT NULL,
    telefone VARCHAR(11) NOT NULL,
    data_nascimento DATE NOT NULL,
    data_cadastro TIMESTAMP WITH TIME ZONE
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_desativacao TIMESTAMP WITH TIME ZONE,
    data_exclusao TIMESTAMP WITH TIME ZONE,

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
    CONSTRAINT ck_usuarios_nome
        CHECK (char_length(trim(nome)) BETWEEN 3 AND 120),
    CONSTRAINT ck_usuarios_cpf
        CHECK (cpf ~ '^[0-9]{11}$'),
    CONSTRAINT ck_usuarios_telefone
        CHECK (telefone ~ '^[0-9]{10,11}$'),
    CONSTRAINT ck_usuarios_status_ativo
        CHECK (
            (ativo = TRUE AND data_desativacao IS NULL)
            OR
            (ativo = FALSE AND data_desativacao IS NOT NULL)
        )
);

CREATE INDEX IF NOT EXISTS idx_usuarios_ativos_id
    ON usuarios (id DESC)
    WHERE data_exclusao IS NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_ocultos_data
    ON usuarios (data_exclusao DESC)
    WHERE data_exclusao IS NOT NULL;

CREATE TABLE IF NOT EXISTS operadores (
    id UUID PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    perfil VARCHAR(12) NOT NULL CHECK (perfil IN ('ADMIN', 'OPERADOR', 'AUDITOR')),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
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
