const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../src/app");

function createMemoryRepository(initialUsers = []) {
  const users = initialUsers.map((user) => ({
    ativo: true,
    dataDesativacao: null,
    dataExclusao: null,
    ...user
  }));
  let nextId = users.length + 1;

  return {
    async findAll() {
      return users
        .filter((user) => user.dataExclusao === null)
        .map((user) => ({ ...user }));
    },
    async findAllDeleted() {
      return users
        .filter((user) => user.dataExclusao !== null)
        .map((user) => ({ ...user }));
    },
    async findById(id) {
      return users.find((user) => (
        user.id === id && user.dataExclusao === null
      )) ?? null;
    },
    async create(user) {
      const created = {
        id: nextId,
        ...user,
        dataCadastro: "2026-08-18T12:00:00.000Z",
        ativo: true,
        dataDesativacao: null,
        dataExclusao: null
      };
      nextId += 1;
      users.push(created);
      return { ...created };
    },
    async update(id, user) {
      const index = users.findIndex((item) => (
        item.id === id && item.dataExclusao === null
      ));
      if (index === -1) {
        return null;
      }
      users[index] = { ...users[index], ...user };
      return { ...users[index] };
    },
    async softDelete(id) {
      const index = users.findIndex((user) => (
        user.id === id && user.dataExclusao === null
      ));
      if (index === -1) {
        return false;
      }
      users[index].dataExclusao = "2026-08-18T13:00:00.000Z";
      return true;
    },
    async restore(id) {
      const index = users.findIndex((user) => (
        user.id === id && user.dataExclusao !== null
      ));
      if (index === -1) {
        return null;
      }
      users[index].dataExclusao = null;
      return { ...users[index] };
    },
    async deactivate(id) {
      const user = users.find((item) => (
        item.id === id && item.dataExclusao === null && item.ativo
      ));
      if (!user) return null;
      user.ativo = false;
      user.dataDesativacao = "2026-08-18T14:00:00.000Z";
      return { ...user };
    },
    async activate(id) {
      const user = users.find((item) => (
        item.id === id && item.dataExclusao === null && !item.ativo
      ));
      if (!user) return null;
      user.ativo = true;
      user.dataDesativacao = null;
      return { ...user };
    }
  };
}

function validInput() {
  return {
    nome: "Maria da Silva",
    email: "maria@exemplo.com",
    cpf: "52998224725",
    telefone: "11999999999",
    dataNascimento: "1995-03-15"
  };
}

test("GET /api/saude informa que a API está ativa", async () => {
  // Given
  const app = createApp({ repository: createMemoryRepository() });

  // When
  const response = await request(app).get("/api/saude");

  // Then
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: "ok" });
});

test("GET /api/saude/prontidao informa falha de dependência", async () => {
  // Given
  const app = createApp({
    repository: createMemoryRepository(),
    async healthCheck() { throw new Error("dependência indisponível"); }
  });

  // When
  const response = await request(app).get("/api/saude/prontidao");

  // Then
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { status: "indisponivel" });
});

test("POST /api/usuarios cadastra um usuário válido", async () => {
  // Given
  const app = createApp({ repository: createMemoryRepository() });

  // When
  const response = await request(app)
    .post("/api/usuarios")
    .send(validInput());

  // Then
  assert.equal(response.statusCode, 201);
  assert.equal(response.body.id, 1);
  assert.equal(response.body.email, "maria@exemplo.com");
});

test("POST /api/usuarios rejeita dados inválidos", async () => {
  // Given
  const app = createApp({ repository: createMemoryRepository() });

  // When
  const response = await request(app)
    .post("/api/usuarios")
    .send({ nome: "" });

  // Then
  assert.equal(response.statusCode, 400);
  assert.match(response.body.erro, /nome/i);
});

test("GET /api/usuarios/:id devolve 404 para ID ausente", async () => {
  // Given
  const app = createApp({ repository: createMemoryRepository() });

  // When
  const response = await request(app).get("/api/usuarios/99");

  // Then
  assert.equal(response.statusCode, 404);
  assert.match(response.body.erro, /não encontrado/i);
});

test("DELETE /api/usuarios/:id oculta e devolve 204", async () => {
  // Given
  const existing = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z"
  };
  const app = createApp({
    repository: createMemoryRepository([existing])
  });

  // When
  const response = await request(app).delete("/api/usuarios/1");

  // Then
  assert.equal(response.statusCode, 204);
  assert.equal(response.text, "");
});

test("GET /api/usuarios/ocultos lista usuários ocultos", async () => {
  // Given
  const hidden = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z",
    dataExclusao: "2026-08-18T13:00:00.000Z"
  };
  const app = createApp({ repository: createMemoryRepository([hidden]) });

  // When
  const response = await request(app).get("/api/usuarios/ocultos");

  // Then
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.length, 1);
  assert.equal(response.body[0].id, 1);
});

test("PATCH /api/usuarios/:id/restaurar restaura usuário oculto", async () => {
  // Given
  const hidden = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z",
    dataExclusao: "2026-08-18T13:00:00.000Z"
  };
  const app = createApp({ repository: createMemoryRepository([hidden]) });

  // When
  const response = await request(app).patch("/api/usuarios/1/restaurar");

  // Then
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.dataExclusao, null);
});

test("PATCH /api/usuarios/:id/desativar desativa usuário ativo", async () => {
  // Given
  const existing = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z"
  };
  const app = createApp({ repository: createMemoryRepository([existing]) });

  // When
  const response = await request(app).patch("/api/usuarios/1/desativar");

  // Then
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ativo, false);
});

test("PATCH /api/usuarios/:id/ativar ativa usuário desativado", async () => {
  // Given
  const deactivated = {
    id: 1,
    ...validInput(),
    ativo: false,
    dataDesativacao: "2026-08-18T14:00:00.000Z",
    dataCadastro: "2026-08-18T12:00:00.000Z"
  };
  const app = createApp({ repository: createMemoryRepository([deactivated]) });

  // When
  const response = await request(app).patch("/api/usuarios/1/ativar");

  // Then
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.ativo, true);
});
