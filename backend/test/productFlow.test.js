const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const createApp = require("../src/app");
const { hashPassword } = require("../src/security/passwords");

test("administrador autentica, cadastra, oculta e apaga definitivamente", async () => {
  // Given
  const passwordHash = await hashPassword("senha-segura-de-teste");
  const sessions = new Map();
  const users = [];
  const auditEvents = [];
  const authRepository = {
    async findOperatorByEmail() {
      return { id: "97186d79-5551-4710-b596-4fde0cc9c506", nome: "Admin QA", email: "admin@qa.local", passwordHash, role: "ADMIN", ativo: true };
    },
    async createSession(session) {
      sessions.set(session.tokenHash, { ...session, operator: { id: "97186d79-5551-4710-b596-4fde0cc9c506", nome: "Admin QA", email: "admin@qa.local", role: "ADMIN", ativo: true } });
    },
    async findSessionByTokenHash(tokenHash) {
      const session = sessions.get(tokenHash);
      return session ? { tokenHash, csrfHash: session.csrfHash, operator: session.operator } : null;
    },
    async updateCsrf(tokenHash, csrfHash) { sessions.get(tokenHash).csrfHash = csrfHash; },
    async deleteSession(tokenHash) { sessions.delete(tokenHash); }
  };
  const repository = {
    async findPage({ hidden }) {
      const items = users.filter((user) => hidden === Boolean(user.dataExclusao));
      return { items, total: items.length };
    },
    async summary() { return { total: users.length, active: users.length, hidden: 0 }; },
    async create(input) {
      const created = { id: 1, ...input, ativo: true, dataCadastro: new Date().toISOString(), dataDesativacao: null, dataExclusao: null };
      users.push(created);
      return created;
    },
    async softDelete(id) {
      const user = users.find((item) => item.id === id);
      if (!user) return false;
      user.dataExclusao = new Date().toISOString();
      return true;
    },
    async permanentDelete(id) {
      const index = users.findIndex((item) => item.id === id && item.dataExclusao);
      if (index < 0) return null;
      return users.splice(index, 1)[0];
    }
  };
  const auditRepository = {
    async record(event) { auditEvents.push(event); },
    async findPage() { return { items: auditEvents, total: auditEvents.length }; }
  };
  const app = createApp({ repository, authRepository, auditRepository });

  // When
  const login = await request(app).post("/api/auth/login").send({ email: "admin@qa.local", password: "senha-segura-de-teste" });
  const cookie = login.headers["set-cookie"][0].split(";")[0];
  const csrf = login.body.csrfToken;
  const created = await request(app).post("/api/usuarios").set("Cookie", cookie).set("X-CSRF-Token", csrf).send({ nome: "Maria da Silva", email: "maria@exemplo.com", cpf: "52998224725", telefone: "11999999999", dataNascimento: "1995-03-15" });
  const hidden = await request(app).delete("/api/usuarios/1").set("Cookie", cookie).set("X-CSRF-Token", csrf);
  const deleted = await request(app).delete("/api/usuarios/1/permanente").set("Cookie", cookie).set("X-CSRF-Token", csrf);

  // Then
  assert.equal(login.statusCode, 200);
  assert.equal(created.statusCode, 201);
  assert.equal(hidden.statusCode, 204);
  assert.equal(deleted.statusCode, 204);
  assert.equal(users.length, 0);
  assert.deepEqual(auditEvents.map((event) => event.action), ["USUARIO_CRIADO", "USUARIO_OCULTADO", "USUARIO_APAGADO_PERMANENTEMENTE"]);
});
