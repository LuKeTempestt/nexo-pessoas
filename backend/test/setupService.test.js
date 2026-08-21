const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/AppError");
const createSetupService = require("../src/services/setupService");

test("configuração inicial cria o primeiro administrador no modo local", async () => {
  // Given
  let created = null;
  const repository = {
    async hasAdministrator() { return false; },
    async createFirstAdministrator(operator) { created = operator; return operator; }
  };
  const service = createSetupService(repository, { mode: "local" });

  // When
  const result = await service.createAdministrator({
    nome: "Administrador local",
    email: "ADMIN@EXEMPLO.COM",
    password: "Senha-local-123"
  });

  // Then
  assert.equal(result.email, "admin@exemplo.com");
  assert.equal(result.role, "ADMIN");
  assert.equal(created.passwordHash.startsWith("scrypt$"), true);
});

test("configuração inicial exige o código correto no modo protegido", async () => {
  // Given
  const repository = { async hasAdministrator() { return false; } };
  const service = createSetupService(repository, { mode: "token", token: "codigo-secreto-de-configuracao" });

  // When / Then
  await assert.rejects(
    () => service.createAdministrator({
      nome: "Administrador",
      email: "admin@exemplo.com",
      password: "Senha-segura-123",
      setupToken: "codigo-incorreto"
    }),
    (error) => {
      assert.equal(error instanceof AppError, true);
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test("configuração inicial fica indisponível depois do primeiro administrador", async () => {
  // Given
  const repository = { async hasAdministrator() { return true; } };
  const service = createSetupService(repository, { mode: "local" });

  // When
  const status = await service.status();

  // Then
  assert.deepEqual(status, { available: false, requiresToken: false, configured: true });
});
