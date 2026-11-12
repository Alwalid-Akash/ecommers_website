// Test helpers: start the real Express app against a FAKE database.
// No Postgres needed: each test decides what the "database" returns.
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

const path = require("node:path");
const jwt = require("jsonwebtoken");

// ---------- fake pg pool ----------
// Every query is recorded in `calls`. `handler(sql, params)` decides the result.
const db = {
  calls: [],
  handler: () => ({ rows: [], rowCount: 0 }),
  reset() {
    this.calls = [];
    this.handler = () => ({ rows: [], rowCount: 0 });
  },
};

const run = async (sql, params) => {
  db.calls.push({ sql: sql.replace(/\s+/g, " ").trim(), params });
  const result = await db.handler(sql.replace(/\s+/g, " ").trim(), params);
  return { rowCount: result.rows?.length ?? 0, ...result };
};

const fakePool = {
  query: run,
  connect: async () => ({ query: run, release: () => {} }),
  end: async () => {},
};

// Put the fake into Node's module cache BEFORE the app loads config/db.js.
const dbPath = path.join(__dirname, "..", "src", "config", "db.js");
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakePool };

const app = require("../src/app");

// ---------- tiny HTTP client ----------
let server;
let baseUrl;

async function start() {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve); // port 0 = any free port
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

async function stop() {
  await new Promise((resolve) => server.close(resolve));
}

async function request(method, url, { body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(baseUrl + url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return { status: response.status, body: await response.json() };
}

const tokenFor = (user) =>
  jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });

const customerToken = () =>
  tokenFor({ id: 1, email: "customer@test.com", role: "customer" });
const adminToken = () =>
  tokenFor({ id: 2, email: "admin@test.com", role: "admin" });

module.exports = { db, start, stop, request, tokenFor, customerToken, adminToken };
