function createUsuarioController(service) {
  return {
    async listar(request, response, next) {
      try {
        const users = await service.listar();
        response.status(200).json(users);
      } catch (error) {
        next(error);
      }
    },

    async listarOcultos(request, response, next) {
      try {
        const users = await service.listarOcultos();
        response.status(200).json(users);
      } catch (error) {
        next(error);
      }
    },

    async buscarPorId(request, response, next) {
      try {
        const user = await service.buscarPorId(request.params.id);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async cadastrar(request, response, next) {
      try {
        const user = await service.cadastrar(request.body);
        response.status(201).json(user);
      } catch (error) {
        next(error);
      }
    },

    async atualizar(request, response, next) {
      try {
        const user = await service.atualizar(
          request.params.id,
          request.body
        );
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async excluir(request, response, next) {
      try {
        await service.excluir(request.params.id);
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    async restaurar(request, response, next) {
      try {
        const user = await service.restaurar(request.params.id);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async desativar(request, response, next) {
      try {
        const user = await service.desativar(request.params.id);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async ativar(request, response, next) {
      try {
        const user = await service.ativar(request.params.id);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = createUsuarioController;
