function createOperatorController(service) {
  return {
    async list(request, response, next) {
      try { response.status(200).json(await service.list()); }
      catch (error) { next(error); }
    },
    async create(request, response, next) {
      try {
        const operator = await service.create(request.body, request.auth.session.operator);
        response.status(201).json(operator);
      } catch (error) { next(error); }
    },
    async changeRole(request, response, next) {
      try {
        const operator = await service.changeRole(
          request.params.id,
          request.body?.role,
          request.auth.session.operator
        );
        response.status(200).json(operator);
      } catch (error) { next(error); }
    },
    async activate(request, response, next) {
      try {
        const operator = await service.setActive(request.params.id, true, request.auth.session.operator);
        response.status(200).json(operator);
      } catch (error) { next(error); }
    },
    async deactivate(request, response, next) {
      try {
        const operator = await service.setActive(request.params.id, false, request.auth.session.operator);
        response.status(200).json(operator);
      } catch (error) { next(error); }
    },
    async resetPassword(request, response, next) {
      try {
        const operator = await service.resetPassword(
          request.params.id,
          request.body,
          request.auth.session.operator
        );
        response.status(200).json(operator);
      } catch (error) { next(error); }
    },
    async revokeSessions(request, response, next) {
      try {
        await service.revokeSessions(request.params.id, request.auth.session.operator);
        response.status(204).send();
      } catch (error) { next(error); }
    }
  };
}

module.exports = createOperatorController;
