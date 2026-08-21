const express = require("express");

function createSetupRoutes(controller, rateLimit) {
  const router = express.Router();
  router.get("/status", controller.status);
  router.post("/administrator", rateLimit, controller.createAdministrator);
  return router;
}

module.exports = createSetupRoutes;
