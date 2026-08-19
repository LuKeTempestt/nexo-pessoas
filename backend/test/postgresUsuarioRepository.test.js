const test = require("node:test");
const assert = require("node:assert/strict");

const createPostgresUsuarioRepository = require(
  "../src/repositories/postgresUsuarioRepository"
);

test("softDelete usa UPDATE e preserva a linha", async () => {
  // Given
  let executedSql = "";
  const database = {
    async query(sql) {
      executedSql = sql;
      return { rowCount: 1, rows: [] };
    }
  };
  const repository = createPostgresUsuarioRepository(database);

  // When
  const result = await repository.softDelete(1);

  // Then
  assert.equal(result, true);
  assert.match(executedSql, /^\s*UPDATE usuarios/i);
  assert.match(executedSql, /data_exclusao\s*=\s*CURRENT_TIMESTAMP/i);
  assert.doesNotMatch(executedSql, /DELETE FROM/i);
});

test("findAll consulta somente usuários ativos", async () => {
  // Given
  let executedSql = "";
  const database = {
    async query(sql) {
      executedSql = sql;
      return { rows: [] };
    }
  };
  const repository = createPostgresUsuarioRepository(database);

  // When
  await repository.findAll();

  // Then
  assert.match(executedSql, /WHERE data_exclusao IS NULL/i);
});

test("deactivate registra status e data sem ocultar", async () => {
  // Given
  let executedSql = "";
  const database = {
    async query(sql) {
      executedSql = sql;
      return { rows: [{ id: "1", ativo: false }] };
    }
  };
  const repository = createPostgresUsuarioRepository(database);

  // When
  const result = await repository.deactivate(1);

  // Then
  assert.equal(result.ativo, false);
  assert.match(executedSql, /ativo\s*=\s*FALSE/i);
  assert.match(executedSql, /data_desativacao\s*=\s*CURRENT_TIMESTAMP/i);
});

test("permanentDelete apaga somente um usuário previamente ocultado", async () => {
  // Given
  let executedSql = "";
  const database = {
    async query(sql) {
      executedSql = sql;
      return { rows: [{ id: "1", nome: "Maria da Silva" }] };
    }
  };
  const repository = createPostgresUsuarioRepository(database);

  // When
  const deleted = await repository.permanentDelete(1);

  // Then
  assert.equal(deleted.id, "1");
  assert.match(executedSql, /^\s*DELETE FROM usuarios/i);
  assert.match(executedSql, /data_exclusao IS NOT NULL/i);
});

test("findPage aplica paginação e busca no banco", async () => {
  // Given
  const calls = [];
  const database = {
    async query(sql, values) {
      calls.push({ sql, values });
      return calls.length === 1
        ? { rows: [{ total: "12" }] }
        : { rows: [{ id: "9", nome: "Maria da Silva" }] };
    }
  };
  const repository = createPostgresUsuarioRepository(database);

  // When
  const page = await repository.findPage({
    hidden: false,
    query: "maria",
    sort: "name-asc",
    limit: 5,
    offset: 5
  });

  // Then
  assert.equal(page.total, 12);
  assert.equal(page.items[0].id, "9");
  assert.match(calls[1].sql, /LIMIT \$2 OFFSET \$3/i);
  assert.deepEqual(calls[1].values, ["%maria%", 5, 5]);
});
