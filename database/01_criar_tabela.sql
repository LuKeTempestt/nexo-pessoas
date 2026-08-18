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
