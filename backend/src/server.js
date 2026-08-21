require("dotenv").config({ quiet: true });

const createApp = require("./app");
const database = require("./config/database");
const createPostgresUsuarioRepository = require(
  "./repositories/postgresUsuarioRepository"
);
const createPostgresAuthRepository = require("./repositories/postgresAuthRepository");
const createPostgresAuditRepository = require("./repositories/postgresAuditRepository");
const createRateLimitStore = require("./infrastructure/rateLimitStore");

const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "127.0.0.1";
const repository = createPostgresUsuarioRepository(database);
const authRepository = createPostgresAuthRepository(database);
const auditRepository = createPostgresAuditRepository(database);
const rateLimitStore = createRateLimitStore(process.env.REDIS_URL);
const setupOptions = {
  mode: process.env.SETUP_MODE === "local" ? "local" : "token",
  token: process.env.SETUP_TOKEN
};
const healthCheck = async () => {
  await Promise.all([database.query("SELECT 1"), rateLimitStore.ping()]);
};
const app = createApp({
  repository,
  authRepository,
  auditRepository,
  setupOptions,
  rateLimitStore,
  healthCheck
});

async function startServer() {
  try {
    await database.query("SELECT 1");
    await rateLimitStore.connect();

    const server = app.listen(port, host, () => {
      console.log(`Aplicação disponível em http://${host}:${port}`);
    });

    async function shutdown() {
      server.close(async () => {
        await database.end();
        await rateLimitStore.close();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Não foi possível conectar ao PostgreSQL.");
    console.error(error.message);
    await database.end();
    await rateLimitStore.close();
    process.exit(1);
  }
}

startServer();
