const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { db, start, stop, request, customerToken, adminToken } = require("./helpers");

before(start);
after(stop);
beforeEach(() => db.reset());

// ---------- cart ----------

test("cart rejects bad quantities before touching the database", async () => {
  for (const quantity of ["abc", 0, -3, 1.5, 1000]) {
    const res = await request("POST", "/api/cart", {
      token: customerToken(),
      body: { product_id: 5, quantity },
    });
    assert.equal(res.status, 400, `quantity ${JSON.stringify(quantity)} should be rejected`);
  }
  assert.equal(db.calls.length, 0);
});

test('cart adds numbers, not strings ("1" + "2" must be 3, not "12")', async () => {
  db.handler = (sql) => {
    if (sql.startsWith("SELECT id, stock FROM products")) return { rows: [{ id: 5, stock: 50 }] };
    if (sql.startsWith("SELECT quantity FROM cart_items")) return { rows: [{ quantity: 1 }] };
    if (sql.startsWith("INSERT INTO cart_items")) return { rows: [{ quantity: 3 }] };
    return { rows: [] };
  };

  const res = await request("POST", "/api/cart", {
    token: customerToken(),
    body: { product_id: "5", quantity: "2" },
  });

  assert.equal(res.status, 200);
  const upsert = db.calls.find((c) => c.sql.startsWith("INSERT INTO cart_items"));
  assert.equal(upsert.params[2], 3);
});

test("cart refuses more than the available stock", async () => {
  db.handler = (sql) => {
    if (sql.startsWith("SELECT id, stock FROM products")) return { rows: [{ id: 5, stock: 2 }] };
    if (sql.startsWith("SELECT quantity FROM cart_items")) return { rows: [{ quantity: 2 }] };
    return { rows: [] };
  };

  const res = await request("POST", "/api/cart", {
    token: customerToken(),
    body: { product_id: 5, quantity: 1 },
  });

  assert.equal(res.status, 400);
});

test("cart queries are always scoped to the logged-in user", async () => {
  db.handler = () => ({ rows: [] });
  await request("GET", "/api/cart", { token: customerToken() });
  assert.deepEqual(db.calls[0].params, [1]); // user id from the token, not from the request
});

// ---------- checkout ----------

const cartRows = (rows) => (sql) => {
  if (sql.startsWith("SELECT ci.product_id")) return { rows };
  if (sql.startsWith("INSERT INTO orders")) return { rows: [{ id: 42, status: "pending" }] };
  return { rows: [] };
};

test("checkout with an empty cart returns 400 and rolls back", async () => {
  db.handler = cartRows([]);

  const res = await request("POST", "/api/orders", { token: customerToken() });

  assert.equal(res.status, 400);
  assert.ok(db.calls.some((c) => c.sql === "ROLLBACK"));
  assert.ok(!db.calls.some((c) => c.sql === "COMMIT"));
});

test("checkout fails and rolls back when stock is too low", async () => {
  db.handler = cartRows([{ product_id: 5, quantity: 3, name: "Mug", price: "12.00", stock: 2 }]);

  const res = await request("POST", "/api/orders", { token: customerToken() });

  assert.equal(res.status, 400);
  assert.match(res.body.message, /Mug/);
  assert.ok(!db.calls.some((c) => c.sql.startsWith("INSERT INTO orders")));
});

test("checkout locks product rows, creates the order, reduces stock and empties the cart", async () => {
  db.handler = cartRows([
    { product_id: 5, quantity: 2, name: "Mug", price: "12.00", stock: 10 },
    { product_id: 8, quantity: 1, name: "Book", price: "29.90", stock: 4 },
  ]);

  const res = await request("POST", "/api/orders", { token: customerToken() });
  const sqls = db.calls.map((c) => c.sql);

  assert.equal(res.status, 201);
  assert.equal(sqls[0], "BEGIN");
  assert.match(sqls[1], /FOR UPDATE OF p/, "product rows must be locked");

  const order = db.calls.find((c) => c.sql.startsWith("INSERT INTO orders"));
  assert.equal(order.params[1], 53.9); // 2 × 12.00 + 1 × 29.90

  const stockUpdates = db.calls.filter((c) => c.sql.startsWith("UPDATE products SET stock"));
  assert.equal(stockUpdates.length, 2);

  assert.ok(sqls.some((s) => s.startsWith("DELETE FROM cart_items")));
  assert.equal(sqls.at(-1), "COMMIT");
});

test("checkout rolls back if the database fails halfway", async () => {
  db.handler = (sql) => {
    if (sql.startsWith("SELECT ci.product_id")) {
      return { rows: [{ product_id: 5, quantity: 1, name: "Mug", price: "12.00", stock: 10 }] };
    }
    if (sql.startsWith("INSERT INTO orders")) return { rows: [{ id: 42 }] };
    if (sql.startsWith("INSERT INTO order_items")) throw new Error("connection lost");
    return { rows: [] };
  };

  const res = await request("POST", "/api/orders", { token: customerToken() });

  assert.equal(res.status, 500);
  assert.ok(db.calls.some((c) => c.sql === "ROLLBACK"));
  assert.ok(!db.calls.some((c) => c.sql === "COMMIT"));
});

// ---------- admin ----------

test("admin order status must be one of the allowed values", async () => {
  const res = await request("PUT", "/api/admin/orders/1/status", {
    token: adminToken(),
    body: { status: "teleported" },
  });

  assert.equal(res.status, 400);
  assert.equal(db.calls.length, 0);
});

test("dashboard revenue comes from the controller, which excludes cancelled orders", async () => {
  db.handler = (sql) =>
    sql.includes("total_revenue")
      ? { rows: [{ total_users: "3", total_products: "4", total_orders: "5", total_revenue: "99.50",
                   pending_orders: "1", processing_orders: "1", shipped_orders: "1", delivered_orders: "1" }] }
      : { rows: [] };

  const res = await request("GET", "/api/admin/dashboard/stats", { token: adminToken() });

  assert.equal(res.status, 200);
  assert.equal(res.body.stats.total_revenue, 99.5);
  assert.ok(Array.isArray(res.body.recent_orders));
  assert.ok(db.calls.some((c) => c.sql.includes("status != 'cancelled'")));
});

// ---------- errors ----------

test("a non-numeric id gives 400, not a 500 crash", async () => {
  db.handler = () => {
    const error = new Error('invalid input syntax for type integer: "abc"');
    error.code = "22P02";
    throw error;
  };

  const res = await request("GET", "/api/products/abc");
  assert.equal(res.status, 400);
});

test("unknown routes return JSON 404", async () => {
  const res = await request("GET", "/api/does-not-exist");
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});
