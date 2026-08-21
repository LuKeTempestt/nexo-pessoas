const AppError = require("../errors/AppError");

const ROLES = Object.freeze(["ADMIN", "OPERADOR", "AUDITOR"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOperatorInput(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AppError("Envie os dados da conta.", 400);
  }

  const nome = String(input.nome ?? "").trim();
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");
  const role = String(input.role ?? "").toUpperCase();

  if (nome.length < 3 || nome.length > 120) {
    throw new AppError("O nome deve ter entre 3 e 120 caracteres.", 400);
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Informe um e-mail válido.", 400);
  }
  if (password.length < 12) {
    throw new AppError("A senha deve ter pelo menos 12 caracteres.", 400);
  }
  if (!ROLES.includes(role)) {
    throw new AppError("Selecione um perfil de acesso válido.", 400);
  }

  return { nome, email, password, role };
}

function parseRole(value) {
  const role = String(value ?? "").toUpperCase();
  if (!ROLES.includes(role)) {
    throw new AppError("Selecione um perfil de acesso válido.", 400);
  }
  return role;
}

function parseOperatorId(value) {
  const id = String(value ?? "").trim();
  if (!UUID_PATTERN.test(id)) {
    throw new AppError("Identificador da conta inválido.", 400);
  }
  return id;
}

function parsePasswordInput(input) {
  const password = String(input?.password ?? "");
  if (password.length < 12) {
    throw new AppError("A senha deve ter pelo menos 12 caracteres.", 400);
  }
  return password;
}

module.exports = { ROLES, parseOperatorInput, parseOperatorId, parsePasswordInput, parseRole };
