const { createHash, randomBytes } = require("node:crypto");
const AppError = require("../errors/AppError");
const { verifyPassword } = require("../security/passwords");

const permissions = Object.freeze({
  ADMIN: new Set(["users:read", "users:write", "users:permanent-delete", "audit:read"]),
  OPERADOR: new Set(["users:read", "users:write"]),
  AUDITOR: new Set(["users:read", "audit:read"])
});

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseLogin(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("Envie e-mail e senha.", 400);
  }
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    throw new AppError("E-mail ou senha inválidos.", 401);
  }
  return { email, password };
}

function createAuthService(repository) {
  return {
    can(role, permission) {
      return permissions[role]?.has(permission) ?? false;
    },

    async login(input) {
      const credentials = parseLogin(input);
      const operator = await repository.findOperatorByEmail(credentials.email);
      const valid = operator?.ativo
        ? await verifyPassword(credentials.password, operator.passwordHash)
        : false;
      if (!valid) throw new AppError("E-mail ou senha inválidos.", 401);

      const token = randomBytes(32).toString("base64url");
      const csrfToken = randomBytes(24).toString("base64url");
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      await repository.createSession({
        tokenHash: digest(token), csrfHash: digest(csrfToken),
        operatorId: operator.id, expiresAt
      });
      const { passwordHash, ...safeOperator } = operator;
      return { operator: safeOperator, token, csrfToken, expiresAt };
    },

    async getSession(token) {
      if (!token) throw new AppError("Autenticação necessária.", 401);
      const session = await repository.findSessionByTokenHash(digest(token));
      if (!session || !session.operator.ativo) {
        throw new AppError("Sessão inválida ou expirada.", 401);
      }
      return session;
    },

    async issueCsrf(token) {
      const session = await this.getSession(token);
      const csrfToken = randomBytes(24).toString("base64url");
      await repository.updateCsrf(session.tokenHash, digest(csrfToken));
      return { operator: session.operator, csrfToken };
    },

    verifyCsrf(session, csrfToken) {
      return Boolean(csrfToken) && digest(csrfToken) === session.csrfHash;
    },

    async logout(token) {
      if (token) await repository.deleteSession(digest(token));
    }
  };
}

module.exports = createAuthService;
