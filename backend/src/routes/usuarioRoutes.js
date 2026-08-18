const express = require("express");

function createUsuarioRoutes(controller) {
  const router = express.Router();

  router.get("/", controller.listar);
  router.get("/ocultos", controller.listarOcultos);
  router.get("/:id", controller.buscarPorId);
  router.post("/", controller.cadastrar);
  router.put("/:id", controller.atualizar);
  router.delete("/:id", controller.excluir);
  router.patch("/:id/restaurar", controller.restaurar);
  router.patch("/:id/desativar", controller.desativar);
  router.patch("/:id/ativar", controller.ativar);

  return router;
}

module.exports = createUsuarioRoutes;
