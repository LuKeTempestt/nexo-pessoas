const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/AppError");
const createOperatorService = require("../src/services/operatorService");

const ACTOR = Object.freeze({
  id: "97186d79-5551-4710-b596-4fde0cc9c506",
  nome: "Admin",
  email: "admin@exemplo.com",
  role: "ADMIN",
  ativo: true
});

test("administrador cria uma conta individual de operador", async () => {
  // Given
  let persisted = null;
  const repository = {
    async createOperator(operator) {
      persisted = operator;
      return { ...operator, ativo: true, dataCadastro: "2026-08-21T12:00:00.000Z" };
    }
  };
  const service = createOperatorService(repository);

  // When
  const created = await service.create({
    nome: "Pessoa Operadora",
    email: "OPERADOR@EXEMPLO.COM",
    password: "Senha-segura-123",
    role: "OPERADOR"
  }, ACTOR);

  // Then
  assert.equal(created.email, "operador@exemplo.com");
  assert.equal(created.passwordHash, undefined);
  assert.equal(persisted.passwordHash.startsWith("scrypt$"), true);
});

test("administrador não pode desativar a própria conta", async () => {
  // Given
  const service = createOperatorService({});

  // When / Then
  await assert.rejects(
    () => service.setActive(ACTOR.id, false, ACTOR),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /própria conta/i);
      return true;
    }
  );
});

test("repositório informa quando a alteração removeria o último administrador", async () => {
  // Given
  const repository = {
    async updateRoleSafely() { return { status: "last_admin" }; }
  };
  const service = createOperatorService(repository);

  // When / Then
  await assert.rejects(
    () => service.changeRole("0fc4b35c-3813-487f-b5ec-7ac7776af1bd", "AUDITOR", ACTOR),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 409);
      assert.match(error.message, /último administrador/i);
      return true;
    }
  );
});
