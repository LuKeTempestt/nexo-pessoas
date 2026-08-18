const express = require("express");
const cors = require("cors");
const path = require("node:path");

const createUsuarioService = require("./services/usuarioService");
const createUsuarioController = require("./controllers/usuarioController");
const createUsuarioRoutes = require("./routes/usuarioRoutes");
const tratadorErros = require("./middlewares/tratadorErros");

function createApp({ repository }) {
  const app = express();
  const service = createUsuarioService(repository);
  const controller = createUsuarioController(service);
  const frontendPath = path.resolve(__dirname, "../../frontend");

  app.disable("x-powered-by");
  app.use(cors());
  app.use(express.json());

  app.get("/api/saude", (request, response) => {
    response.status(200).json({ status: "ok" });
  });

  app.use(
    "/api/usuarios",
    createUsuarioRoutes(controller)
  );

  app.use(express.static(frontendPath));

  app.use("/api", (request, response) => {
    response.status(404).json({
      erro: "Rota da API não encontrada."
    });
  });

  app.use(tratadorErros);

  return app;
}

module.exports = createApp;
