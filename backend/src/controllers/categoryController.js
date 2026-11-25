const pool = require("../config/db");
// RAG: keeps the AI search index up to date after changes (runs in the background)
const { scheduleSync } = require("../services/rag");

// GET /api/categories
const getCategories = async (req, res, next) => {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        created_at
      FROM categories
      ORDER BY id ASC
      `
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      categories: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/categories/:id
const getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        description,
        created_at
      FROM categories
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      category: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/categories
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Body already validated by categorySchema (see categoryRoutes.js)
    const result = await pool.query(
      `
      INSERT INTO categories
      (name, description)
      VALUES ($1, $2)
      RETURNING *
      `,
      [
        name,
        description || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      category: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    next(error);
  }
};

// PUT /api/categories/:id
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Body already validated by categorySchema (see categoryRoutes.js)
    const result = await pool.query(
      `
      UPDATE categories
      SET
        name = $1,
        description = $2
      WHERE id = $3
      RETURNING *
      `,
      [
        name,
        description || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    scheduleSync("updateCategory"); // update the AI search index in the background

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      category: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    next(error);
  }
};

// DELETE /api/categories/:id
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM categories
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    scheduleSync("deleteCategory"); // update the AI search index in the background

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
      category: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};