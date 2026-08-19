function createPostgresAuthRepository(database) {
  return {
    async findOperatorByEmail(email) {
      const result = await database.query(
        `SELECT id, nome, email, senha_hash AS "passwordHash", perfil AS role, ativo
         FROM operadores WHERE email = $1`, [email]
      );
      return result.rows[0] ?? null;
    },
    async createSession(session) {
      await database.query(
        `INSERT INTO sessoes (token_hash, csrf_hash, operador_id, expira_em)
         VALUES ($1, $2, $3, $4)`,
        [session.tokenHash, session.csrfHash, session.operatorId, session.expiresAt]
      );
    },
    async findSessionByTokenHash(tokenHash) {
      const result = await database.query(
        `SELECT s.token_hash AS "tokenHash", s.csrf_hash AS "csrfHash",
                o.id, o.nome, o.email, o.perfil AS role, o.ativo
         FROM sessoes s JOIN operadores o ON o.id = s.operador_id
         WHERE s.token_hash = $1 AND s.expira_em > CURRENT_TIMESTAMP`, [tokenHash]
      );
      const row = result.rows[0];
      if (!row) return null;
      return {
        tokenHash: row.tokenHash,
        csrfHash: row.csrfHash,
        operator: { id: row.id, nome: row.nome, email: row.email, role: row.role, ativo: row.ativo }
      };
    },
    async updateCsrf(tokenHash, csrfHash) {
      await database.query(
        `UPDATE sessoes SET csrf_hash = $2, ultimo_uso_em = CURRENT_TIMESTAMP
         WHERE token_hash = $1`, [tokenHash, csrfHash]
      );
    },
    async deleteSession(tokenHash) {
      await database.query("DELETE FROM sessoes WHERE token_hash = $1", [tokenHash]);
    }
  };
}

module.exports = createPostgresAuthRepository;
