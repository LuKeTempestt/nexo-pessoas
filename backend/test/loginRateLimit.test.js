const test = require("node:test");
const assert = require("node:assert/strict");

const AppError = require("../src/errors/AppError");
const createLoginRateLimit = require("../src/middlewares/loginRateLimit");

test("limitador compartilhado bloqueia a sexta tentativa", async () => {
  // Given
  const store = {
    async increment() { return 6; },
    async reset() {}
  };
  const middleware = createLoginRateLimit({ limit: 5, store });
  const response = { once() {} };
  let receivedError = null;

  // When
  await middleware({ ip: "127.0.0.1", path: "/login" }, response, (error) => {
    receivedError = error;
  });

  // Then
  assert.equal(receivedError instanceof AppError, true);
  assert.equal(receivedError.statusCode, 429);
});
