const express = require("express");

function createUsuarioRoutes(controller, auth = null) {
  const router = express.Router();
  const pass = (request, response, next) => next();
  const authenticate = auth?.authenticate ?? pass;
  const csrf = auth?.requireCsrf ?? pass;
  const read = auth?.authorize("users:read") ?? pass;
  const write = auth?.authorize("users:write") ?? pass;
  const permanent = auth?.authorize("users:permanent-delete") ?? pass;

  router.use(authenticate);

  router.get("/", read, controller.listar);
  router.get("/ocultos", read, controller.listarOcultos);
  router.get("/resumo", read, controller.resumo);
  router.get("/:id", read, controller.buscarPorId);
  router.post("/", csrf, write, controller.cadastrar);
  router.put("/:id", csrf, write, controller.atualizar);
  router.delete("/:id", csrf, write, controller.excluir);
  router.delete("/:id/permanente", csrf, permanent, controller.excluirPermanentemente);
  router.patch("/:id/restaurar", csrf, write, controller.restaurar);
  router.patch("/:id/desativar", csrf, write, controller.desativar);
  router.patch("/:id/ativar", csrf, write, controller.ativar);

  return router;
}

module.exports = createUsuarioRoutes;
