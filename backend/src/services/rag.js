// RAG = Retrieval-Augmented Generation.
// Before Gemini answers, we RETRIEVE the texts whose meaning is closest to the
// question (products and shop info pages) and give them to Gemini as facts.
//
//   1. Indexing: every product and every section of backend/knowledge/*.md is
//      turned into a vector (embed) and stored in the rag_chunks table.
//   2. Searching: the question is turned into a vector too, and pgvector
//      finds the stored vectors that are closest to it.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const pool = require("../config/db");
const { embed, embeddingModel } = require("./gemini");

// Where the shop info pages and the table definition live
const KNOWLEDGE_DIR = path.join(__dirname, "..", "..", "knowledge");
const SCHEMA_FILE = path.join(__dirname, "..", "config", "rag.sql");
const MAX_CHUNK_CHARS = 4000;

// pgvector wants vectors written like '[0.1,0.2,...]'
const toVector = (values) => `[${values.join(",")}]`;

// ─────────────────────────────────────────────────────────────
// 1) What gets indexed
// ─────────────────────────────────────────────────────────────

// A product's searchable text. Price and stock are left out on purpose:
// they change often (every checkout!) but don't change what a product IS.
function productText(product) {
  return [product.name, product.category && `Category: ${product.category}`, product.description]
    .filter(Boolean)
    .join("\n");
}

// Reads backend/knowledge/*.md and cuts each file into sections at "## ".
// Each section becomes one searchable chunk. HTML comments are removed.
function loadKnowledgeChunks(dir = KNOWLEDGE_DIR) {
  if (!fs.existsSync(dir)) return [];

  const chunks = [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && f !== "README.md").sort();

  for (const file of files) {
    const text = fs.readFileSync(path.join(dir, file), "utf8").replace(/<!--[\s\S]*?-->/g, "");
    const pageTitle = text.match(/^#\s+(.+)$/m)?.[1].trim() || file.replace(/\.md$/, "");

    text.split(/^##\s+/m).forEach((section, index) => {
      const lines = section.split("\n");
      const heading = index === 0 ? null : lines[0].trim();
      const body = (index === 0 ? section.replace(/^#\s+.+$/m, "") : lines.slice(1).join("\n")).trim();
      if (!body) return;

      chunks.push({
        key: `${file}#${index}`,
        title: heading ? `${pageTitle}: ${heading}` : pageTitle,
        content: body.slice(0, MAX_CHUNK_CHARS),
      });
    });
  }

  return chunks;
}

// Fingerprint: changes when the text OR the embedding model changes.
const fingerprint = (chunk) =>
  crypto.createHash("sha256").update(`${embeddingModel()}\n${chunk.title}\n${chunk.content}`).digest("hex");

// ─────────────────────────────────────────────────────────────
// 2) Indexing: make the rag_chunks table match products + knowledge files
// ─────────────────────────────────────────────────────────────

// Creates the pgvector extension, table and index if they don't exist yet
async function ensureSchema() {
  await pool.query(fs.readFileSync(SCHEMA_FILE, "utf8"));
}

async function syncIndex({ knowledgeDir = KNOWLEDGE_DIR } = {}) {
  await ensureSchema();

  // a) Everything that SHOULD be searchable: all products + all knowledge sections
  const products = await pool.query(`
    SELECT p.id, p.name, p.description, c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
  `);

  const wanted = [
    ...products.rows.map((p) => ({
      key: `product:${p.id}`, sourceType: "product", productId: p.id, title: p.name, content: productText(p),
    })),
    ...loadKnowledgeChunks(knowledgeDir).map((c) => ({ ...c, sourceType: "knowledge", productId: null })),
  ].map((chunk) => ({ ...chunk, hash: fingerprint(chunk) }));

  // b) Compare fingerprints: only new or changed texts need a new vector
  const existing = await pool.query("SELECT source_key, content_hash FROM rag_chunks");
  const knownHashes = new Map(existing.rows.map((row) => [row.source_key, row.content_hash]));
  const changed = wanted.filter((chunk) => knownHashes.get(chunk.key) !== chunk.hash);

  // c) Ask Google for the vectors of the changed texts and save them
  if (changed.length > 0) {
    const vectors = await embed(
      changed.map((chunk) => ({ title: chunk.title, text: chunk.content })),
      { kind: "document" }
    );

    for (let i = 0; i < changed.length; i++) {
      const chunk = changed[i];
      await pool.query(
        `
        INSERT INTO rag_chunks
          (source_type, source_key, product_id, title, content, content_hash, embedding)
        VALUES ($1, $2, $3, $4, $5, $6, $7::vector)
        ON CONFLICT (source_key) DO UPDATE SET
          title = EXCLUDED.title,
          content = EXCLUDED.content,
          content_hash = EXCLUDED.content_hash,
          embedding = EXCLUDED.embedding,
          updated_at = CURRENT_TIMESTAMP
        `,
        [chunk.sourceType, chunk.key, chunk.productId, chunk.title, chunk.content, chunk.hash, toVector(vectors[i])]
      );
    }
  }

  // d) Remove sections that were deleted from the knowledge files
  //    (deleted products are removed automatically: ON DELETE CASCADE)
  const removed = await pool.query(
    "DELETE FROM rag_chunks WHERE NOT (source_key = ANY($1::text[]))",
    [wanted.map((chunk) => chunk.key)]
  );

  return { total: wanted.length, embedded: changed.length, removed: removed.rowCount ?? 0 };
}

// Runs syncIndex in the background, one at a time. Called on server start
// and after admins change products, so the index stays up to date.
let running = null;
let runAgain = false;

function scheduleSync(reason = "update") {
  // No indexing in tests, and none without an API key
  if (process.env.NODE_ENV === "test" || !process.env.GEMINI_API_KEY) return Promise.resolve();

  if (running) {
    runAgain = true; // another change arrived: sync once more when this one ends
    return running;
  }

  running = (async () => {
    try {
      do {
        runAgain = false;
        const result = await syncIndex();
        console.log(
          `🔎 RAG index ready (${reason}): ${result.total} texts, ${result.embedded} newly embedded, ${result.removed} removed`
        );
      } while (runAgain);
    } catch (error) {
      // Never break the shop: search falls back to keyword matching.
      console.warn(`⚠️  RAG index not updated: ${error.message}`);
    } finally {
      running = null;
    }
  })();

  return running;
}

// ─────────────────────────────────────────────────────────────
// 3) Searching
// ─────────────────────────────────────────────────────────────
const round = (number) => Math.round(number * 100) / 100;

// Products whose meaning is closest to the question, with the usual filters.
async function searchProducts({ query, category, min_price, max_price, in_stock_only = true, sort = "relevance" }) {
  // a) The question → a vector
  const [queryVector] = await embed([query], { kind: "query" });

  // b) pgvector: closest products first (<=> = cosine distance), plus filters
  const result = await pool.query(
    `
    SELECT
      p.id, p.name, p.price, p.stock,
      c.name AS category,
      LEFT(p.description, 200) AS description,
      1 - (r.embedding <=> $1::vector) AS similarity
    FROM rag_chunks r
    JOIN products p ON p.id = r.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE r.source_type = 'product'
      AND ($2::text    IS NULL OR c.name ILIKE $2)
      AND ($3::numeric IS NULL OR p.price >= $3)
      AND ($4::numeric IS NULL OR p.price <= $4)
      AND (NOT $5::boolean OR p.stock > 0)
    ORDER BY r.embedding <=> $1::vector
    LIMIT 8
    `,
    [toVector(queryVector), category ?? null, min_price ?? null, max_price ?? null, in_stock_only]
  );

  // c) Keep only results close to the best match, so "cheapest laptop"
  //    doesn't return a T-shirt sorted first by price.
  const best = Number(result.rows[0]?.similarity ?? 0);
  let products = result.rows
    .filter((row) => Number(row.similarity) >= best - 0.12)
    .map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
      stock: row.stock,
      category: row.category,
      description: row.description,
      relevance: round(Number(row.similarity)),
    }));

  // d) Optional price sorting among the relevant results
  if (sort === "price_asc") products = products.sort((a, b) => a.price - b.price);
  if (sort === "price_desc") products = products.sort((a, b) => b.price - a.price);

  return { count: products.length, products };
}

