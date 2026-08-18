const express = require("express");

function createUsuarioRoutes(controller) {
  const router = express.Router();

  router.get("/", controller.listar);
  router.get("/:id", controller.buscarPorId);
  router.post("/", controller.cadastrar);
  router.put("/:id", controller.atualizar);
  router.delete("/:id", controller.excluir);

  return router;
}

module.exports = createUsuarioRoutes;

