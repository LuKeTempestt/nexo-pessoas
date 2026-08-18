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

    CONSTRAINT pk_usuarios PRIMARY KEY (id),
    CONSTRAINT uq_usuarios_email UNIQUE (email),
    CONSTRAINT uq_usuarios_cpf UNIQUE (cpf),
    CONSTRAINT ck_usuarios_nome
        CHECK (char_length(trim(nome)) BETWEEN 3 AND 120),
    CONSTRAINT ck_usuarios_cpf
        CHECK (cpf ~ '^[0-9]{11}$'),
    CONSTRAINT ck_usuarios_telefone
        CHECK (telefone ~ '^[0-9]{10,11}$')
);

