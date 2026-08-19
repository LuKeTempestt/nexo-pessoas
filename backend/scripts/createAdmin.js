require("dotenv").config({ quiet: true });

const { randomUUID } = require("node:crypto");
const database = require("../src/config/database");
const { hashPassword } = require("../src/security/passwords");

async function main() {
  const nome = String(process.env.ADMIN_NAME ?? "").trim();
  const email = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD ?? "");
  if (nome.length < 3 || !email.includes("@") || password.length < 12) {
    throw new Error("Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (mínimo de 12 caracteres).");
  }
  const passwordHash = await hashPassword(password);
  await database.query(
    `INSERT INTO operadores (id, nome, email, senha_hash, perfil)
     VALUES ($1, $2, $3, $4, 'ADMIN')
     ON CONFLICT (email) DO UPDATE SET nome = EXCLUDED.nome, senha_hash = EXCLUDED.senha_hash,
       perfil = 'ADMIN', ativo = TRUE`,
    [randomUUID(), nome, email, passwordHash]
  );
  console.log(`Administrador ${email} preparado com sucesso.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => database.end());
