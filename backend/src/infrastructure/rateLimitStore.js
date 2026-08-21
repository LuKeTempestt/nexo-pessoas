const { createClient } = require("redis");

function createMemoryStore() {
  const entries = new Map();
  return {
    async connect() {},
    async close() {},
    async ping() { return "PONG"; },
    async increment(key, windowMs) {
      const now = Date.now();
      const current = entries.get(key);
      if (!current || current.resetAt <= now) {
        entries.set(key, { count: 1, resetAt: now + windowMs });
        return 1;
      }
      current.count += 1;
      return current.count;
    },
    async reset(key) { entries.delete(key); }
  };
}

function createRedisStore(url) {
  const client = createClient({ url });
  client.on("error", (error) => console.error("Falha na conexão com o Redis.", error.message));
  return {
    async connect() { if (!client.isOpen) await client.connect(); },
    async close() { if (client.isOpen) await client.quit(); },
    async ping() { return client.ping(); },
    async increment(key, windowMs) {
      const namespacedKey = `nexo:rate-limit:${key}`;
      const count = await client.incr(namespacedKey);
      if (count === 1) await client.pExpire(namespacedKey, windowMs);
      return count;
    },
    async reset(key) { await client.del(`nexo:rate-limit:${key}`); }
  };
}

function createRateLimitStore(url) {
  return url ? createRedisStore(url) : createMemoryStore();
}

module.exports = createRateLimitStore;
