const { randomUUID, timingSafeEqual } = require("node:crypto");

const AppError = require("../errors/AppError");
const { hashPassword } = require("../security/passwords");
const { parseOperatorInput } = require("../validation/operatorValidator");

function equalSecret(received, expected) {
  const receivedBuffer = Buffer.from(String(received ?? ""));
  const expectedBuffer = Buffer.from(String(expected ?? ""));
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function createSetupService(repository, options = {}) {
  const mode = options.mode === "local" ? "local" : "token";
  const token = String(options.token ?? "");

  return {
    async status() {
      const configured = await repository.hasAdministrator();
      return { available: !configured, requiresToken: mode === "token", configured };
    },

    async createAdministrator(input) {
      if (await repository.hasAdministrator()) {
        throw new AppError("A configuração inicial já foi concluída.", 409);
      }
      if (mode === "token" && (!token || !equalSecret(input?.setupToken, token))) {
        throw new AppError("Código de configuração inválido.", 403);
      }

      const parsed = parseOperatorInput({ ...input, role: "ADMIN" });
      const created = await repository.createFirstAdministrator({
        id: randomUUID(),
        nome: parsed.nome,
        email: parsed.email,
        passwordHash: await hashPassword(parsed.password),
        role: "ADMIN"
      });
      if (!created) {
        throw new AppError("A configuração inicial já foi concluída.", 409);
      }
      return { id: created.id, nome: created.nome, email: created.email, role: "ADMIN", ativo: true };
    }
  };
}

module.exports = createSetupService;
