const AppError = require("../errors/AppError");

const COOKIE_NAME = "nexo_session";

function readCookie(request, name) {
  const cookies = String(request.headers.cookie ?? "").split(";");
  const pair = cookies.map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null;
}

function createAuthMiddleware(service) {
  return {
    async authenticate(request, response, next) {
      try {
        const token = readCookie(request, COOKIE_NAME);
        request.auth = { token, session: await service.getSession(token) };
        next();
      } catch (error) { next(error); }
    },
    requireCsrf(request, response, next) {
      const csrfToken = request.get("X-CSRF-Token");
      if (!service.verifyCsrf(request.auth.session, csrfToken)) {
        next(new AppError("Token de segurança inválido.", 403));
        return;
      }
      next();
    },
    authorize(permission) {
      return (request, response, next) => {
        const role = request.auth.session.operator.role;
        if (!service.can(role, permission)) {
          next(new AppError("Você não tem permissão para esta ação.", 403));
          return;
        }
        next();
      };
    }
  };
}

module.exports = { COOKIE_NAME, readCookie, createAuthMiddleware };
