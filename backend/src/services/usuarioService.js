const AppError = require("../errors/AppError");
const {
  parseUsuarioInput,
  parseId,
  parseListInput
} = require("../validation/usuarioValidator");

function createUsuarioService(repository, auditRepository = null) {
  async function audit(actor, action, entityId, details = {}) {
    if (auditRepository) await auditRepository.record({ actor, action, entityId, details });
  }

  async function page(input, hidden) {
    const options = parseListInput(input);
    const result = await repository.findPage({
      hidden, query: options.query, sort: options.sort,
      limit: options.pageSize, offset: (options.page - 1) * options.pageSize
    });
    return {
      items: result.items, page: options.page, pageSize: options.pageSize,
      total: result.total, totalPages: Math.max(1, Math.ceil(result.total / options.pageSize))
    };
  }

  return {
    async listar(input = {}) {
      return repository.findPage ? page(input, false) : repository.findAll();
    },

    async listarOcultos(input = {}) {
      return repository.findPage ? page(input, true) : repository.findAllDeleted();
    },

    async resumo() {
      return repository.summary();
    },

    async buscarPorId(inputId) {
      const id = parseId(inputId);
      const user = await repository.findById(id);

      if (!user) {
        throw new AppError("Usuário não encontrado.", 404);
      }

      return user;
    },

    async cadastrar(input, actor) {
      const user = parseUsuarioInput(input);
      const created = await repository.create(user);
      await audit(actor, "USUARIO_CRIADO", created.id);
      return created;
    },

    async atualizar(inputId, input, actor) {
      const id = parseId(inputId);
      const user = parseUsuarioInput(input);
      const updated = await repository.update(id, user);

      if (!updated) {
        throw new AppError("Usuário não encontrado.", 404);
      }
      await audit(actor, "USUARIO_ATUALIZADO", id);
      return updated;
    },

    async excluir(inputId, actor) {
      const id = parseId(inputId);
      const removed = await repository.softDelete(id);

      if (!removed) {
        throw new AppError("Usuário não encontrado.", 404);
      }
      await audit(actor, "USUARIO_OCULTADO", id);
    },

    async excluirPermanentemente(inputId, actor) {
      const id = parseId(inputId);
      const removed = await repository.permanentDelete(id);
      if (!removed) throw new AppError("Usuário oculto não encontrado.", 404);
      await audit(actor, "USUARIO_APAGADO_PERMANENTEMENTE", id, {
        nome: removed.nome, email: removed.email
      });
    },

    async restaurar(inputId, actor) {
      const id = parseId(inputId);
      const restored = await repository.restore(id);

      if (!restored) {
        throw new AppError("Usuário oculto não encontrado.", 404);
      }

      await audit(actor, "USUARIO_RESTAURADO", id);
      return restored;
    },

    async desativar(inputId, actor) {
      const id = parseId(inputId);
      const deactivated = await repository.deactivate(id);

      if (!deactivated) {
        throw new AppError("Usuário ativo não encontrado.", 404);
      }

      await audit(actor, "USUARIO_DESATIVADO", id);
      return deactivated;
    },

    async ativar(inputId, actor) {
      const id = parseId(inputId);
      const activated = await repository.activate(id);

      if (!activated) {
        throw new AppError("Usuário desativado não encontrado.", 404);
      }

      await audit(actor, "USUARIO_ATIVADO", id);
      return activated;
    }
  };
}

module.exports = createUsuarioService;
