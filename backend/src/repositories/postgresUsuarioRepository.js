function createPostgresUsuarioRepository(database) {
  const returningFields = `
    id,
    nome,
    email,
    cpf,
    telefone,
    data_nascimento::text AS "dataNascimento",
    data_cadastro AS "dataCadastro"
  `;

  return {
    async findAll() {
      const result = await database.query(`
        SELECT ${returningFields}
        FROM usuarios
        ORDER BY id DESC
      `);

      return result.rows;
    },

    async findById(id) {
      const result = await database.query(
        `SELECT ${returningFields}
         FROM usuarios
         WHERE id = $1`,
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
         RETURNING ${returningFields}`,
        values
      );

      return result.rows[0] ?? null;
    },

    async remove(id) {
      const result = await database.query(
        "DELETE FROM usuarios WHERE id = $1",
        [id]
      );

      return result.rowCount > 0;
    }
  };
}

module.exports = createPostgresUsuarioRepository;

