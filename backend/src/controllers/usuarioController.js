function createUsuarioController(service) {
  return {
    async listar(request, response, next) {
      try {
        const users = await service.listar(request.query);
        response.status(200).json(users);
      } catch (error) {
        next(error);
      }
    },

    async listarOcultos(request, response, next) {
      try {
        const users = await service.listarOcultos(request.query);
        response.status(200).json(users);
      } catch (error) {
        next(error);
      }
    },

    async resumo(request, response, next) {
      try {
        response.status(200).json(await service.resumo());
      } catch (error) { next(error); }
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
        const user = await service.cadastrar(request.body, request.auth?.session.operator);
        response.status(201).json(user);
      } catch (error) {
        next(error);
      }
    },

    async atualizar(request, response, next) {
      try {
        const user = await service.atualizar(
          request.params.id,
          request.body,
          request.auth?.session.operator
        );
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async excluir(request, response, next) {
      try {
        await service.excluir(request.params.id, request.auth?.session.operator);
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    async excluirPermanentemente(request, response, next) {
      try {
        await service.excluirPermanentemente(
          request.params.id,
          request.auth?.session.operator
        );
        response.status(204).send();
      } catch (error) { next(error); }
    },

    async restaurar(request, response, next) {
      try {
        const user = await service.restaurar(request.params.id, request.auth?.session.operator);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async desativar(request, response, next) {
      try {
        const user = await service.desativar(request.params.id, request.auth?.session.operator);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    },

    async ativar(request, response, next) {
      try {
        const user = await service.ativar(request.params.id, request.auth?.session.operator);
        response.status(200).json(user);
      } catch (error) {
        next(error);
      }
    }
  };
}

module.exports = createUsuarioController;
