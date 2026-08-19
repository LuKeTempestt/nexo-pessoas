function createPostgresUsuarioRepository(database) {
  const returningFields = `
    id,
    nome,
    email,
    cpf,
    telefone,
    data_nascimento::text AS "dataNascimento",
    data_cadastro AS "dataCadastro",
    ativo,
    data_desativacao AS "dataDesativacao",
    data_exclusao AS "dataExclusao"
  `;

  return {
    async findPage({ hidden, query, sort, limit, offset }) {
      const hiddenClause = hidden
        ? "data_exclusao IS NOT NULL"
        : "data_exclusao IS NULL";
      const orderBy = {
        recent: hidden ? "data_exclusao DESC" : "id DESC",
        oldest: hidden ? "data_exclusao ASC" : "id ASC",
        "name-asc": "nome ASC, id DESC",
        "name-desc": "nome DESC, id DESC"
      }[sort] ?? "id DESC";
      const pattern = `%${query}%`;
      const filter = `
        ${hiddenClause}
        AND (nome ILIKE $1 OR email ILIKE $1 OR cpf ILIKE $1
          OR telefone ILIKE $1 OR id::text ILIKE $1)`;
      const count = await database.query(
        `SELECT COUNT(*)::int AS total FROM usuarios WHERE ${filter}`, [pattern]
      );
      const result = await database.query(
        `SELECT ${returningFields} FROM usuarios WHERE ${filter}
         ORDER BY ${orderBy} LIMIT $2 OFFSET $3`, [pattern, limit, offset]
      );
      return { items: result.rows, total: Number(count.rows[0].total) };
    },

    async summary() {
      const result = await database.query(`
        SELECT COUNT(*) FILTER (WHERE data_exclusao IS NULL)::int AS total,
               COUNT(*) FILTER (WHERE data_exclusao IS NULL AND ativo)::int AS active,
               COUNT(*) FILTER (WHERE data_exclusao IS NOT NULL)::int AS hidden
        FROM usuarios
      `);
      return result.rows[0];
    },
    async findAll() {
      const result = await database.query(`
        SELECT ${returningFields}
        FROM usuarios
        WHERE data_exclusao IS NULL
        ORDER BY id DESC
      `);

      return result.rows;
    },

    async findAllDeleted() {
      const result = await database.query(`
        SELECT ${returningFields}
        FROM usuarios
        WHERE data_exclusao IS NOT NULL
        ORDER BY data_exclusao DESC
      `);

      return result.rows;
    },

    async findById(id) {
      const result = await database.query(
        `SELECT ${returningFields}
         FROM usuarios
         WHERE id = $1
           AND data_exclusao IS NULL`,
        [id]
      );

      return result.rows[0] ?? null;
    },

    async create(user) {
      const values = [
        user.nome,
        user.email,
        user.cpf,
        user.telefone,
        user.dataNascimento
      ];

      const result = await database.query(
        `INSERT INTO usuarios (
           nome,
           email,
           cpf,
           telefone,
           data_nascimento
         )
         VALUES ($1, $2, $3, $4, $5)
         RETURNING ${returningFields}`,
        values
      );

      return result.rows[0];
    },

    async update(id, user) {
      const values = [
        user.nome,
        user.email,
        user.cpf,
        user.telefone,
        user.dataNascimento,
        id
      ];

      const result = await database.query(
        `UPDATE usuarios
         SET nome = $1,
             email = $2,
             cpf = $3,
             telefone = $4,
             data_nascimento = $5
         WHERE id = $6
           AND data_exclusao IS NULL
         RETURNING ${returningFields}`,
        values
      );

      return result.rows[0] ?? null;
    },

    async softDelete(id) {
      const result = await database.query(
        `UPDATE usuarios
         SET data_exclusao = CURRENT_TIMESTAMP
         WHERE id = $1
           AND data_exclusao IS NULL`,
        [id]
      );

      return result.rowCount > 0;
    },

    async permanentDelete(id) {
      const result = await database.query(
        `DELETE FROM usuarios
         WHERE id = $1 AND data_exclusao IS NOT NULL
         RETURNING id, nome, email`, [id]
      );
      return result.rows[0] ?? null;
    },

    async restore(id) {
      const result = await database.query(
        `UPDATE usuarios
         SET data_exclusao = NULL
         WHERE id = $1
           AND data_exclusao IS NOT NULL
         RETURNING ${returningFields}`,
        [id]
      );

      return result.rows[0] ?? null;
    },

    async deactivate(id) {
      const result = await database.query(
        `UPDATE usuarios
         SET ativo = FALSE,
             data_desativacao = CURRENT_TIMESTAMP
         WHERE id = $1
           AND data_exclusao IS NULL
           AND ativo = TRUE
         RETURNING ${returningFields}`,
        [id]
      );

      return result.rows[0] ?? null;
    },

    async activate(id) {
      const result = await database.query(
        `UPDATE usuarios
         SET ativo = TRUE,
             data_desativacao = NULL
         WHERE id = $1
           AND data_exclusao IS NULL
           AND ativo = FALSE
         RETURNING ${returningFields}`,
        [id]
      );

      return result.rows[0] ?? null;
    }
  };
}

module.exports = createPostgresUsuarioRepository;
