// Tests the RAG system (services/rag.js) with a fake database and fake
// embeddings, so no Google or Postgres is needed.
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");

console.warn = () => {}; // hide the expected fallback warnings

// ---------- fake embeddings ----------
// Replaces gemini.js. Every text gets the same simple vector, and we record
// what was sent, so the tests can check WHAT gets embedded and WHEN.
const DIMENSIONS = 768;
const embedCalls = [];
let embedFails = false;
const geminiPath = path.join(__dirname, "..", "src", "services", "gemini.js");

class AIError extends Error {}
require.cache[geminiPath] = {
  id: geminiPath,
  filename: geminiPath,
  loaded: true,
  exports: {
    AIError,
    EMBEDDING_DIMENSIONS: DIMENSIONS,
    embeddingModel: () => "test-embedding-model",
    embed: async (items, { kind }) => {
      embedCalls.push({ items, kind });
      if (embedFails) throw new AIError("Google is busy");
      return items.map(() => Array.from({ length: DIMENSIONS }, (_, i) => (i === 0 ? 1 : 0)));
    },
  },
};

const { test, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("./helpers"); // fake database (also loads the app)
const rag = require("../src/services/rag");
const { runTool } = require("../src/services/assistantTools");

// Creates a temporary knowledge folder with the given files
function knowledgeDir(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "knowledge-"));
  for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}

const SHIPPING = `<!-- Sample text: edit me -->
# Shipping

## Delivery times
Delivery inside Germany takes 2–4 business days.

## Shipping costs
Free for orders over €50.
`;

beforeEach(() => {
  db.reset();
  embedCalls.length = 0;
  embedFails = false;
});

// ── Knowledge files ────────────────────────────────────────────

test("knowledge files are split into one chunk per '##' section, without comments", () => {
  const dir = knowledgeDir({ "shipping.md": SHIPPING, "README.md": "# ignored" });

  const chunks = rag.loadKnowledgeChunks(dir);

  assert.deepEqual(chunks, [
    { key: "shipping.md#1", title: "Shipping: Delivery times", content: "Delivery inside Germany takes 2–4 business days." },
    { key: "shipping.md#2", title: "Shipping: Shipping costs", content: "Free for orders over €50." },
  ]);
});

test("a product's searchable text has name, category and description, but not price or stock", () => {
  const text = rag.productText({ name: "Yoga Mat", category: "Sports", description: "Non-slip", price: 25, stock: 3 });
  assert.equal(text, "Yoga Mat\nCategory: Sports\nNon-slip");
});

// ── Indexing ───────────────────────────────────────────────────

// Fake database answers for syncIndex: the products + what's already stored
function fakeIndexDb({ products = [], existing = [] } = {}) {
  db.handler = (sql) => {
    if (sql.includes("FROM products p LEFT JOIN categories")) return { rows: products };
    if (sql.startsWith("SELECT source_key, content_hash")) return { rows: existing };
    return { rows: [] };
  };
}

