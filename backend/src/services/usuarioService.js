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
      const removed = await repository.remove(id);

      if (!removed) {
        throw new AppError("Usuário não encontrado.", 404);
      }
    }
  };
}

module.exports = createUsuarioService;