// Sections of the shop info pages that best answer the question.
async function searchKnowledge(question, { limit = 3 } = {}) {
  try {
    const [queryVector] = await embed([question], { kind: "query" });

    const result = await pool.query(
      `
      SELECT title, content, 1 - (embedding <=> $1::vector) AS similarity
      FROM rag_chunks
      WHERE source_type = 'knowledge'
      ORDER BY embedding <=> $1::vector
      LIMIT $2
      `,
      [toVector(queryVector), limit]
    );

    if (result.rows.length > 0) {
      return {
        sources: result.rows.map((row) => ({
          title: row.title,
          text: row.content,
          relevance: round(Number(row.similarity)),
        })),
      };
    }
  } catch (error) {
    console.warn(`⚠️  Knowledge search fell back to keywords: ${error.message}`);
  }

  return keywordSearchKnowledge(question, { limit });
}

// Backup when embeddings are unavailable: count shared words.
function keywordSearchKnowledge(question, { limit = 3, knowledgeDir = KNOWLEDGE_DIR } = {}) {
  const words = new Set(question.toLowerCase().match(/[\p{L}\p{N}]{3,}/gu) || []);

  const scored = loadKnowledgeChunks(knowledgeDir)
    .map((chunk) => {
      const text = `${chunk.title} ${chunk.content}`.toLowerCase();
      return { chunk, score: [...words].filter((word) => text.includes(word)).length };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return { sources: scored.map(({ chunk }) => ({ title: chunk.title, text: chunk.content })) };
}

module.exports = {
  syncIndex,
  scheduleSync,
  searchProducts,
  searchKnowledge,
  keywordSearchKnowledge,
  loadKnowledgeChunks,
  productText,
};
