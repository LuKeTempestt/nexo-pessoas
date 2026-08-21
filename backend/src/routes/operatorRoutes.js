const express = require("express");

function createOperatorRoutes(controller, auth) {
  const router = express.Router();
  router.use(auth.authenticate, auth.authorize("team:manage"));
  router.get("/", controller.list);
  router.post("/", auth.requireCsrf, controller.create);
  router.patch("/:id/perfil", auth.requireCsrf, controller.changeRole);
  router.patch("/:id/ativar", auth.requireCsrf, controller.activate);
  router.patch("/:id/desativar", auth.requireCsrf, controller.deactivate);
  router.patch("/:id/senha", auth.requireCsrf, controller.resetPassword);
  router.delete("/:id/sessoes", auth.requireCsrf, controller.revokeSessions);
  return router;
}

module.exports = createOperatorRoutes;
