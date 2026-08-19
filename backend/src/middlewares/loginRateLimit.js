const AppError = require("../errors/AppError");

function createLoginRateLimit({ limit = 5, windowMs = 15 * 60 * 1000 } = {}) {
  const attempts = new Map();
  return (request, response, next) => {
    const key = request.ip;
    const now = Date.now();
    const current = attempts.get(key);
    response.once("finish", () => {
      if (response.statusCode < 400) attempts.delete(key);
    });
    if (!current || current.resetAt <= now) {
      attempts.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > limit) {
      next(new AppError("Muitas tentativas de acesso. Tente novamente mais tarde.", 429));
      return;
    }
    next();
  };
}

module.exports = createLoginRateLimit;