test("indexing creates the table, embeds every text once and stores the vectors", async () => {
  fakeIndexDb({ products: [{ id: 7, name: "Coffee Maker", description: "Brews 10 cups", category: "Home" }] });
  const dir = knowledgeDir({ "shipping.md": SHIPPING });

  const result = await rag.syncIndex({ knowledgeDir: dir });

  assert.deepEqual(result, { total: 3, embedded: 3, removed: 0 });
  assert.match(db.calls[0].sql, /CREATE EXTENSION IF NOT EXISTS vector/);
  assert.equal(embedCalls.length, 1, "all texts in one embed call");
  assert.equal(embedCalls[0].kind, "document");
  assert.deepEqual(embedCalls[0].items[0], { title: "Coffee Maker", text: "Coffee Maker\nCategory: Home\nBrews 10 cups" });

  const inserts = db.calls.filter((c) => c.sql.startsWith("INSERT INTO rag_chunks"));
  assert.equal(inserts.length, 3);
  assert.deepEqual(inserts[0].params.slice(0, 4), ["product", "product:7", 7, "Coffee Maker"]);
  assert.match(inserts[0].params[6], /^\[1,0,0/, "vector is sent in pgvector's [a,b,c] format");
});

test("indexing again embeds nothing when nothing changed", async () => {
  fakeIndexDb({ products: [{ id: 7, name: "Coffee Maker", description: "Brews 10 cups", category: "Home" }] });
  const dir = knowledgeDir({ "shipping.md": SHIPPING });
  await rag.syncIndex({ knowledgeDir: dir });
  const stored = db.calls
    .filter((c) => c.sql.startsWith("INSERT INTO rag_chunks"))
    .map((c) => ({ source_key: c.params[1], content_hash: c.params[5] }));

  db.reset();
  embedCalls.length = 0;
  fakeIndexDb({ products: [{ id: 7, name: "Coffee Maker", description: "Brews 10 cups", category: "Home" }], existing: stored });
  const result = await rag.syncIndex({ knowledgeDir: dir });

  assert.equal(result.embedded, 0);
  assert.equal(embedCalls.length, 0, "no request to Google");
});

test("a changed product description is embedded again; removed sections are deleted", async () => {
  const dir = knowledgeDir({ "shipping.md": SHIPPING });
  fakeIndexDb({
    products: [{ id: 7, name: "Coffee Maker", description: "NEW description", category: "Home" }],
    existing: [{ source_key: "product:7", content_hash: "old-hash" }],
  });

  const result = await rag.syncIndex({ knowledgeDir: dir });

  assert.equal(embedCalls[0].items.length, 3); // changed product + 2 new sections
  const del = db.calls.find((c) => c.sql.startsWith("DELETE FROM rag_chunks"));
  assert.deepEqual(del.params[0], ["product:7", "shipping.md#1", "shipping.md#2"]);
  assert.equal(result.embedded, 3);
});

// ── Searching ──────────────────────────────────────────────────

// A fake search result row from the database
const row = (id, name, price, similarity) => ({
  id, name, price: String(price), stock: 5, category: "Home", description: "", similarity,
});

test("product search embeds the question as a 'query' and ranks by vector distance", async () => {
  db.handler = () => ({ rows: [row(7, "Coffee Maker", 49.9, 0.82)] });

  const result = await rag.searchProducts({ query: "gift for a coffee lover", max_price: 100, in_stock_only: true });

  assert.deepEqual(embedCalls[0], { items: ["gift for a coffee lover"], kind: "query" });
  assert.match(db.calls[0].sql, /ORDER BY r\.embedding <=> \$1::vector/);
  assert.deepEqual(db.calls[0].params.slice(1), [null, null, 100, true]);
  assert.deepEqual(result.products[0], {
    id: 7, name: "Coffee Maker", price: 49.9, stock: 5, category: "Home", description: "", relevance: 0.82,
  });
});

test("weak matches are dropped before sorting by price", async () => {
  db.handler = () => ({
    rows: [row(3, "MacBook Pro", 2499, 0.81), row(9, "Laptop Sleeve", 39, 0.74), row(4, "T-Shirt", 19.99, 0.41)],
  });

  const result = await rag.searchProducts({ query: "cheap laptop", sort: "price_asc" });

  assert.deepEqual(result.products.map((p) => p.name), ["Laptop Sleeve", "MacBook Pro"]); // no T-shirt
});

test("store info search returns the closest sections", async () => {
  db.handler = () => ({ rows: [{ title: "Shipping: Delivery times", content: "2–4 business days.", similarity: 0.77 }] });

  const result = await rag.searchKnowledge("how long does delivery take?");

  assert.deepEqual(result.sources, [{ title: "Shipping: Delivery times", text: "2–4 business days.", relevance: 0.77 }]);
  assert.match(db.calls[0].sql, /source_type = 'knowledge'/);
});

test("if Google is busy, store info search falls back to keyword matching", async () => {
  embedFails = true;
  const dir = knowledgeDir({ "shipping.md": SHIPPING });

  const result = rag.keywordSearchKnowledge("shipping costs?", { knowledgeDir: dir });

  assert.equal(result.sources[0].title, "Shipping: Shipping costs");
});

// ── The assistant's tools ──────────────────────────────────────

test("search_products uses meaning-based search when it works", async () => {
  db.handler = () => ({ rows: [row(7, "Coffee Maker", 49.9, 0.82)] });

  const result = await runTool("search_products", { query: "something for coffee" });

  assert.equal(result.products[0].relevance, 0.82);
  assert.match(db.calls[0].sql, /rag_chunks/);
});

test("search_products falls back to keyword search when embeddings fail", async () => {
  embedFails = true;
  db.handler = () => ({ rows: [row(7, "Coffee Maker", 49.9)] });

  const result = await runTool("search_products", { query: "coffee" });

  assert.equal(result.products[0].name, "Coffee Maker");
  assert.match(db.calls[0].sql, /websearch_to_tsquery/, "classic keyword search");
});

test("search_store_info validates the question and returns sources", async () => {
  db.handler = () => ({ rows: [{ title: "Returns: Return period", content: "30 days.", similarity: 0.7 }] });

  const ok = await runTool("search_store_info", { question: "Can I return something?" });
  const bad = await runTool("search_store_info", {});

  assert.equal(ok.sources[0].text, "30 days.");
  assert.match(bad.error, /Invalid arguments/);
});
