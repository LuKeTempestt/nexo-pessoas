const AppError = require("../errors/AppError");
const createRateLimitStore = require("../infrastructure/rateLimitStore");

function createLoginRateLimit({ limit = 5, windowMs = 15 * 60 * 1000, store = createRateLimitStore() } = {}) {
  return async (request, response, next) => {
    const key = `${request.ip}:${request.path}`;
    response.once("finish", () => {
      if (response.statusCode < 400) void store.reset(key);
    });
    try {
      const count = await store.increment(key, windowMs);
      if (count > limit) {
        next(new AppError("Muitas tentativas de acesso. Tente novamente mais tarde.", 429));
        return;
      }
      next();
    } catch (error) {
      next(new AppError("O controle de acesso está temporariamente indisponível.", 503));
    }
  };
}

module.exports = createLoginRateLimit;
