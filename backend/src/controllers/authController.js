const { COOKIE_NAME, readCookie } = require("../middlewares/auth");

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000
  };
}

function createAuthController(service) {
  return {
    async login(request, response, next) {
      try {
        const result = await service.login(request.body);
        response.cookie(COOKIE_NAME, result.token, cookieOptions());
        response.status(200).json({ operator: result.operator, csrfToken: result.csrfToken });
      } catch (error) { next(error); }
    },
    async me(request, response, next) {
      try {
        const result = await service.issueCsrf(request.auth.token);
        response.status(200).json(result);
      } catch (error) { next(error); }
    },
    async logout(request, response, next) {
      try {
        await service.logout(readCookie(request, COOKIE_NAME));
        response.clearCookie(COOKIE_NAME, cookieOptions());
        response.status(204).send();
      } catch (error) { next(error); }
    }
  };
}

module.exports = createAuthController;
