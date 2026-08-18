const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../src/app");

function createMemoryRepository(initialUsers = []) {
  const users = initialUsers.map((user) => ({ ...user }));
  let nextId = users.length + 1;

  return {
    async findAll() {
      return users.map((user) => ({ ...user }));
    },
    async findById(id) {
      return users.find((user) => user.id === id) ?? null;
    },
    async create(user) {
      const created = {
        id: nextId,
        ...user,
        dataCadastro: "2026-08-18T12:00:00.000Z"
      };
      nextId += 1;
      users.push(created);
      return { ...created };
    },
    async update(id, user) {
      const index = users.findIndex((item) => item.id === id);
      if (index === -1) {
        return null;
      }
      users[index] = { ...users[index], ...user };
      return { ...users[index] };
    },
    async remove(id) {
      const index = users.findIndex((user) => user.id === id);
      if (index === -1) {
        return false;
      }
      users.splice(index, 1);
      return true;
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

test("DELETE /api/usuarios/:id devolve 204", async () => {
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
