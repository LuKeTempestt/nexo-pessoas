function createSetupController(service) {
  return {
    async status(request, response, next) {
      try {
        response.status(200).json(await service.status());
      } catch (error) { next(error); }
    },

    async createAdministrator(request, response, next) {
      try {
        const operator = await service.createAdministrator(request.body);
        response.status(201).json(operator);
      } catch (error) { next(error); }
    }
  };
}

module.exports = createSetupController;
