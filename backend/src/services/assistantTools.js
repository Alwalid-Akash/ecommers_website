// The ONLY things the AI assistant can do. Each tool has:
//   1. a definition: JSON Schema the model reads to decide when/how to call it
//   2. a Zod schema: the model's arguments are untrusted input, like a form
//   3. an implementation: our own read-only SQL
// The model never writes SQL and never touches the database directly.
const { z } = require("zod");
const pool = require("../config/db");

// ─────────────────────────────────────────────────────────────
// 1) DEFINITIONS (what Gemini sees, in Gemini's "functionDeclarations" format)
// ─────────────────────────────────────────────────────────────
const toolDefinitions = [
  {
    name: "search_products",
    description:
      "Search the store's products. Use this for ANY question about which products exist, prices, or availability.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Keywords, e.g. 'wireless headphones'. Empty string to browse everything.",
        },
        category: {
          type: "string",
          description: "Exact category name (get names from list_categories).",
        },
        min_price: { type: "number", description: "Lowest price to include." },
        max_price: { type: "number", description: "Highest price to include." },
        in_stock_only: { type: "boolean", description: "Only products in stock. Defaults to true." },
        sort: {
          type: "string",
          enum: ["relevance", "price_asc", "price_desc", "newest"],
          description: "Sort order. Defaults to relevance.",
        },
      },
    },
  },
  {
    name: "get_product_details",
    description: "Get the full description, price and stock of one product by its id.",
    parameters: {
      type: "object",
      properties: { product_id: { type: "integer", description: "The product's id." } },
      required: ["product_id"],
    },
  },
  {
    name: "list_categories",
    description: "List all product categories with how many products each has.",
  },
];

// ─────────────────────────────────────────────────────────────
// 2) VALIDATION (never trust the model's arguments)
// ─────────────────────────────────────────────────────────────
const searchArgs = z.object({
  query: z.string().max(100).default(""),
  category: z.string().max(100).optional(),
  min_price: z.coerce.number().nonnegative().optional(),
  max_price: z.coerce.number().nonnegative().optional(),
  in_stock_only: z.boolean().default(true),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
});

const detailsArgs = z.object({
  product_id: z.coerce.number().int().positive(),
});

// ORDER BY can't be a $parameter, so the model picks a KEY and we map it
// to fixed SQL. It can never inject its own SQL text.
const ORDER_BY = {
  relevance: "rank DESC, p.id",
  price_asc: "p.price ASC",
  price_desc: "p.price DESC",
  newest: "p.created_at DESC",
};

// ─────────────────────────────────────────────────────────────
// 3) IMPLEMENTATIONS (read-only SQL)
// ─────────────────────────────────────────────────────────────
async function searchProducts(rawArgs) {
  const { query, category, min_price, max_price, in_stock_only, sort } =
    searchArgs.parse(rawArgs);

  // "Wireless Headphones!" → "wireless or headphones"
  // Postgres full-text search: matches ANY word, ranks best matches first,
  // and handles plurals ("headphone" finds "headphones").
  const words = query.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const tsQuery = words.slice(0, 8).join(" or ");

  const result = await pool.query(
    `
    SELECT
      p.id, p.name, p.price, p.stock,
      c.name AS category,
      LEFT(p.description, 200) AS description,
      CASE WHEN $1 = '' THEN 0 ELSE ts_rank(d.doc, s.q) END AS rank
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    CROSS JOIN LATERAL (
      SELECT to_tsvector('english',
        p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(c.name, '')
      ) AS doc
    ) d
    CROSS JOIN LATERAL (SELECT websearch_to_tsquery('english', $1) AS q) s
    WHERE ($1 = '' OR d.doc @@ s.q)
      AND ($2::text    IS NULL OR c.name ILIKE $2)
      AND ($3::numeric IS NULL OR p.price >= $3)
      AND ($4::numeric IS NULL OR p.price <= $4)
      AND (NOT $5::boolean OR p.stock > 0)
    ORDER BY ${ORDER_BY[sort]}
    LIMIT 8
    `,
    [tsQuery, category ?? null, min_price ?? null, max_price ?? null, in_stock_only]
  );

  return {
    count: result.rows.length,
    products: result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price), // pg returns NUMERIC as a string
      stock: row.stock,
      category: row.category,
      description: row.description,
    })),
  };
}

async function getProductDetails(rawArgs) {
  const { product_id } = detailsArgs.parse(rawArgs);

  const result = await pool.query(
    `
    SELECT p.id, p.name, p.description, p.price, p.stock, c.name AS category
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1
    `,
    [product_id]
  );

  if (result.rows.length === 0) return { error: "Product not found" };

  const product = result.rows[0];
  return { product: { ...product, price: Number(product.price) } };
}

async function listCategories() {
  const result = await pool.query(`
    SELECT c.name, COUNT(p.id)::int AS product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name
  `);
  return { categories: result.rows };
}

// ─────────────────────────────────────────────────────────────
// 4) DISPATCHER: runTool("search_products", '{"query":"mug"}')
// ─────────────────────────────────────────────────────────────
const handlers = {
  search_products: searchProducts,
  get_product_details: getProductDetails,
  list_categories: listCategories,
};

async function runTool(name, rawArguments) {
  const handler = handlers[name];
  if (!handler) return { error: `Unknown tool: ${name}` };

  try {
    const parsed =
      typeof rawArguments === "string" ? JSON.parse(rawArguments || "{}") : rawArguments || {};
    // Models often send null or "" for "not set"; drop them so defaults apply.
    const args = Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => value !== null && value !== "")
    );
    return await handler(args);
  } catch (error) {
    // Bad arguments from the model: tell IT what went wrong, so it can retry.
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      return { error: `Invalid arguments: ${error.message}` };
    }
    throw error; // real DB errors go to the error middleware
  }
}

module.exports = { toolDefinitions, runTool };
