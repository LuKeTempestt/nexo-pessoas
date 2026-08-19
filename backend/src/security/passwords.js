const { promisify } = require("node:util");
const { randomBytes, scrypt, timingSafeEqual } = require("node:crypto");

const scryptAsync = promisify(scrypt);
const KEY_LENGTH = 64;
const COST = 16384;

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH, { N: COST });
  return `scrypt$${COST}$${salt}$${derived.toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, cost, salt, expectedHex] = String(storedHash).split("$");
  if (algorithm !== "scrypt" || Number(cost) !== COST || !salt || !expectedHex) {
    return false;
  }

  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scryptAsync(password, salt, expected.length, { N: COST });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

module.exports = { hashPassword, verifyPassword };
