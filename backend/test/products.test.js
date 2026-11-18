const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { db, start, stop, request, adminToken } = require("./helpers");

before(start);
after(stop);
beforeEach(() => {
  db.reset();
  db.handler = (sql, params) =>
    sql.startsWith("INSERT INTO products") ? { rows: [{ id: 1, image_url: params[5] }] } : { rows: [] };
});

const product = (image_url) => ({ name: "Yoga Mat", price: 24.9, stock: 5, image_url });

test("image can be a path inside the frontend's public folder", async () => {
  const res = await request("POST", "/api/products", {
    token: adminToken(),
    body: product("/images/products/yoga-mat.jpg"),
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.product.image_url, "/images/products/yoga-mat.jpg");
});

test("image can still be a full https link", async () => {
  const res = await request("POST", "/api/products", {
    token: adminToken(),
    body: product("https://images.unsplash.com/photo-123?w=800"),
  });
  assert.equal(res.status, 201);
});

test("anything else is rejected", async () => {
  for (const bad of ["javascript:alert(1)", "images/no-leading-slash.jpg", "/images/has space.jpg", "ftp://x.com/a.jpg"]) {
    const res = await request("POST", "/api/products", { token: adminToken(), body: product(bad) });
    assert.equal(res.status, 400, `${bad} should be rejected`);
  }
  assert.equal(db.calls.length, 0);
});
