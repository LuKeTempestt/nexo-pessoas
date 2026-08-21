const { randomUUID } = require("node:crypto");

const AppError = require("../errors/AppError");
const { hashPassword } = require("../security/passwords");
const {
  parseOperatorInput,
  parseOperatorId,
  parsePasswordInput,
  parseRole
} = require("../validation/operatorValidator");

function resultOrError(result) {
  if (result.status === "not_found") throw new AppError("Conta de acesso não encontrada.", 404);
  if (result.status === "last_admin") throw new AppError("Não é possível remover o último administrador ativo.", 409);
  if (result.status === "self") throw new AppError("Você não pode bloquear ou rebaixar a própria conta.", 409);
  return result.operator;
}

function createOperatorService(repository, auditRepository = null) {
  async function audit(actor, action, operator, details = {}) {
    if (!auditRepository) return;
    await auditRepository.record({
      actor,
      action,
      entity: "OPERADOR",
      details: { operatorId: operator.id, operatorEmail: operator.email, ...details }
    });
  }

  return {
    async list() {
      return repository.findAllOperators();
    },

    async create(input, actor) {
      const parsed = parseOperatorInput(input);
      const operator = await repository.createOperator({
        id: randomUUID(),
        nome: parsed.nome,
        email: parsed.email,
        passwordHash: await hashPassword(parsed.password),
        role: parsed.role
      });
      await audit(actor, "OPERADOR_CRIADO", operator, { role: operator.role });
      const { passwordHash, ...safeOperator } = operator;
      return safeOperator;
    },

    async changeRole(inputId, inputRole, actor) {
      const id = parseOperatorId(inputId);
      const role = parseRole(inputRole);
      const result = await repository.updateRoleSafely({ id, role, actorId: actor.id });
      const operator = resultOrError(result);
      await audit(actor, "OPERADOR_PERFIL_ALTERADO", operator, { role });
      return operator;
    },

    async setActive(inputId, active, actor) {
      const id = parseOperatorId(inputId);
      if (id === actor.id && !active) {
        throw new AppError("Você não pode desativar a própria conta.", 409);
      }
      const result = await repository.setActiveSafely({ id, active, actorId: actor.id });
      const operator = resultOrError(result);
      await audit(actor, active ? "OPERADOR_ATIVADO" : "OPERADOR_DESATIVADO", operator);
      return operator;
    },

    async resetPassword(inputId, input, actor) {
      const id = parseOperatorId(inputId);
      const password = parsePasswordInput(input);
      const operator = await repository.updateOperatorPassword(id, await hashPassword(password));
      if (!operator) throw new AppError("Conta de acesso não encontrada.", 404);
      await audit(actor, "OPERADOR_SENHA_REDEFINIDA", operator);
      return operator;
    },

    async revokeSessions(inputId, actor) {
      const id = parseOperatorId(inputId);
      if (id === actor.id) {
        throw new AppError("Use a opção Sair para encerrar a sua própria sessão.", 409);
      }
      const operator = await repository.revokeOperatorSessions(id);
      if (!operator) throw new AppError("Conta de acesso não encontrada.", 404);
      await audit(actor, "OPERADOR_SESSOES_REVOGADAS", operator);
    }
  };
}

module.exports = createOperatorService;
