const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/AppError");
const createAuthService = require("../src/services/authService");
const { hashPassword } = require("../src/security/passwords");

test("login cria sessão para credenciais válidas", async () => {
  // Given
  const passwordHash = await hashPassword("uma-senha-forte-123");
  let sessionCreated = false;
  const repository = {
    async findOperatorByEmail() {
      return {
        id: "97186d79-5551-4710-b596-4fde0cc9c506",
        nome: "Administradora",
        email: "admin@exemplo.com",
        passwordHash,
        role: "ADMIN",
        ativo: true
      };
    },
    async createSession() {
      sessionCreated = true;
    }
  };
  const service = createAuthService(repository);

  // When
  const result = await service.login({
    email: "ADMIN@EXEMPLO.COM",
    password: "uma-senha-forte-123"
  });

  // Then
  assert.equal(result.operator.role, "ADMIN");
  assert.equal(typeof result.token, "string");
  assert.equal(typeof result.csrfToken, "string");
  assert.equal(sessionCreated, true);
});

test("login rejeita senha incorreta sem revelar qual campo falhou", async () => {
  // Given
  const passwordHash = await hashPassword("uma-senha-forte-123");
  const repository = {
    async findOperatorByEmail() {
      return { passwordHash, ativo: true };
    }
  };
  const service = createAuthService(repository);

  // When / Then
  await assert.rejects(
    () => service.login({ email: "admin@exemplo.com", password: "errada" }),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 401);
      assert.equal(error.message, "E-mail ou senha inválidos.");
      return true;
    }
  );
});

test("permissões reservam exclusão permanente ao administrador", () => {
  // Given
  const service = createAuthService({});

  // When / Then
  assert.equal(service.can("ADMIN", "users:permanent-delete"), true);
  assert.equal(service.can("OPERADOR", "users:permanent-delete"), false);
  assert.equal(service.can("AUDITOR", "users:permanent-delete"), false);
  assert.equal(service.can("AUDITOR", "audit:read"), true);
});
