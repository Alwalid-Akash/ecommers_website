// Separate file = separate process, so the limiter starts with a clean count.
process.env.AUTH_RATE_LIMIT_MAX = "3";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { db, start, stop, request } = require("./helpers");

before(start);
after(stop);

test("login is rate limited after too many attempts", async () => {
  db.handler = () => ({ rows: [] }); // every attempt = unknown user = 401

  const statuses = [];
  for (let i = 0; i < 4; i++) {
    const res = await request("POST", "/api/auth/login", {
      body: { email: "attacker@test.com", password: "guess" + i },
    });
    statuses.push(res.status);
  }

  assert.deepEqual(statuses, [401, 401, 401, 429]);
});
