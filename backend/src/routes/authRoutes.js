const express = require("express");

function createAuthRoutes(controller, auth, loginRateLimit) {
  const router = express.Router();
  router.post("/login", loginRateLimit, controller.login);
  router.get("/me", auth.authenticate, controller.me);
  router.post("/logout", auth.authenticate, auth.requireCsrf, controller.logout);
  return router;
}

module.exports = createAuthRoutes;
