function createPostgresAuthRepository(database) {
  const selectOperator = `SELECT id, nome, email, perfil AS role, ativo,
    data_cadastro AS "dataCadastro" FROM operadores`;

  async function withAdministrationLock(action) {
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext('nexo_operator_admin'))");
      const result = await action(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async function findForUpdate(client, id) {
    const result = await client.query(`${selectOperator} WHERE id = $1 FOR UPDATE`, [id]);
    return result.rows[0] ?? null;
  }

  return {
    async hasAdministrator() {
      const result = await database.query(
        "SELECT EXISTS (SELECT 1 FROM operadores WHERE perfil = 'ADMIN') AS configured"
      );
      return result.rows[0].configured;
    },

    async createFirstAdministrator(operator) {
      return withAdministrationLock(async (client) => {
        const existing = await client.query(
          "SELECT EXISTS (SELECT 1 FROM operadores WHERE perfil = 'ADMIN') AS configured"
        );
        if (existing.rows[0].configured) return null;
        const result = await client.query(
          `INSERT INTO operadores (id, nome, email, senha_hash, perfil)
           VALUES ($1, $2, $3, $4, 'ADMIN')
           RETURNING id, nome, email, perfil AS role, ativo, data_cadastro AS "dataCadastro"`,
          [operator.id, operator.nome, operator.email, operator.passwordHash]
        );
        return result.rows[0];
      });
    },

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
    },

    async findAllOperators() {
      const result = await database.query(`${selectOperator} ORDER BY nome ASC, email ASC`);
      return result.rows;
    },

    async createOperator(operator) {
      const result = await database.query(
        `INSERT INTO operadores (id, nome, email, senha_hash, perfil)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, nome, email, senha_hash AS "passwordHash", perfil AS role,
                   ativo, data_cadastro AS "dataCadastro"`,
        [operator.id, operator.nome, operator.email, operator.passwordHash, operator.role]
      );
      return result.rows[0];
    },

    async updateRoleSafely({ id, role, actorId }) {
      return withAdministrationLock(async (client) => {
        const operator = await findForUpdate(client, id);
        if (!operator) return { status: "not_found" };
        if (id === actorId && role !== "ADMIN") return { status: "self" };
        if (operator.ativo && operator.role === "ADMIN" && role !== "ADMIN") {
          const count = await client.query(
            "SELECT COUNT(*)::int AS total FROM operadores WHERE perfil = 'ADMIN' AND ativo = TRUE"
          );
          if (count.rows[0].total <= 1) return { status: "last_admin" };
        }
        if (operator.role === role) return { status: "ok", operator };
        const result = await client.query(
          `UPDATE operadores SET perfil = $2 WHERE id = $1
           RETURNING id, nome, email, perfil AS role, ativo, data_cadastro AS "dataCadastro"`,
          [id, role]
        );
        await client.query("DELETE FROM sessoes WHERE operador_id = $1", [id]);
        return { status: "ok", operator: result.rows[0] };
      });
    },

    async setActiveSafely({ id, active, actorId }) {
      return withAdministrationLock(async (client) => {
        const operator = await findForUpdate(client, id);
        if (!operator) return { status: "not_found" };
        if (id === actorId && !active) return { status: "self" };
        if (operator.ativo && operator.role === "ADMIN" && !active) {
          const count = await client.query(
            "SELECT COUNT(*)::int AS total FROM operadores WHERE perfil = 'ADMIN' AND ativo = TRUE"
          );
          if (count.rows[0].total <= 1) return { status: "last_admin" };
        }
        const result = await client.query(
          `UPDATE operadores SET ativo = $2 WHERE id = $1
           RETURNING id, nome, email, perfil AS role, ativo, data_cadastro AS "dataCadastro"`,
          [id, active]
        );
        if (!active) await client.query("DELETE FROM sessoes WHERE operador_id = $1", [id]);
        return { status: "ok", operator: result.rows[0] };
      });
    },

    async updateOperatorPassword(id, passwordHash) {
      return withAdministrationLock(async (client) => {
        const result = await client.query(
          `UPDATE operadores SET senha_hash = $2 WHERE id = $1
           RETURNING id, nome, email, perfil AS role, ativo, data_cadastro AS "dataCadastro"`,
          [id, passwordHash]
        );
        if (!result.rows[0]) return null;
        await client.query("DELETE FROM sessoes WHERE operador_id = $1", [id]);
        return result.rows[0];
      });
    },

    async revokeOperatorSessions(id) {
      return withAdministrationLock(async (client) => {
        const operator = await findForUpdate(client, id);
        if (!operator) return null;
        await client.query("DELETE FROM sessoes WHERE operador_id = $1", [id]);
        return operator;
      });
    }
  };
}

module.exports = createPostgresAuthRepository;
