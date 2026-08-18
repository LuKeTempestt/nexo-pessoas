const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/AppError");
const createUsuarioService = require("../src/services/usuarioService");

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

test("cadastra e devolve o usuário criado", async () => {
  // Given
  const service = createUsuarioService(createMemoryRepository());

  // When
  const created = await service.cadastrar(validInput());

  // Then
  assert.equal(created.id, 1);
  assert.equal(created.email, "maria@exemplo.com");
});

test("busca um usuário existente por ID", async () => {
  // Given
  const existing = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z"
  };
  const service = createUsuarioService(
    createMemoryRepository([existing])
  );

  // When
  const found = await service.buscarPorId("1");

  // Then
  assert.equal(found.nome, "Maria da Silva");
});

test("devolve 404 ao buscar usuário inexistente", async () => {
  // Given
  const service = createUsuarioService(createMemoryRepository());

  // When / Then
  await assert.rejects(
    () => service.buscarPorId("99"),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 404);
      return true;
    }
  );
});

test("atualiza um usuário existente", async () => {
  // Given
  const existing = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z"
  };
  const service = createUsuarioService(
    createMemoryRepository([existing])
  );
  const update = {
    ...validInput(),
    nome: "Maria Oliveira"
  };

  // When
  const updated = await service.atualizar("1", update);

  // Then
  assert.equal(updated.nome, "Maria Oliveira");
});

test("exclui um usuário existente", async () => {
  // Given
  const existing = {
    id: 1,
    ...validInput(),
    dataCadastro: "2026-08-18T12:00:00.000Z"
  };
  const repository = createMemoryRepository([existing]);
  const service = createUsuarioService(repository);

  // When
  await service.excluir("1");

  // Then
  assert.deepEqual(await repository.findAll(), []);
});
