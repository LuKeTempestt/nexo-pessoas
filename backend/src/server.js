require("dotenv").config({ quiet: true });

const createApp = require("./app");
const database = require("./config/database");
const createPostgresUsuarioRepository = require(
  "./repositories/postgresUsuarioRepository"
);

const port = Number(process.env.PORT) || 3000;
const repository = createPostgresUsuarioRepository(database);
const app = createApp({ repository });

async function startServer() {
  try {
    await database.query("SELECT 1");

    const server = app.listen(port, () => {
      console.log(`Aplicação disponível em http://localhost:${port}`);
    });

    async function shutdown() {
      server.close(async () => {
        await database.end();
        process.exit(0);
      });
    }

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Não foi possível conectar ao PostgreSQL.");
    console.error(error.message);
    await database.end();
    process.exit(1);
  }
}

startServer();
