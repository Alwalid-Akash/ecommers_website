const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db, start, stop, request, tokenFor } = require("./helpers");

before(start);
after(stop);
beforeEach(() => db.reset());

const passwordHash = bcrypt.hashSync("correct-password", 4); // low cost = fast tests
const storedUser = {
  id: 7,
  name: "Ali",
  email: "ali@test.com",
  password: passwordHash,
  role: "customer",
};

test("register rejects invalid input with field errors", async () => {
  const res = await request("POST", "/api/auth/register", {
    body: { name: "A", email: "not-an-email", password: "short" },
  });

  assert.equal(res.status, 400);
  const fields = res.body.errors.map((e) => e.field).sort();
  assert.deepEqual(fields, ["email", "name", "password"]);
  assert.equal(db.calls.length, 0, "invalid input must never reach the database");
});

test("register returns 409 when the email is already taken", async () => {
  db.handler = (sql) =>
    sql.startsWith("SELECT id FROM users") ? { rows: [{ id: 1 }] } : { rows: [] };

  const res = await request("POST", "/api/auth/register", {
    body: { name: "Ali", email: "ali@test.com", password: "password123" },
  });

  assert.equal(res.status, 409);
});

test("register lowercases the email, hashes the password and forces role=customer", async () => {
  db.handler = (sql, params) => {
    if (sql.startsWith("SELECT id FROM users")) return { rows: [] };
    if (sql.startsWith("INSERT INTO users")) {
      return { rows: [{ id: 9, name: params[0], email: params[1], role: "customer" }] };
    }
    return { rows: [] };
  };

  const res = await request("POST", "/api/auth/register", {
    body: { name: "Ali", email: "  Ali@Test.COM ", password: "password123", role: "admin" },
  });

  assert.equal(res.status, 201);
  const insert = db.calls.find((c) => c.sql.startsWith("INSERT INTO users"));
  assert.equal(insert.params[1], "ali@test.com");
  assert.notEqual(insert.params[2], "password123", "password must be hashed");
  assert.ok(bcrypt.compareSync("password123", insert.params[2]));
  assert.match(insert.sql, /'customer'/, "role is hard-coded, never taken from the body");
  assert.ok(res.body.token);
});

test("login gives the same 401 message for unknown email and wrong password", async () => {
  db.handler = () => ({ rows: [] });
  const unknown = await request("POST", "/api/auth/login", {
    body: { email: "nobody@test.com", password: "whatever" },
  });

  db.handler = () => ({ rows: [{ ...storedUser }] });
  const wrongPassword = await request("POST", "/api/auth/login", {
    body: { email: "ali@test.com", password: "wrong-password" },
  });

  assert.equal(unknown.status, 401);
  assert.equal(wrongPassword.status, 401);
  assert.equal(unknown.body.message, wrongPassword.body.message);
});

test("login success returns a token with id, email and role, and never the password", async () => {
  db.handler = () => ({ rows: [{ ...storedUser }] });

  const res = await request("POST", "/api/auth/login", {
    body: { email: "ali@test.com", password: "correct-password" },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.password, undefined);

  const payload = jwt.verify(res.body.token, process.env.JWT_SECRET);
  assert.equal(payload.id, 7);
  assert.equal(payload.email, "ali@test.com");
  assert.equal(payload.role, "customer");
});

test("protected routes reject missing, fake and expired tokens", async () => {
  const missing = await request("GET", "/api/auth/me");
  const fake = await request("GET", "/api/auth/me", { token: "not.a.jwt" });
  const forged = await request("GET", "/api/auth/me", {
    token: jwt.sign({ id: 1, role: "admin" }, "someone-elses-secret"),
  });
  const expired = await request("GET", "/api/auth/me", {
    token: jwt.sign({ id: 1, role: "customer" }, process.env.JWT_SECRET, { expiresIn: -10 }),
  });

  for (const res of [missing, fake, forged, expired]) {
    assert.equal(res.status, 401);
  }
});

test("customers get 403 on admin routes, admins get through", async () => {
  const customer = tokenFor({ id: 1, role: "customer" });
  const admin = tokenFor({ id: 2, role: "admin" });

  const asCustomer = await request("GET", "/api/admin/orders", { token: customer });
  db.handler = () => ({ rows: [] });
  const asAdmin = await request("GET", "/api/admin/orders", { token: admin });

  assert.equal(asCustomer.status, 403);
  assert.equal(asAdmin.status, 200);
});
