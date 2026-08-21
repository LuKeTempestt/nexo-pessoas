const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const createApp = require("../src/app");

test("primeiro acesso cria administrador e libera a gestão da equipe", async () => {
  // Given
  const operators = [];
  const sessions = new Map();
  const authRepository = {
    async hasAdministrator() { return operators.some((operator) => operator.role === "ADMIN"); },
    async createFirstAdministrator(operator) {
      if (operators.some((item) => item.role === "ADMIN")) return null;
      const created = { ...operator, ativo: true, dataCadastro: new Date().toISOString() };
      operators.push(created);
      return created;
    },
    async findOperatorByEmail(email) {
      return operators.find((operator) => operator.email === email) ?? null;
    },
    async createSession(session) {
      const operator = operators.find((item) => item.id === session.operatorId);
      sessions.set(session.tokenHash, { ...session, operator });
    },
    async findSessionByTokenHash(tokenHash) {
      const session = sessions.get(tokenHash);
      return session ? { tokenHash, csrfHash: session.csrfHash, operator: session.operator } : null;
    },
    async updateCsrf(tokenHash, csrfHash) { sessions.get(tokenHash).csrfHash = csrfHash; },
    async deleteSession(tokenHash) { sessions.delete(tokenHash); },
    async findAllOperators() { return operators.map(({ passwordHash, ...operator }) => operator); },
    async createOperator(operator) {
      const created = { ...operator, ativo: true, dataCadastro: new Date().toISOString() };
      operators.push(created);
      return created;
    }
  };
  const userRepository = {
    async findPage() { return { items: [], total: 0 }; },
    async summary() { return { total: 0, active: 0, hidden: 0 }; }
  };
  const app = createApp({ repository: userRepository, authRepository, setupOptions: { mode: "local" } });

  // When
  const before = await request(app).get("/api/setup/status");
  const setup = await request(app).post("/api/setup/administrator").send({
    nome: "Administrador local",
    email: "admin@exemplo.com",
    password: "Senha-segura-123"
  });
  const login = await request(app).post("/api/auth/login").send({
    email: "admin@exemplo.com",
    password: "Senha-segura-123"
  });
  const cookie = login.headers["set-cookie"][0].split(";")[0];
  const csrf = login.body.csrfToken;
  const created = await request(app)
    .post("/api/operadores")
    .set("Cookie", cookie)
    .set("X-CSRF-Token", csrf)
    .send({
      nome: "Pessoa Auditora",
      email: "auditoria@exemplo.com",
      password: "Outra-senha-123",
      role: "AUDITOR"
    });
  const listed = await request(app).get("/api/operadores").set("Cookie", cookie);

  // Then
  assert.deepEqual(before.body, { available: true, requiresToken: false, configured: false });
  assert.equal(setup.statusCode, 201);
  assert.equal(login.statusCode, 200);
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.passwordHash, undefined);
  assert.equal(listed.body.length, 2);
});
