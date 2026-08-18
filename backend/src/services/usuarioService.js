const AppError = require("../errors/AppError");
const {
  parseUsuarioInput,
  parseId
} = require("../validation/usuarioValidator");

function createUsuarioService(repository) {
  return {
    async listar() {
      return repository.findAll();
    },

    async listarOcultos() {
      return repository.findAllDeleted();
    },

    async buscarPorId(inputId) {
      const id = parseId(inputId);
      const user = await repository.findById(id);

      if (!user) {
        throw new AppError("Usuário não encontrado.", 404);
      }

      return user;
    },

    async cadastrar(input) {
      const user = parseUsuarioInput(input);
      return repository.create(user);
    },

    async atualizar(inputId, input) {
      const id = parseId(inputId);
      const user = parseUsuarioInput(input);
      const updated = await repository.update(id, user);

      if (!updated) {
        throw new AppError("Usuário não encontrado.", 404);
      }

      return updated;
    },

    async excluir(inputId) {
      const id = parseId(inputId);
      const removed = await repository.softDelete(id);

      if (!removed) {
        throw new AppError("Usuário não encontrado.", 404);
      }
    },

    async restaurar(inputId) {
      const id = parseId(inputId);
      const restored = await repository.restore(id);

      if (!restored) {
        throw new AppError("Usuário oculto não encontrado.", 404);
      }

      return restored;
    },

    async desativar(inputId) {
      const id = parseId(inputId);
      const deactivated = await repository.deactivate(id);

      if (!deactivated) {
        throw new AppError("Usuário ativo não encontrado.", 404);
      }

      return deactivated;
    },

    async ativar(inputId) {
      const id = parseId(inputId);
      const activated = await repository.activate(id);

      if (!activated) {
        throw new AppError("Usuário desativado não encontrado.", 404);
      }

      return activated;
    }
  };
}

module.exports = createUsuarioService;
