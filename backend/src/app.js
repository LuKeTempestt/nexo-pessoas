const express = require("express");
const path = require("node:path");

const createUsuarioService = require("./services/usuarioService");
const createUsuarioController = require("./controllers/usuarioController");
const createUsuarioRoutes = require("./routes/usuarioRoutes");
const createAuthRoutes = require("./routes/authRoutes");
const createAuthService = require("./services/authService");
const createAuthController = require("./controllers/authController");
const { createAuthMiddleware } = require("./middlewares/auth");
const createLoginRateLimit = require("./middlewares/loginRateLimit");
const tratadorErros = require("./middlewares/tratadorErros");

function createApp({ repository, authRepository = null, auditRepository = null }) {
  const app = express();
  const service = createUsuarioService(repository, auditRepository);
  const controller = createUsuarioController(service);
  const authService = authRepository ? createAuthService(authRepository) : null;
  const auth = authService ? createAuthMiddleware(authService) : null;
  const frontendPath = path.resolve(__dirname, "../../frontend/dist");

  app.disable("x-powered-by");
  app.use(express.json({ limit: "32kb" }));
  app.use((request, response, next) => {
    response.set({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'"
    });
    next();
  });

  app.get("/api/saude", (request, response) => {
    response.status(200).json({ status: "ok" });
  });

  if (authService) {
    app.use("/api/auth", createAuthRoutes(createAuthController(authService), auth, createLoginRateLimit()));
  }
  app.use("/api/usuarios", createUsuarioRoutes(controller, auth));

  if (auditRepository && auth) {
    app.get("/api/auditoria", auth.authenticate, auth.authorize("audit:read"), async (request, response, next) => {
      try {
        const page = Math.max(1, Number(request.query.page) || 1);
        const result = await auditRepository.findPage({ limit: 20, offset: (page - 1) * 20 });
        response.json({ ...result, page, pageSize: 20, totalPages: Math.max(1, Math.ceil(result.total / 20)) });
      } catch (error) { next(error); }
    });
  }

  app.use(express.static(frontendPath));

  app.get("/{*path}", (request, response, next) => {
    if (request.path.startsWith("/api")) {
      next();
      return;
    }

    response.sendFile(path.join(frontendPath, "index.html"));
  });

  app.use("/api", (request, response) => {
    response.status(404).json({
      erro: "Rota da API não encontrada."
    });
  });

  app.use(tratadorErros);

  return app;
}

module.exports = createApp;
