const pool = require("../config/db");
// GET /api/products
const getProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { category, sort } = req.query;

    // -------------------------
    // STEP : CATEGORY FILTER
    // -------------------------

    const conditions = [];
    const values = [];

    if (category) {
      values.push(category);

      conditions.push(
        `p.category_id = $${values.length}`
      );
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // -------------------------
    // STEP : SORTING
    // -------------------------

    let orderBy = "p.id ASC";

    if (sort === "price_asc") {
      orderBy = "p.price ASC";
    }

    if (sort === "price_desc") {
      orderBy = "p.price DESC";
    }

    if (sort === "newest") {
      orderBy = "p.created_at DESC";
    }

    // -------------------------
    // PAGINATION
    // -------------------------

    values.push(limit);
    const limitIndex = values.length;

    values.push(offset);
    const offsetIndex = values.length;

    const query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.category_id,
        c.name AS category_name,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c 
        ON p.category_id = c.id

      ${whereClause}

      ORDER BY ${orderBy}

      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `;

    const result = await pool.query(query, values);

    res.status(200).json({
      success: true,
      page,
      limit,
      products: result.rows,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch products",
    });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.image_url,
        p.category_id,
        c.name AS category_name,
        p.created_at,
        p.updated_at
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch product" });
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category_id,
      image_url,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        message: "Name and price are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO products
      (name, description, price, stock, category_id, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        name,
        description || null,
        price,
        stock || 0,
        category_id || null,
        image_url || null,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create product" });
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      stock,
      category_id,
      image_url,
    } = req.body;

    const result = await pool.query(
      `
      UPDATE products
      SET
        name = $1,
        description = $2,
        price = $3,
        stock = $4,
        category_id = $5,
        image_url = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
      `,
      [
        name,
        description || null,
        price,
        stock,
        category_id || null,
        image_url || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};