function createPostgresAuditRepository(database) {
  return {
    async record({ actor, action, entityId, details = {} }) {
      await database.query(
        `INSERT INTO auditoria (operador_id, operador_email, acao, entidade_id, detalhes)
         VALUES ($1, $2, $3, $4, $5)`,
        [actor?.id ?? null, actor?.email ?? "sistema", action, entityId ?? null, details]
      );
    },
    async findPage({ limit, offset }) {
      const count = await database.query("SELECT COUNT(*)::int AS total FROM auditoria");
      const result = await database.query(
        `SELECT id, operador_email AS "operadorEmail", acao,
                entidade_id AS "entidadeId", detalhes, data_evento AS "dataEvento"
         FROM auditoria ORDER BY id DESC LIMIT $1 OFFSET $2`, [limit, offset]
      );
      return { items: result.rows, total: count.rows[0].total };
    }
  };
}

module.exports = createPostgresAuditRepository;
